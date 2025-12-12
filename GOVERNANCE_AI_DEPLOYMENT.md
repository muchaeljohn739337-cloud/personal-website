# ✅ Governance AI Deployment Checklist

## 📋 Pre-Deployment

### **1. Database Setup**

- [ ] PostgreSQL database running and accessible
- [ ] `DATABASE_URL` environment variable configured
- [ ] Database connection tested (`npx prisma db pull`)

### **2. Backend Dependencies**

- [ ] Node.js 18+ installed
- [ ] `@prisma/client` installed
- [ ] Backend running successfully on port 4000

### **3. Environment Variables**

```bash
# Required
DATABASE_URL=postgresql://...

# Optional (for production)
MAXMIND_LICENSE_KEY=your_license_key
MAXMIND_ACCOUNT_ID=your_account_id
OFAC_API_KEY=your_ofac_key
STRIPE_SECRET_KEY=sk_live_...
SQUARE_ACCESS_TOKEN=sq0atp-...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

---

## 🚀 Deployment Steps

### **Phase 1: Database Migration (5 minutes)**

#### **Step 1.1: Run SQL Migration**

```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/add_governance_ai_tables.sql
```

**Expected Output:**

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX (x15)
INSERT 0 5 (Jurisdiction rules)
INSERT 0 4 (Processor configs)
✅ Governance AI database schema created successfully
```

#### **Step 1.2: Update Prisma Schema**

```bash
cd backend
npx prisma generate
npx prisma db push
```

**Expected Output:**

```
✔ Generated Prisma Client
Database schema in sync
```

#### **Step 1.3: Verify Tables Created**

```bash
psql $DATABASE_URL -c "\dt *compliance*"
```

**Expected Output:**

```
 compliance_logs
 compliance_alerts
 jurisdiction_rules
 risk_assessments
 processor_configs
```

### **Phase 2: Backend Integration (3 minutes)**

#### **Step 2.1: Verify Governance Files**

Check these files exist:

- [ ] `backend/src/ai/governance_ai.js` (~600 lines)
- [ ] `backend/src/ai/governance_integration.js` (~150 lines)
- [ ] `backend/src/routes/governance.ts` (~650 lines)
- [ ] `backend/prisma/schema.prisma` (includes 5 Governance AI models)

#### **Step 2.2: Verify Backend Index.ts**

Check `backend/src/index.ts` includes:

```typescript
import governanceRouter from "./routes/governance";
app.use("/api/governance", governanceRouter);

// In startServer():
const { initializeGovernanceAI } = require("./ai/governance_integration");
await initializeGovernanceAI();

// In shutdown handlers:
const { shutdownGovernanceAI } = require("./ai/governance_integration");
await shutdownGovernanceAI();
```

#### **Step 2.3: Restart Backend**

```bash
cd backend
npm run dev
```

**Expected Output:**

```
✅ Database connection successful
✅ Auto-Precision Core initialized successfully
✅ Governance AI initialized successfully
   - 5 jurisdictions loaded (USA, CAN, GBR, EUR, GLOBAL)
   - 4 payment processors configured (Stripe, Square, PayPal, Crypto)
   - Auto-routing: ENABLED
   - Risk adaptation: ENABLED
   - Compliance logging: ENABLED
🚀 Server is running on port 4000
```

### **Phase 3: Verification Testing (5 minutes)**

#### **Test 3.1: Health Check**

```bash
curl http://localhost:4000/api/health
```

**Expected:** `{ "status": "ok", ... }`

#### **Test 3.2: Route Payment (Basic)**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "method": "card"}'
```

**Expected:**

```json
{
  "success": true,
  "jurisdiction": "GLOBAL",
  "processor": "stripe",
  "complianceResult": { ... },
  "message": "Payment routed successfully"
}
```

#### **Test 3.3: Detect Jurisdiction**

```bash
curl http://localhost:4000/api/governance/jurisdiction
```

**Expected:**

```json
{
  "success": true,
  "jurisdiction": "GLOBAL",
  "confidence": 0.10,
  "signals": { ... }
}
```

#### **Test 3.4: Get Processors**

```bash
curl http://localhost:4000/api/governance/processors?jurisdiction=USA
```

**Expected:** List of 2-4 processors (Stripe, Square, etc.)

#### **Test 3.5: Get Jurisdiction Rules**

```bash
curl http://localhost:4000/api/governance/rules/USA
```

**Expected:** USA jurisdiction rules (FinCEN, OFAC, $10K limits)

---

## 🧪 Advanced Testing (10 minutes)

### **Scenario 1: USA User with Large Transaction**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000,
    "currency": "USD",
    "method": "card",
    "userId": "test-usa-user"
  }'
```

