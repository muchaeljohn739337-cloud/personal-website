# 🍃 MongoDB Cloud Integration Guide - Advancia Pay Ledger

## 📋 Overview

This guide integrates MongoDB Cloud alongside your existing PostgreSQL database for:
- **Analytics & Logging**: High-volume time-series data (transaction logs, AI agent logs)
- **Caching Layer**: Session data, rate limiting counters
- **Document Storage**: Flexible schema data (AI training data, audit trails)
- **Real-time Features**: Socket.IO session persistence

**Current Setup**: PostgreSQL (Prisma) for structured data
**New Addition**: MongoDB for unstructured/high-volume data

---

## 🚀 Quick Start

### Step 1: MongoDB Cloud Setup

1. **Go to**: https://cloud.mongodb.com/v2/69311d41bc48562d612247ee#/setup/personalization
2. **Sign in** with your account
3. **Create a Free Cluster** (M0 - Free Forever):
   - Provider: AWS
   - Region: US East (or closest to your Render backend)
   - Cluster Name: `advancia-cluster`

4. **Create Database User**:
   - Username: `advancia_app`
   - Password: Generate strong password (save it!)
   - Role: `Read and write to any database`

5. **Network Access**:
   - Click "Network Access" → "Add IP Address"
   - Add: `0.0.0.0/0` (Allow from anywhere - for Render/cloud deployments)
   - Or whitelist Render IPs for production

6. **Get Connection String**:
   ```
   mongodb+srv://advancia_app:<password>@advancia-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🔧 Backend Integration

### Step 2: Install Dependencies

```bash
cd backend
npm install mongodb mongoose
npm install --save-dev @types/mongodb
```

### Step 3: Environment Variables

Add to `backend/.env`:

```env
# MongoDB Configuration
MONGODB_URI="mongodb+srv://advancia_app:YOUR_PASSWORD@advancia-cluster.xxxxx.mongodb.net/advancia_ledger?retryWrites=true&w=majority"
MONGODB_DB_NAME="advancia_ledger"

# Optional: MongoDB for specific features
MONGODB_CACHE_ENABLED=true
MONGODB_LOGS_ENABLED=true
```

### Step 4: Create MongoDB Client

**Create file**: `backend/src/mongoClient.ts`

```typescript
import { MongoClient, Db } from 'mongodb';

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
```

### Step 5: Update Server Startup

**Edit**: `backend/src/index.ts`

Add after Prisma connection:

```typescript
import { connectMongoDB } from './mongoClient';

