/**
 * Withdrawals Controller E2E Tests
 * Tests withdrawal management endpoints: create, approve, reject, list
 */

import { Decimal } from '@prisma/client/runtime/library';
import request from 'supertest';
import prisma from '../../src/prismaClient';
import { getApp, resetDatabase } from '../setup';
import { authHeader, createTestUser, createTestWallet, createTestWithdrawal } from '../test-utils';

describe('Withdrawals Controller (E2E)', () => {
  const app = getApp();
  let userAuth: { user: any; token: string };
  let adminAuth: { user: any; token: string };
  let userWallet: any;

  beforeEach(async () => {
    await resetDatabase();
    
    // Create test users
    userAuth = await createTestUser();
    adminAuth = await createTestUser({ role: 'admin' });
    
    // Create wallet for user with sufficient balance
    userWallet = await createTestWallet(userAuth.user.id, 'BTC', 10);
  });

  describe('POST /api/withdrawals', () => {
    it('should create a withdrawal request', async () => {
      const withdrawalData = {
        cryptoType: 'BTC',
        cryptoAmount: 0.1,
        withdrawalAddress: 'test-btc-address-123',
      };

      const response = await request(app)
        .post('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .send(withdrawalData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: userAuth.user.id,
        cryptoAmount: expect.any(String),
        cryptoType: 'BTC',
        status: 'PENDING',
        withdrawalAddress: withdrawalData.withdrawalAddress,
      });
      expect(response.body).toHaveProperty('id');
      expect(parseFloat(response.body.cryptoAmount)).toBeCloseTo(0.1);
    });

    it('should not allow withdrawal with insufficient balance', async () => {
      const withdrawalData = {
        cryptoType: 'BTC',
        cryptoAmount: 100, // More than wallet balance
        withdrawalAddress: 'test-btc-address-123',
      };

      const response = await request(app)
        .post('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .send(withdrawalData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('insufficient');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate amount is positive', async () => {
      const withdrawalData = {
        currency: 'BTC',
        amount: -0.1,
        destinationAddress: 'test-btc-address-123',
      };

      const response = await request(app)
        .post('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .send(withdrawalData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/withdrawals')
        .send({
          currency: 'BTC',
          amount: 0.1,
          withdrawalAddress: 'test-address',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/withdrawals', () => {
    it('should return user withdrawals', async () => {
      // Create test withdrawals
      await createTestWithdrawal(userAuth.user.id, 0.1, 'BTC', 'pending');
      await createTestWithdrawal(userAuth.user.id, 0.2, 'BTC', 'completed');

      const response = await request(app)
        .get('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: userAuth.user.id,
            amount: expect.any(String),
            status: 'pending',
          }),
          expect.objectContaining({
            userId: userAuth.user.id,
            amount: expect.any(String),
            status: 'completed',
          }),
        ])
      );
    });

    it('should not return withdrawals from other users', async () => {
      // Create withdrawal for another user
      const otherUser = await createTestUser();
      await createTestWithdrawal(otherUser.user.id, 0.1, 'BTC', 'pending');

      // Request withdrawals for first user
      const response = await request(app)
        .get('/api/withdrawals')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should filter by status', async () => {
      await createTestWithdrawal(userAuth.user.id, 0.1, 'BTC', 'pending');
      await createTestWithdrawal(userAuth.user.id, 0.2, 'BTC', 'completed');
      await createTestWithdrawal(userAuth.user.id, 0.3, 'BTC', 'rejected');

      const response = await request(app)
        .get('/api/withdrawals?status=pending')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('pending');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/withdrawals')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/withdrawals/:id', () => {
    it('should return withdrawal details', async () => {
      const withdrawal = await createTestWithdrawal(userAuth.user.id, 0.5, 'BTC', 'pending');

      const response = await request(app)
        .get(`/api/withdrawals/${withdrawal.id}`)
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toMatchObject({
        id: withdrawal.id,
        userId: userAuth.user.id,
        amount: expect.any(String),
        currency: 'BTC',
        status: 'pending',
      });
    });

    it('should not return withdrawal from another user', async () => {
      const otherUser = await createTestUser();
      const withdrawal = await createTestWithdrawal(otherUser.user.id, 0.1, 'BTC');

      const response = await request(app)
        .get(`/api/withdrawals/${withdrawal.id}`)
        .set(authHeader(userAuth.token))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent withdrawal', async () => {
      const response = await request(app)
        .get('/api/withdrawals/non-existent-id')
        .set(authHeader(userAuth.token))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Admin Endpoints', () => {
    let pendingWithdrawal: any;

    beforeEach(async () => {
      // Create a pending withdrawal for testing
      pendingWithdrawal = await createTestWithdrawal(userAuth.user.id, 0.5, 'BTC', 'pending');
    });

    describe('GET /api/withdrawals/admin/pending', () => {
      it('should return all pending withdrawals for admin', async () => {
        // Create more pending withdrawals
        await createTestWithdrawal(userAuth.user.id, 0.3, 'ETH', 'pending');
        await createTestWithdrawal(userAuth.user.id, 0.2, 'BTC', 'completed');

        const response = await request(app)
          .get('/api/withdrawals/admin/pending')
          .set(authHeader(adminAuth.token))
          .expect(200);

        expect(response.body.length).toBeGreaterThanOrEqual(2);
        expect(response.body.every((w: any) => w.status === 'pending')).toBe(true);
      });

      it('should not allow non-admin to access pending withdrawals', async () => {
        const response = await request(app)
          .get('/api/withdrawals/admin/pending')
          .set(authHeader(userAuth.token))
          .expect(403);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('admin');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/withdrawals/admin/pending')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/withdrawals/:id/approve', () => {
      it('should approve a pending withdrawal', async () => {
        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/approve`)
          .set(authHeader(adminAuth.token))
          .expect(200);

        expect(response.body).toMatchObject({
          id: pendingWithdrawal.id,
          status: 'approved',
        });

        // Verify in database
        const updatedWithdrawal = await prisma.crypto_withdrawals.findUnique({
          where: { id: pendingWithdrawal.id },
        });
        expect(updatedWithdrawal?.status).toBe('approved');
      });

      it('should deduct amount from wallet balance after approval', async () => {
        const initialBalance = userWallet.balance;
        const withdrawalAmount = pendingWithdrawal.amount;

        await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/approve`)
          .set(authHeader(adminAuth.token))
          .expect(200);

        // Check wallet balance was updated
        const updatedWallet = await prisma.token_wallets.findUnique({
          where: { id: userWallet.id },
        });

        expect(updatedWallet?.balance.toString()).toBe(
          new Decimal(initialBalance).minus(withdrawalAmount).toString()
        );
      });

      it('should not approve already processed withdrawal', async () => {
        // Approve once
        await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/approve`)
          .set(authHeader(adminAuth.token))
          .expect(200);

        // Try to approve again
        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/approve`)
          .set(authHeader(adminAuth.token))
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should not allow non-admin to approve', async () => {
        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/approve`)
          .set(authHeader(userAuth.token))
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/withdrawals/:id/reject', () => {
      it('should reject a pending withdrawal', async () => {
        const adminNotes = 'Insufficient verification documents';

        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/reject`)
          .set(authHeader(adminAuth.token))
          .send({ reason: adminNotes })
          .expect(200);

        expect(response.body).toMatchObject({
          id: pendingWithdrawal.id,
          status: 'REJECTED',
          adminNotes,
        });

        // Verify in database
        const updatedWithdrawal = await prisma.crypto_withdrawals.findUnique({
          where: { id: pendingWithdrawal.id },
        });
        expect(updatedWithdrawal?.status).toBe('REJECTED');
        expect(updatedWithdrawal?.adminNotes).toBe(adminNotes);
      });

      it('should not deduct balance on rejection', async () => {
        const initialBalance = userWallet.balance;

        await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/reject`)
          .set(authHeader(adminAuth.token))
          .send({ reason: 'Test rejection' })
          .expect(200);

        // Check wallet balance unchanged
        const updatedWallet = await prisma.token_wallets.findUnique({
          where: { id: userWallet.id },
        });

        expect(updatedWallet?.balance.toString()).toBe(initialBalance.toString());
      });

      it('should require rejection reason', async () => {
        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/reject`)
          .set(authHeader(adminAuth.token))
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should not allow non-admin to reject', async () => {
        const response = await request(app)
          .post(`/api/withdrawals/${pendingWithdrawal.id}/reject`)
          .set(authHeader(userAuth.token))
          .send({ reason: 'Test' })
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/withdrawals/admin/stats', () => {
      it('should return withdrawal statistics for admin', async () => {
        // Create various withdrawals
        await createTestWithdrawal(userAuth.user.id, 0.1, 'BTC', 'completed');
        await createTestWithdrawal(userAuth.user.id, 0.2, 'ETH', 'pending');
        await createTestWithdrawal(userAuth.user.id, 0.3, 'BTC', 'rejected');

        const response = await request(app)
          .get('/api/withdrawals/admin/stats')
          .set(authHeader(adminAuth.token))
          .expect(200);

        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('pending');
        expect(response.body).toHaveProperty('completed');
        expect(response.body).toHaveProperty('rejected');
        expect(response.body).toHaveProperty('totalAmount');
      });

      it('should not allow non-admin to access stats', async () => {
        const response = await request(app)
          .get('/api/withdrawals/admin/stats')
          .set(authHeader(userAuth.token))
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('DELETE /api/withdrawals/:id', () => {
    it('should allow user to cancel pending withdrawal', async () => {
      const withdrawal = await createTestWithdrawal(userAuth.user.id, 0.1, 'BTC', 'pending');

      const response = await request(app)
        .delete(`/api/withdrawals/${withdrawal.id}`)
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify withdrawal status updated to cancelled
      const updatedWithdrawal = await prisma.crypto_withdrawals.findUnique({
        where: { id: withdrawal.id },
      });
      expect(updatedWithdrawal?.status).toBe('cancelled');
    });

    it('should not allow cancelling approved withdrawal', async () => {
      const withdrawal = await createTestWithdrawal(userAuth.user.id, 0.1, 'BTC', 'approved');

      const response = await request(app)
        .delete(`/api/withdrawals/${withdrawal.id}`)
        .set(authHeader(userAuth.token))
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not allow cancelling withdrawal of another user', async () => {
      const otherUser = await createTestUser();
      const withdrawal = await createTestWithdrawal(otherUser.user.id, 0.1, 'BTC', 'pending');

      const response = await request(app)
        .delete(`/api/withdrawals/${withdrawal.id}`)
        .set(authHeader(userAuth.token))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });
});
