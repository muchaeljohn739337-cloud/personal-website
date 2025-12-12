/**
 * Wallets Controller E2E Tests
 * Tests wallet management endpoints: create, read, update, balance
 */

import { Decimal } from '@prisma/client/runtime/library';
import request from 'supertest';
import prisma from '../../src/prismaClient';
import { getApp, resetDatabase } from '../setup';
import { authHeader, createTestUser, createTestWallet } from '../test-utils';

describe('Wallets Controller (E2E)', () => {
  const app = getApp();
  let userAuth: { user: any; token: string };
  let adminAuth: { user: any; token: string };

  beforeEach(async () => {
    await resetDatabase();
    
    // Create test users
    userAuth = await createTestUser();
    adminAuth = await createTestUser({ role: 'admin' });
  });

  describe('GET /api/tokens/wallets', () => {
    it('should return empty array when no wallets exist', async () => {
      const response = await request(app)
        .get('/api/tokens/wallets')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return user wallets', async () => {
      // Create test wallets
      await createTestWallet(userAuth.user.id, 'BTC', 1000);
      await createTestWallet(userAuth.user.id, 'ETH', 500);

      const response = await request(app)
        .get('/api/tokens/wallets')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tokenType: expect.any(String),
            balance: expect.any(String),
          }),
          expect.objectContaining({
            tokenType: expect.any(String),
            balance: expect.any(String),
          }),
        ])
      );
    });

    it('should not return wallets from other users', async () => {
      // Create wallet for another user
      const otherUser = await createTestUser();
      await createTestWallet(otherUser.user.id, 'BTC');

      // Request wallets for first user
      const response = await request(app)
        .get('/api/tokens/wallets')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tokens/wallets')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tokens/create-wallet', () => {
    it('should create a new wallet', async () => {
      const walletData = {
        tokenType: 'ADVANCIA',
      };

      const response = await request(app)
        .post('/api/tokens/create-wallet')
        .set(authHeader(userAuth.token))
        .send(walletData)
        .expect(201);

      expect(response.body).toMatchObject({
        tokenType: walletData.tokenType,
        balance: expect.any(String),
      });
      expect(response.body).toHaveProperty('id');
    });

    it('should not create duplicate wallet for same user', async () => {
      const walletData = { tokenType: 'ADVANCIA' };

      // First creation should succeed
      await request(app)
        .post('/api/tokens/create-wallet')
        .set(authHeader(userAuth.token))
        .send(walletData)
        .expect(201);

      // Second creation with same currency should fail
      const response = await request(app)
        .post('/api/tokens/create-wallet')
        .set(authHeader(userAuth.token))
        .send(walletData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate tokenType parameter', async () => {
      const response = await request(app)
        .post('/api/tokens/create-wallet')
        .set(authHeader(userAuth.token))
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/tokens/create-wallet')
        .send({ tokenType: 'ADVANCIA' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tokens/balance', () => {
    it('should return total balance across all wallets', async () => {
      // Create test wallets with different balances
      await createTestWallet(userAuth.user.id, 'BTC', 1.5);
      await createTestWallet(userAuth.user.id, 'ETH', 10.0);

      const response = await request(app)
        .get('/api/tokens/balance')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveProperty('BTC');
      expect(response.body).toHaveProperty('ETH');
      expect(parseFloat(response.body.BTC)).toBeCloseTo(1.5);
      expect(parseFloat(response.body.ETH)).toBeCloseTo(10.0);
    });

    it('should return empty object when no wallets exist', async () => {
      const response = await request(app)
        .get('/api/tokens/balance')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tokens/balance')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tokens/wallet/:id', () => {
    it('should return wallet details', async () => {
      const wallet = await createTestWallet(userAuth.user.id, 'BTC', 1000);

      const response = await request(app)
        .get(`/api/tokens/wallet/${wallet.id}`)
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toMatchObject({
        id: wallet.id,
        tokenType: expect.any(String),
        balance: expect.any(String),
      });
    });

    it('should not return wallet from another user', async () => {
      // Create wallet for another user
      const otherUser = await createTestUser();
      const wallet = await createTestWallet(otherUser.user.id, 'BTC');

      const response = await request(app)
        .get(`/api/tokens/wallet/${wallet.id}`)
        .set(authHeader(userAuth.token))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await request(app)
        .get('/api/tokens/wallet/non-existent-id')
        .set(authHeader(userAuth.token))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/tokens/wallet/:id', () => {
    it('should update wallet settings', async () => {
      const wallet = await createTestWallet(userAuth.user.id, 'ADVANCIA');

      const updateData = {
        lockedBalance: 100,
      };

      const response = await request(app)
        .put(`/api/tokens/wallet/${wallet.id}`)
        .set(authHeader(userAuth.token))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: wallet.id,
        lockedBalance: expect.any(String),
      });

      // Verify in database
      const updatedWallet = await prisma.token_wallets.findUnique({
        where: { id: wallet.id },
      });
      expect(updatedWallet?.lockedBalance.toString()).toBe('100');
    });

    it('should not allow updating balance directly', async () => {
      const wallet = await createTestWallet(userAuth.user.id, 'BTC', 1000);

      const response = await request(app)
        .put(`/api/tokens/wallet/${wallet.id}`)
        .set(authHeader(userAuth.token))
        .send({ balance: 9999 })
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // Verify balance unchanged
      const unchangedWallet = await prisma.token_wallets.findUnique({
        where: { id: wallet.id },
      });
      expect(unchangedWallet?.balance.toString()).toBe('1000');
    });

    it('should not update wallet from another user', async () => {
      const otherUser = await createTestUser();
      const wallet = await createTestWallet(otherUser.user.id, 'ADVANCIA');

      const response = await request(app)
        .put(`/api/tokens/wallet/${wallet.id}`)
        .set(authHeader(userAuth.token))
        .send({ lockedBalance: 100 })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tokens/transactions', () => {
    it('should return wallet transactions', async () => {
      const wallet = await createTestWallet(userAuth.user.id, 'BTC');

      // Create test transactions
      await prisma.token_transactions.create({
        data: {
          id: `txn-${Date.now()}-1`,
          walletId: wallet.id,
          type: 'deposit',
          amount: new Decimal(0.1),
          status: 'COMPLETED',
        },
      });

      await prisma.token_transactions.create({
        data: {
          id: `txn-${Date.now()}-2`,
          walletId: wallet.id,
          type: 'withdrawal',
          amount: new Decimal(0.05),
          status: 'PENDING',
        },
      });

      const response = await request(app)
        .get('/api/tokens/transactions')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'deposit',
            amount: expect.any(String),
            status: 'COMPLETED',
          }),
          expect.objectContaining({
            type: 'withdrawal',
            amount: expect.any(String),
            status: 'PENDING',
          }),
        ])
      );
    });

    it('should filter transactions by wallet', async () => {
      const wallet1 = await createTestWallet(userAuth.user.id, 'BTC');
      const wallet2 = await createTestWallet(userAuth.user.id, 'ETH');

      // Create transactions for both wallets
      await prisma.token_transactions.create({
        data: {
          id: `txn-${Date.now()}-3`,
          walletId: wallet1.id,
          type: 'deposit',
          amount: new Decimal(0.1),
          status: 'COMPLETED',
        },
      });

      await prisma.token_transactions.create({
        data: {
          id: `txn-${Date.now()}-4`,
          walletId: wallet2.id,
          type: 'deposit',
          amount: new Decimal(1.0),
          status: 'COMPLETED',
        },
      });

      const response = await request(app)
        .get(`/api/tokens/transactions?walletId=${wallet1.id}`)
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        walletId: wallet1.id,
      });
    });
  });
});