// In startServer() function, after database connection test:
async function startServer() {
  try {
    // Existing Prisma connection...
    await prisma.$connect();
    console.log("✅ PostgreSQL connected");

    // Add MongoDB connection
    const mongoDb = await connectMongoDB();
    if (mongoDb) {
      console.log("✅ MongoDB connected (analytics & caching)");
    } else {
      console.log("⚠️  MongoDB not configured (optional features disabled)");
    }

    // ... rest of server startup
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
```

---

## 📊 Use Cases & Services

### Use Case 1: High-Volume Transaction Logging

**Create file**: `backend/src/services/mongoTransactionLogger.ts`

```typescript
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

  return db
    .collection('transaction_logs')
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

export async function getTransactionAnalytics(userId: string, days = 30) {
  const db = getMongoDb();
  if (!db) return null;

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

  return db.collection('transaction_logs').aggregate(pipeline).toArray();
}
```

### Use Case 2: AI Agent Execution Logs

**Create file**: `backend/src/services/mongoAILogger.ts`

```typescript
import { getMongoDb } from '../mongoClient';

interface AIAgentLog {
  agentId: string;
  agentName: string;
  action: string;
  status: 'started' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export async function logAIAgentExecution(log: AIAgentLog) {
  const db = getMongoDb();
  if (!db) return;

  try {
    await db.collection('ai_agent_logs').insertOne({
      ...log,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('MongoDB AI agent log error:', error);
  }
}

export async function getAIAgentStats(agentId?: string) {
  const db = getMongoDb();
  if (!db) return null;

  const match = agentId ? { agentId } : {};

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
      },
    },
  ];

  return db.collection('ai_agent_logs').aggregate(pipeline).toArray();
}
```

### Use Case 3: Rate Limiting with MongoDB

**Create file**: `backend/src/services/mongoRateLimiter.ts`

```typescript
import { getMongoDb } from '../mongoClient';

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const db = getMongoDb();
  if (!db) return { allowed: true, remaining: maxRequests }; // Fallback if MongoDB unavailable

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    const result = await db.collection('rate_limits').findOneAndUpdate(
      { key },
      {
        $setOnInsert: { createdAt: now },
        $push: {
          requests: {
            $each: [now],
            $slice: -maxRequests,
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const recentRequests = result.requests.filter(
      (req: Date) => req >= windowStart
    );

    const allowed = recentRequests.length <= maxRequests;
    const remaining = Math.max(0, maxRequests - recentRequests.length);

    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: maxRequests }; // Fail open
  }
}
```

---

## 🔗 Integration Points

### Update Existing Routes

**Example**: `backend/src/routes/transactions.ts`

```typescript
import { logTransaction } from '../services/mongoTransactionLogger';

router.post("/deposit", authenticateToken, async (req, res) => {
  try {
    // Existing Prisma logic...
    const transaction = await prisma.transaction.create({ /*...*/ });

    // Add MongoDB logging (async, non-blocking)
    logTransaction({
      transactionId: transaction.id,
      userId: req.user.id,
      type: 'deposit',
      amount: transaction.amount.toNumber(),
      currency: 'USD',
      status: transaction.status,
      metadata: { method: req.body.method },
      timestamp: transaction.createdAt,
    }).catch(err => console.error('MongoDB log failed:', err));

    res.json(transaction);
  } catch (error) {
    // Error handling...
  }
});
```

---

## 📡 Production Deployment

### Render.com Environment Variables

Add to your Render backend service:

```
MONGODB_URI=mongodb+srv://advancia_app:YOUR_PASSWORD@advancia-cluster.xxxxx.mongodb.net/advancia_ledger?retryWrites=true&w=majority
MONGODB_DB_NAME=advancia_ledger
MONGODB_CACHE_ENABLED=true
MONGODB_LOGS_ENABLED=true
```

### Vercel Frontend (Optional)

If you need MongoDB access from frontend (e.g., for serverless functions):

```env
MONGODB_URI=mongodb+srv://...
```

---

## 🧪 Testing MongoDB Connection

**Create file**: `backend/scripts/test-mongodb.ts`

```typescript
import { connectMongoDB, disconnectMongoDB, getMongoDb } from '../src/mongoClient';

async function testMongoDB() {
  console.log('🧪 Testing MongoDB connection...\n');

  try {
    const db = await connectMongoDB();

    if (!db) {
      console.error('❌ MongoDB connection failed');
      process.exit(1);
    }

    console.log('✅ Connected to MongoDB');

    // Test write
    const result = await db.collection('test').insertOne({
      message: 'Hello MongoDB!',
      timestamp: new Date(),
    });
    console.log('✅ Test document inserted:', result.insertedId);

    // Test read
    const doc = await db.collection('test').findOne({ _id: result.insertedId });
    console.log('✅ Test document read:', doc?.message);

    // Clean up
    await db.collection('test').deleteOne({ _id: result.insertedId });
    console.log('✅ Test document deleted');

    await disconnectMongoDB();
    console.log('\n✅ All MongoDB tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
    process.exit(1);
  }
}

testMongoDB();
```

**Run test**:

```bash
cd backend
tsx scripts/test-mongodb.ts
```

---

## 📊 MongoDB Atlas Dashboard

### Key Metrics to Monitor

1. **Cluster Metrics** (MongoDB Atlas Dashboard):
   - Operations/sec
   - Document count
   - Storage size
   - Network traffic

2. **Collections to Watch**:
   - `transaction_logs` (high volume)
   - `ai_agent_logs` (moderate volume)
   - `rate_limits` (auto-expires)
   - `audit_trails` (auto-expires after 90 days)

### Alerts Setup

Create alerts in MongoDB Atlas for:
- Storage > 80% of free tier limit (512MB)
- Connection count > 80 (limit 100 for M0)
- Slow queries > 100ms

---

## 🔄 Dual Database Strategy

### PostgreSQL (Prisma) - Primary

✅ **Use for**:
- User accounts & authentication
- Financial transactions (ACID required)
- Token wallets & balances
- Payment records (Stripe)
- Rewards & tiers
- Support tickets
- Ethereum smart contract state

### MongoDB - Secondary

✅ **Use for**:
- Transaction logs (analytics)
- AI agent execution logs
- Audit trails (90-day retention)
- Rate limiting counters
- Session storage
- Caching layer
- Time-series data
- ML training data

---

## 🚨 Migration Guide (Optional)

If you want to migrate existing logs to MongoDB:

**Create file**: `backend/scripts/migrate-logs-to-mongo.ts`

```typescript
import prisma from '../src/prismaClient';
import { connectMongoDB, getMongoDb } from '../src/mongoClient';

async function migrateLogs() {
  console.log('🔄 Migrating logs to MongoDB...\n');

  await connectMongoDB();
  const db = getMongoDb();

  if (!db) {
    console.error('❌ MongoDB not connected');
    process.exit(1);
  }

  // Migrate audit logs
  const auditLogs = await prisma.auditLog.findMany({
    take: 10000,
    orderBy: { timestamp: 'desc' },
  });

  if (auditLogs.length > 0) {
    await db.collection('audit_trails').insertMany(
      auditLogs.map(log => ({
        auditLogId: log.id,
        userId: log.userId,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
        createdAt: log.timestamp,
      }))
    );
    console.log(`✅ Migrated ${auditLogs.length} audit logs`);
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrateLogs();
```

---

## 🔐 Security Best Practices

1. **Connection String Security**:
   - Never commit connection strings to Git
   - Use environment variables only
   - Rotate passwords quarterly

2. **Network Access**:
   - Whitelist specific IPs in production
   - Use VPC peering for enterprise setup

3. **User Permissions**:
   - Separate users for read-only vs read-write
   - Use least privilege principle

4. **Encryption**:
   - MongoDB Atlas uses encryption at rest (automatic)
   - TLS/SSL for connections (automatic with `mongodb+srv://`)

---

## 📚 Additional Resources

- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **MongoDB Node.js Driver**: https://www.mongodb.com/docs/drivers/node/current/
- **Mongoose ODM** (if you prefer schemas): https://mongoosejs.com/
- **MongoDB University**: https://university.mongodb.com/ (free courses)

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string added to `.env`
- [ ] Dependencies installed (`mongodb`, `mongoose`)
- [ ] `mongoClient.ts` created
- [ ] `index.ts` updated with MongoDB connection
- [ ] Test script run successfully
- [ ] Environment variables added to Render
- [ ] Indexes created for collections
- [ ] Logging services integrated
- [ ] Dashboard alerts configured

---

## 🎯 Next Steps

1. **Test Connection**: Run `tsx scripts/test-mongodb.ts`
2. **Deploy to Render**: Add MONGODB_URI to environment variables
3. **Monitor Usage**: Check MongoDB Atlas dashboard daily
4. **Optimize Queries**: Use MongoDB Compass for query analysis
5. **Set Up Alerts**: Configure Atlas alerts for storage and performance

---

**Questions?** Check the Mom-Shield-Dad system for automated troubleshooting or contact support.

**Production Ready** ✅