**Expected Result:**

- ✅ `success: true`
- ✅ `auto_corrected: true`
- ✅ `message: "Transaction split into 2 parts..."`

### **Scenario 2: Risk Assessment**

```bash
curl -X POST http://localhost:4000/api/governance/risk \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000, "currency": "USD", "method": "crypto"}'
```

**Expected Result:**

- ✅ `riskScore` > 0.5 (MEDIUM or HIGH)
- ✅ `riskLevel: "HIGH"` or `"MEDIUM"`
- ✅ `factors` object with risk breakdown

### **Scenario 3: Sanctioned Country (Should Fail)**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "currency": "USD",
    "method": "card",
    "userId": "test-iran-user"
  }'
```

**Expected Result:**

- ❌ `success: false`
- ❌ `error: "Sanctions violation detected"`

---

## 🔐 Production Configuration

### **1. MaxMind GeoIP Setup** (15 minutes)

```bash
cd backend
npm install @maxmind/geoip2-node

# Download GeoLite2 database
wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=YOUR_KEY&suffix=tar.gz
tar -xzf GeoLite2-Country.tar.gz
mv GeoLite2-Country_*/GeoLite2-Country.mmdb ./data/
```

**Update `governance_ai.js`:**

```javascript
const Reader = require('@maxmind/geoip2-node').Reader;

async getJurisdictionFromIP(ipAddress) {
  const reader = await Reader.open('./data/GeoLite2-Country.mmdb');
  const response = reader.country(ipAddress);
  return this.normalizeJurisdiction(response.country.isoCode);
}
```

### **2. Payment Processor API Keys**

```bash
# Encrypt and store in database
UPDATE processor_configs
SET api_credentials = '{"api_key": "sk_live_...", "secret": "..."}'::JSONB
WHERE processor_id = 'stripe';

UPDATE processor_configs
SET api_credentials = '{"access_token": "sq0atp-..."}'::JSONB
WHERE processor_id = 'square';
```

### **3. OFAC Sanctions API** (Optional)

```bash
# Sign up at https://sanctionssearch.ofac.treas.gov/
# Add API key to environment
OFAC_API_KEY=your_ofac_key

# Update governance_ai.js checkSanctions() to use API
```

### **4. Configure CORS for Production**

```javascript
// backend/src/config/index.ts
export const config = {
  allowedOrigins: [
    "https://advanciapayledger.com",
    "https://www.advanciapayledger.com",
    "https://api.advanciapayledger.com",
    // Add other production domains
  ],
};
```

---

## 📊 Monitoring Setup

### **1. Enable Production Logging**

```bash
# backend/.env
NODE_ENV=production
DEBUG=governance:*
```

### **2. Set Up Compliance Alert Monitoring**

```bash
# Check for open alerts every hour
*/60 * * * * curl http://localhost:4000/api/governance/alerts?status=OPEN | mail -s "Compliance Alerts" admin@yourcompany.com
```

### **3. Database Indexes (Performance)**

```sql
-- Already created in migration, verify:
SELECT indexname FROM pg_indexes WHERE tablename LIKE '%compliance%';

-- Expected: 15+ indexes
```

### **4. Log Rotation (Prevent Disk Overflow)**

```bash
# Clear old compliance logs (optional, keep 90 days)
DELETE FROM compliance_logs WHERE timestamp < NOW() - INTERVAL '90 days';

