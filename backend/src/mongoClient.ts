import { Db, MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'advancia_ledger';

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not configured. MongoDB features disabled.');
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export async function connectMongoDB(): Promise<Db | null> {
  if (!MONGODB_URI) {
    return null;
  }

  if (mongoDb) {
    return mongoDb;
  }

  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB_NAME);

    console.log('✅ MongoDB connected:', MONGODB_DB_NAME);

    // Create indexes
    await createIndexes(mongoDb);

    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return null;
  }
}

async function createIndexes(db: Db) {
  try {
    // Transaction logs - indexed by timestamp and userId
    await db.collection('transaction_logs').createIndexes([
      { key: { timestamp: -1 } },
      { key: { userId: 1, timestamp: -1 } },
      { key: { type: 1 } },
    ]);

    // AI agent logs - indexed by agentId and timestamp
    await db.collection('ai_agent_logs').createIndexes([
      { key: { timestamp: -1 } },
      { key: { agentId: 1, timestamp: -1 } },
      { key: { status: 1 } },
    ]);

    // Audit trails - TTL index (auto-delete after 90 days)
    await db.collection('audit_trails').createIndexes([
      { key: { timestamp: -1 } },
      { key: { userId: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 7776000 }, // 90 days
    ]);

    // Rate limiting counters - TTL index (auto-delete after 1 hour)
    await db.collection('rate_limits').createIndexes([
      { key: { key: 1 }, unique: true },
      { key: { createdAt: 1 }, expireAfterSeconds: 3600 }, // 1 hour
    ]);

    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.error('❌ MongoDB index creation failed:', error);
  }
}

export async function disconnectMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    console.log('✅ MongoDB disconnected');
  }
}

export function getMongoDb(): Db | null {
  return mongoDb;
}

export default { connectMongoDB, disconnectMongoDB, getMongoDb };
