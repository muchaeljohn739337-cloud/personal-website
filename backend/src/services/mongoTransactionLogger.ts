import { getMongoDb } from '../mongoClient';

interface TransactionLog {
  transactionId: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'crypto_order';
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export async function logTransaction(log: TransactionLog) {
  const db = getMongoDb();
  if (!db) return;

  try {
    await db.collection('transaction_logs').insertOne({
      ...log,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('MongoDB transaction log error:', error);
  }
}

export async function getTransactionLogs(userId: string, limit = 100) {
  const db = getMongoDb();
  if (!db) return [];

  try {
    return await db
      .collection('transaction_logs')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('MongoDB get transaction logs error:', error);
    return [];
  }
}

export async function getTransactionAnalytics(userId: string, days = 30) {
  const db = getMongoDb();
  if (!db) return null;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      { $match: { userId, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
    ];

    return await db.collection('transaction_logs').aggregate(pipeline).toArray();
  } catch (error) {
    console.error('MongoDB transaction analytics error:', error);
    return null;
  }
}
