import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Prisma client from lib/prismaClient
const mockPrismaClient = {
  tokenWallet: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  },
  tokenTransaction: {
    create: jest.fn<() => Promise<unknown>>(),
  },
  $transaction: jest.fn<() => Promise<unknown[]>>(),
  $connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  $disconnect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
};

jest.mock('@/lib/prismaClient', () => ({
  prisma: mockPrismaClient,
}));

describe('Token System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateTokenWallet', () => {
    it('should return existing wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        lockedBalance: 0,
        lifetimeEarned: 100,
        lifetimeSpent: 0,
        transactions: [],
      };

      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue(mockWallet);

      const { getOrCreateTokenWallet } = await import('@/lib/tokens');
      const wallet = await getOrCreateTokenWallet('user-1');

      expect(wallet).toEqual(mockWallet);
      expect(mockPrismaClient.tokenWallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should create new wallet if not exists', async () => {
      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue(null);
      mockPrismaClient.tokenWallet.create.mockResolvedValue({
        id: 'wallet-new',
        userId: 'user-2',
        balance: 0,
        lockedBalance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        transactions: [],
      });

      const { getOrCreateTokenWallet } = await import('@/lib/tokens');
      const wallet = await getOrCreateTokenWallet('user-2');

      expect(wallet.balance).toBe(0);
      expect(mockPrismaClient.tokenWallet.create).toHaveBeenCalled();
    });
  });

  describe('addTokens', () => {
    it('should add tokens to wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        lockedBalance: 0,
        lifetimeEarned: 100,
      };

      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue({
        ...mockWallet,
        transactions: [],
      });
      const updatedWallet = {
        ...mockWallet,
        balance: 150,
        lifetimeEarned: 150,
        transactions: [],
      };
      const mockTransaction = {
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'REWARD_CLAIM',
        amount: 50,
        balanceAfter: 150,
        description: '',
        createdAt: new Date(),
        metadata: null,
      };

      mockPrismaClient.tokenWallet.update.mockResolvedValue(updatedWallet);
      mockPrismaClient.tokenTransaction.create.mockResolvedValue(mockTransaction);
      mockPrismaClient.$transaction.mockResolvedValue([updatedWallet, mockTransaction]);

      const { addTokens } = await import('@/lib/tokens');
      const result = await addTokens('user-1', 50, 'REWARD_CLAIM');

      expect(result.wallet.balance).toBe(150);
      expect(mockPrismaClient.tokenWallet.update).toHaveBeenCalled();
    });

    it('should reject negative amounts', async () => {
      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        lockedBalance: 0,
        lifetimeEarned: 100,
        transactions: [],
      });

      const { addTokens } = await import('@/lib/tokens');

      await expect(addTokens('user-1', -10, 'EARN')).rejects.toThrow('Amount must be positive');
    });
  });

  describe('deductTokens', () => {
    it('should deduct tokens from wallet', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        lockedBalance: 0,
        lifetimeSpent: 0,
      };

      const updatedWallet = {
        ...mockWallet,
        balance: 70,
        lifetimeSpent: 30,
        transactions: [],
      };
      const mockTransaction = {
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'PURCHASE',
        amount: -30,
        balanceAfter: 70,
        description: '',
        createdAt: new Date(),
        metadata: null,
      };

      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue({
        ...mockWallet,
        transactions: [],
      });
      mockPrismaClient.tokenWallet.update.mockResolvedValue(updatedWallet);
      mockPrismaClient.tokenTransaction.create.mockResolvedValue(mockTransaction);
      mockPrismaClient.$transaction.mockResolvedValue([updatedWallet, mockTransaction]);

      const { deductTokens } = await import('@/lib/tokens');
      const result = await deductTokens('user-1', 30, 'PURCHASE');

      expect(result.wallet.balance).toBe(70);
      expect(result.wallet.lifetimeSpent).toBe(30);
    });

    it('should reject if insufficient balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 10,
        lockedBalance: 0,
        transactions: [],
      };

      mockPrismaClient.tokenWallet.findUnique.mockResolvedValue(mockWallet);

      const { deductTokens } = await import('@/lib/tokens');

      await expect(deductTokens('user-1', 50, 'PURCHASE')).rejects.toThrow('Insufficient balance');
    });
  });

  describe('transferTokens', () => {
    it('should transfer tokens between users', async () => {
      const fromWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        lockedBalance: 0,
        lifetimeSpent: 0,
      };

      const toWallet = {
        id: 'wallet-2',
        userId: 'user-2',
        balance: 50,
        lockedBalance: 0,
        lifetimeEarned: 50,
      };

      const updatedFromWallet = { ...fromWallet, balance: 80, transactions: [] };
      const updatedToWallet = { ...toWallet, balance: 70, transactions: [] };
      const mockFromTx = {
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'TRANSFER',
        amount: -20,
        balanceAfter: 80,
        description: 'Gift',
        createdAt: new Date(),
        metadata: null,
      };
      const mockToTx = {
        id: 'tx-2',
        walletId: 'wallet-2',
        type: 'TRANSFER',
        amount: 20,
        balanceAfter: 70,
        description: 'Gift',
        createdAt: new Date(),
        metadata: null,
      };

      mockPrismaClient.tokenWallet.findUnique
        .mockResolvedValueOnce({ ...fromWallet, transactions: [] })
        .mockResolvedValueOnce({ ...toWallet, transactions: [] });

      mockPrismaClient.tokenWallet.update
        .mockResolvedValueOnce(updatedFromWallet)
        .mockResolvedValueOnce(updatedToWallet);
      mockPrismaClient.tokenTransaction.create
        .mockResolvedValueOnce(mockFromTx)
        .mockResolvedValueOnce(mockToTx);
      mockPrismaClient.$transaction.mockResolvedValue([
        updatedFromWallet,
        updatedToWallet,
        mockFromTx,
        mockToTx,
      ]);

      const { transferTokens } = await import('@/lib/tokens');
      await transferTokens('user-1', 'user-2', 20, 'Gift');

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should reject self-transfer', async () => {
      const { transferTokens } = await import('@/lib/tokens');

      await expect(transferTokens('user-1', 'user-1', 10, 'Self')).rejects.toThrow(
        'Cannot transfer to yourself'
      );
    });
  });
});
