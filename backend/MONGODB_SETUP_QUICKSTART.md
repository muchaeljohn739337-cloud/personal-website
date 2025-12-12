# 🍃 MongoDB Setup - Quick Reference

## ✅ What's Been Configured

### 1. **Packages Installed**
- ✅ `mongodb` - Official MongoDB driver
- ✅ `mongoose` - ODM for MongoDB (optional)
- ✅ `@types/mongodb` - TypeScript types

### 2. **Files Created**
```
backend/
├── src/
│   ├── mongoClient.ts                      # MongoDB connection manager
│   └── services/
│       ├── mongoTransactionLogger.ts       # Transaction logging to MongoDB
│       └── mongoAILogger.ts                # AI agent execution logs
├── test-mongodb.js                         # Connection test script
└── .env.example                            # Updated with MongoDB vars
```

### 3. **Server Integration**
- ✅ `backend/src/index.ts` - Auto-connects MongoDB on startup (optional)
- ✅ Graceful fallback if MongoDB not configured
- ✅ Index creation for optimal performance

---

## 🚀 Setup Steps

### Step 1: Get MongoDB Cloud Credentials

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create Free Cluster** (M0 - Free Forever):
   - Provider: AWS
   - Region: US East (or closest to your Render backend)
   - Cluster Name: `advancia-cluster`

3. **Create Database User**:
   - Go to "Database Access" → "Add New Database User"
   - Username: `advancia_app`
   - Password: Generate secure password (save it!)
   - Built-in Role: `Read and write to any database`

4. **Configure Network Access**:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Render's outbound IPs for production

5. **Get Connection String**:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://advancia_app:<password>@advancia-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 2: Configure Environment

Add to `backend/.env`:

```env
# MongoDB Configuration (Optional - for analytics & logging)
MONGODB_URI="mongodb+srv://advancia_app:YOUR_PASSWORD@advancia-cluster.xxxxx.mongodb.net/advancia_ledger?retryWrites=true&w=majority"
MONGODB_DB_NAME="advancia_ledger"
MONGODB_CACHE_ENABLED=true
MONGODB_LOGS_ENABLED=true
```

**Replace**:
- `YOUR_PASSWORD` with your database user password
- `xxxxx` with your cluster ID (from connection string)

### Step 3: Test Connection

```bash
cd backend
node test-mongodb.js
```

Expected output:
```
✅ Connected to MongoDB successfully!
📊 Database: advancia_ledger
📝 Testing write operation...
✅ Write successful
📖 Testing read operation...
✅ Read successful
✨ All tests passed! MongoDB is ready to use.
```

### Step 4: Start Backend

```bash
npm run dev
```

Look for:
```
✅ PostgreSQL database connection successful
✅ MongoDB connected (analytics & caching enabled)
```

---

## 📊 Usage Examples

### Transaction Logging

```typescript
import { logTransaction, getTransactionLogs } from './services/mongoTransactionLogger';

// Log a transaction
await logTransaction({
  transactionId: '123',
  userId: 'user-456',
  type: 'deposit',
  amount: 100.00,
  currency: 'USD',
  status: 'completed',
  metadata: { method: 'stripe' },
  timestamp: new Date(),
});

// Get user's transaction history
const logs = await getTransactionLogs('user-456', 50);

// Get analytics
const analytics = await getTransactionAnalytics('user-456', 30);
```

### AI Agent Logging

```typescript
import { logAIAgentExecution, getAIAgentStats } from './services/mongoAILogger';

// Log agent execution
await logAIAgentExecution({
  agentId: 'agent-1',
  agentName: 'TransactionAuditAgent',
  action: 'audit_transaction',
  status: 'completed',
  input: { transactionId: '123' },
  output: { score: 0.95, flags: [] },
  duration: 1234, // milliseconds
  timestamp: new Date(),
});

// Get agent statistics
const stats = await getAIAgentStats('agent-1');
```

---

## 🗃️ MongoDB Collections

| Collection | Purpose | TTL |
|-----------|---------|-----|
| `transaction_logs` | High-volume transaction logging | None |
| `ai_agent_logs` | AI agent execution history | None |
| `audit_trails` | Security audit logs | 90 days |
| `rate_limits` | Rate limiting counters | 1 hour |

All collections have optimized indexes for query performance.

---

## 🔧 Deployment (Render)

Add to Render environment variables:

```
MONGODB_URI=mongodb+srv://advancia_app:PASSWORD@advancia-cluster.xxxxx.mongodb.net/advancia_ledger?retryWrites=true&w=majority
MONGODB_DB_NAME=advancia_ledger
MONGODB_CACHE_ENABLED=true
MONGODB_LOGS_ENABLED=true
```

---

## ⚠️ Important Notes

1. **Optional Service**: Backend works without MongoDB - it's for analytics/logging
2. **PostgreSQL Primary**: Prisma + PostgreSQL remains primary database
3. **Free Tier**: MongoDB Atlas M0 cluster is free forever (512 MB storage)
4. **No Breaking Changes**: Existing features unaffected if MongoDB not configured
5. **Graceful Degradation**: Logs to console if MongoDB unavailable

---

## 🐛 Troubleshooting

### Connection Failed?
```bash
# Run test script with details
node test-mongodb.js
```

**Common Issues**:
1. **Wrong password** - Check MONGODB_URI credentials
2. **IP not whitelisted** - Add 0.0.0.0/0 in MongoDB Atlas Network Access
3. **Firewall blocking** - Check local/server firewall rules
4. **Wrong connection string** - Verify format from MongoDB Atlas

### Check Connection in Backend Logs
```bash
npm run dev | grep -i mongo
```

Should see:
```
✅ MongoDB connected: advancia_ledger
✅ MongoDB indexes created
```

---

## 📚 Resources

- **MongoDB Atlas**: https://cloud.mongodb.com
- **MongoDB Docs**: https://docs.mongodb.com
- **Node.js Driver**: https://mongodb.github.io/node-mongodb-native
- **Full Guide**: `MONGODB_INTEGRATION_GUIDE.md`

---

**Status**: ✅ MongoDB integration complete and ready to use!