# Archive old risk assessments
UPDATE risk_assessments SET expired = true WHERE expires_at < NOW();
```

---

## 🚨 Production Checklist

### **Infrastructure**

- [ ] Database backups enabled (daily)
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled (`/api` routes)
- [ ] CORS configured for production domains
- [ ] Environment variables secured (not in git)

### **Security**

- [ ] Processor API keys encrypted in database
- [ ] Admin endpoints require authentication
- [ ] JWT secret configured and rotated
- [ ] IP whitelisting for admin panel (optional)
- [ ] Audit logging enabled

### **Compliance**

- [ ] All 5 jurisdiction rules reviewed and approved
- [ ] Processor capabilities verified for each jurisdiction
- [ ] Sanctions lists updated (OFAC, UN, EU)
- [ ] PEP screening enabled for USA/UK/EU
- [ ] Compliance alert monitoring configured

### **Performance**

- [ ] Database indexes created (15+ for Governance AI)
- [ ] Prisma connection pooling configured
- [ ] Response times < 500ms for routing endpoint
- [ ] Redis cache for jurisdiction rules (optional)
- [ ] CDN for static assets (optional)

### **Testing**

- [ ] All 5 test scenarios passed
- [ ] Multi-jurisdiction routing tested
- [ ] Auto-correction tested (large transactions)
- [ ] Risk assessment tested (high-risk scenarios)
- [ ] Sanctions screening tested (blocked countries)
- [ ] Admin endpoints tested (statistics, alerts)

---

## 📈 Post-Deployment

### **Week 1: Monitoring**

- [ ] Check compliance logs daily (`SELECT COUNT(*) FROM compliance_logs`)
- [ ] Review open alerts (`/api/governance/alerts?status=OPEN`)
- [ ] Monitor processor success rates
- [ ] Verify jurisdiction detection accuracy

### **Week 2-4: Optimization**

- [ ] Analyze risk assessment false positives
- [ ] Adjust transaction limits if needed
- [ ] Update processor configurations
- [ ] Fine-tune auto-correction logic

### **Month 2+: Maintenance**

- [ ] Update MaxMind GeoIP database (monthly)
- [ ] Review and update jurisdiction rules
- [ ] Audit processor fees and ratings
- [ ] Archive old compliance logs (>90 days)

---

## 🆘 Rollback Procedure

### **If Deployment Fails:**

1. **Rollback Database Migration**

   ```sql
   DROP TABLE IF EXISTS compliance_alerts;
   DROP TABLE IF EXISTS processor_configs;
   DROP TABLE IF EXISTS risk_assessments;
   DROP TABLE IF EXISTS jurisdiction_rules;
   DROP TABLE IF EXISTS compliance_logs;
   ```

2. **Remove Governance Routes**

   ```bash
   # Comment out in backend/src/index.ts:
   # import governanceRouter from "./routes/governance";
   # app.use("/api/governance", governanceRouter);
   # await initializeGovernanceAI();
   # await shutdownGovernanceAI();
   ```

3. **Restart Backend**

   ```bash
   npm run dev
   ```

4. **Verify System Stable**
   ```bash
   curl http://localhost:4000/api/health
   ```

---

## ✅ Deployment Complete!

Your Governance AI system is now:

- ✅ Deployed and running
- ✅ Handling multi-jurisdiction payments
- ✅ Auto-correcting compliance violations
- ✅ Routing to optimal processors
- ✅ Logging all compliance events
- ✅ Monitoring for alerts

**Next Steps:**

1. Build frontend dashboard (optional)
2. Configure payment processor webhooks
3. Set up compliance alert notifications
4. Train team on alert resolution workflow

---

## 📚 Documentation

- **Quick Start**: [GOVERNANCE_AI_QUICKSTART.md](./GOVERNANCE_AI_QUICKSTART.md)
- **Full Guide**: [GOVERNANCE_AI_README.md](./GOVERNANCE_AI_README.md)
- **API Reference**: [GOVERNANCE_AI_README.md#-api-endpoints](./GOVERNANCE_AI_README.md#-api-endpoints)

**Questions?** Check the troubleshooting section in GOVERNANCE_AI_QUICKSTART.md

**Governance AI is live! Your users can now make purchases from anywhere in the world without restrictions! 🌐✅**
