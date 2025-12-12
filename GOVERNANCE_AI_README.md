# 🌐 Governance AI - Multi-Jurisdiction Payment Compliance

## 🎯 **Purpose**

Governance AI ensures **global payment compliance WITHOUT restricting users**. The system automatically detects user jurisdiction (USA, Canada, UK, EU, Global), applies appropriate compliance rules (FinCEN, FINTRAC, FCA, PSD2), routes payments to compliant processors, and **NEVER blocks users** — instead using smart routing and auto-correction.

---

## 🚀 **Quick Start**

### **1. Deploy Database Schema**

```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/add_governance_ai_tables.sql
```

This creates:

- **ComplianceLog** - Complete audit trail of all compliance events
- **JurisdictionRule** - Jurisdiction-specific rules (USA, CAN, GBR, EUR, GLOBAL)
- **RiskAssessment** - Risk scores for users/transactions
- **ProcessorConfig** - Payment processor configurations
- **ComplianceAlert** - High-priority compliance alerts

### **2. Update Prisma Schema**

```bash
cd backend
npx prisma generate
npx prisma db push
```

### **3. Restart Backend**

Governance AI auto-initializes on server start:

```bash
cd backend
npm run dev
```

Look for:

```
✅ Governance AI initialized successfully
   - 5 jurisdictions loaded (USA, CAN, GBR, EUR, GLOBAL)
   - 4 payment processors configured (Stripe, Square, PayPal, Crypto)
   - Auto-routing: ENABLED
   - Risk adaptation: ENABLED
```

---

## 🌍 **Supported Jurisdictions**

### **USA (Strict)**

- **Regulators**: FinCEN, OFAC, SEC, State Banking Authorities
- **KYC**: Enhanced (full identity verification)
- **AML**: Continuous monitoring
- **Transaction Limits**: $10K daily / $50K monthly
- **Compliance Checks**: Sanctions screening, PEP screening, source of funds ($5K+)
- **Processors**: Stripe, Square, Braintree, Authorize.Net

### **Canada (Moderate)**

- **Regulators**: FINTRAC, OSFI, Provincial Regulators
- **KYC**: Standard (identity + address)
- **AML**: Periodic monitoring
- **Transaction Limits**: $15K daily / $60K monthly
- **Compliance Checks**: Sanctions screening, source of funds ($10K+)
- **Processors**: Stripe, Square, Moneris, Bambora

### **United Kingdom (Strict)**

- **Regulators**: FCA, PRA, HMRC
- **KYC**: Enhanced (full verification)
- **AML**: Continuous monitoring
- **Transaction Limits**: £8K daily / £40K monthly
- **Compliance Checks**: Sanctions (including Russia), PEP screening, source of funds (£5K+)
- **Processors**: Stripe, Worldpay, Checkout.com, Adyen

### **European Union (Strict)**

- **Regulators**: EBA, ECB, National Regulators
- **KYC**: Standard (identity + address)
- **AML**: Continuous monitoring
- **Transaction Limits**: €10K daily / €50K monthly
- **Compliance Checks**: Sanctions, PEP screening, SCA (Strong Customer Authentication), GDPR
- **Processors**: Stripe, Adyen, Klarna, Mollie

### **Global (Lenient Fallback)**

- **Regulators**: Local Authorities
- **KYC**: Optional (basic identity)
- **AML**: None
- **Transaction Limits**: $50K daily / $200K monthly
- **Compliance Checks**: Minimal
- **Processors**: Stripe, PayPal, Crypto

---

## 🛣️ **Smart Payment Routing**

### **7-Step Routing Workflow**

```javascript
// Example: Route $15K USD payment from USA user
const result = await fetch('http://localhost:4000/api/governance/route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 15000,
    currency: 'USD',
    method: 'card',
    userId: 'user123'
  })
});

// Response:
{
  "success": true,
  "jurisdiction": "USA",
  "processor": "stripe",
  "complianceResult": {
    "transactionLimits": "PASS",
    "kycLevel": "PASS",
    "sanctionsScreening": "PASS",
    "sourceOfFunds": "PASS",
    "pepScreening": "PASS"
  },
  "riskScore": 0.35,
  "riskLevel": "MEDIUM",
  "message": "Payment routed successfully to stripe"
}
```

### **Workflow Steps:**

1. **Detect Jurisdiction** (IP + billing country + bank country + user preference)
2. **Check Compliance** (5 checks: limits, KYC, sanctions, SOF, PEP)
3. **Auto-Correct Violations** (e.g., split $20K → 2×$10K)
4. **Select Processor** (best fees + fastest settlement)
5. **Log Event** (audit trail in ComplianceLog table)
6. **Emit Event** (`payment_routed`, `compliance_violation`, `risk_alert`)
7. **Return Result** (success/failure + processor + compliance details)

---

## 🔍 **Jurisdiction Detection**

Governance AI uses **multi-signal detection** with weighted confidence:

```javascript
// Auto-detect jurisdiction
const result = await fetch('http://localhost:4000/api/governance/jurisdiction?userId=user123');

// Response:
{
  "success": true,
  "jurisdiction": "USA",
  "confidence": 0.85,
  "signals": {
    "ip": "USA",          // 10% weight
    "billing": "USA",     // 20% weight
    "bank": "USA",        // 30% weight
    "preference": "USA"   // 40% weight (highest)
  }
}
```

### **Confidence Scoring:**

- **User Preference**: 40% (manual selection in profile)
- **Bank Country**: 30% (from bank account)
- **Billing Country**: 20% (from billing address)
- **IP Address**: 10% (GeoIP lookup, least reliable due to VPNs)

### **Fallback Logic:**

If confidence < 0.5 → Use **GLOBAL** rules (most permissive)

---

## 🎲 **Risk Assessment**

### **5-Factor Risk Scoring**

```javascript
// Assess transaction risk
const result = await fetch('http://localhost:4000/api/governance/risk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 25000,
    currency: 'USD',
    method: 'crypto',
    userId: 'user123'
  })
});

// Response:
{
  "success": true,
  "riskScore": 0.75,
  "riskLevel": "HIGH",
  "factors": {
    "largeAmount": 0.30,      // $25K > $10K threshold
    "newUser": 0.00,          // 100+ transactions (established)
    "highRiskCountry": 0.00,  // USA (not high-risk)
    "velocity": 0.30,         // 15 transactions in last 24h
    "paymentMethod": 0.15     // Crypto (higher risk than cards)
  },
  "recommendation": "Require enhanced KYC verification"
}
```

### **Risk Levels:**

- **LOW** (0.0-0.3): Standard processing
- **MEDIUM** (0.3-0.6): Standard KYC required
- **HIGH** (0.6-0.8): Enhanced KYC + lower limits
- **CRITICAL** (0.8-1.0): Enhanced KYC + halve limits + manual review

### **Adaptive Policies (Risk-Based Tightening):**

```javascript
// HIGH/CRITICAL risk automatically applies:
- Require enhanced KYC (even if standard was sufficient)
- Lower source-of-funds threshold to $1,000
- Halve daily transaction limit
- Require manual review for CRITICAL
```

**Important**: Policies **tighten but never block**. If user cannot meet requirements, system suggests alternatives (e.g., split transaction, use different processor).

---

## 🔐 **Compliance Checks**

### **5 Compliance Checks (All Automated)**

1. **Transaction Limits**

   - Check daily/monthly limits for jurisdiction
   - Auto-correct: Split large transactions into multiple smaller ones

2. **KYC Level Validation**

   - Levels: none (0), basic (1), standard (2), enhanced (3)
   - USA/UK/EU require enhanced for transactions >$10K

3. **Sanctions Screening**

   - Check user country + destination country against OFAC/UN/EU lists
   - Blocked countries: Iran (IR), North Korea (KP), Syria (SY), Cuba (CU), Russia (RU for UK)

4. **Source of Funds (SOF)**

   - USA: $5K threshold, UK: £5K threshold, CAN: $10K threshold, EUR: €10K threshold
   - Requires documentation for large transactions

5. **PEP (Politically Exposed Person) Screening**
   - USA, UK, EU require PEP checks
   - Manual review if PEP detected

---

## 💳 **Payment Processors**

### **Stripe (95% Rating)**

- **Jurisdictions**: USA, CAN, GBR, EUR, GLOBAL
- **Features**: Cards, ACH, SEPA, Local Methods
- **Fees**: 2.9% + $0.30
- **Settlement**: 2 days
- **Max Amount**: $999,999

### **Square (90% Rating)**

- **Jurisdictions**: USA, CAN, GBR
- **Features**: Cards, ACH
- **Fees**: 2.6% + $0.10 (lowest fees!)
- **Settlement**: 1 day (fastest!)
- **Max Amount**: $50,000

### **PayPal (85% Rating)**

- **Jurisdictions**: USA, CAN, GBR, EUR, GLOBAL
- **Features**: PayPal Balance, Cards, Bank
- **Fees**: 3.5% + $0.49
- **Settlement**: 3 days
- **Max Amount**: $100,000

### **Crypto (80% Rating)**

- **Jurisdictions**: GLOBAL
- **Features**: BTC, ETH, USDC
- **Fees**: 1.0% + $0 (lowest fees for crypto!)
- **Settlement**: Instant (fastest!)
- **Max Amount**: $9,999,999

### **Processor Selection Logic:**

```javascript
// 1. Filter by jurisdiction
const eligible = processors.filter((p) => p.jurisdictions.includes("USA"));

// 2. Filter by amount limit
const canHandle = eligible.filter((p) => p.maxAmount >= paymentAmount);

// 3. Score by fees + settlement time
const score = baseRating * 100 - feePercentage * 50 - settlementDays * 2;

// 4. Return highest scoring processor
return canHandle.sort((a, b) => b.score - a.score)[0];
```

---

## 🚨 **Auto-Correction Examples**

### **Example 1: Transaction Exceeds Daily Limit**

```javascript
// User: USA (limit: $10K/day)
// Transaction: $15K

// Auto-Correction:
{
  "success": true,
  "auto_corrected": true,
  "suggestion": "Transaction split into 2 parts: $10,000 today + $5,000 tomorrow",
  "processor": "stripe"
}
```

### **Example 2: Insufficient KYC Level**

```javascript
// User: Standard KYC
// Transaction: $12K (requires Enhanced KYC in USA)

// Auto-Correction:
{
  "success": false,
  "auto_corrected": false,
  "suggestion": "Upgrade to Enhanced KYC to process this transaction",
  "upgrade_url": "/profile/kyc-upgrade"
}
```

### **Example 3: High-Risk Transaction**

```javascript
// User: 20 transactions in last 24h (velocity alert)
// Risk Score: 0.85 (CRITICAL)

// Auto-Correction:
{
  "success": true,
  "auto_corrected": true,
  "adaptive_policies_applied": {
    "kyc_level": "enhanced",
    "daily_limit": 5000,  // Halved from $10K
    "manual_review": true
  },
  "processor": "stripe"
}
```

---

## 📊 **API Endpoints**

### **1. Route Payment (Main Endpoint)**

```bash
POST /api/governance/route
```

**Body:**

```json
{
  "amount": 10000,
  "currency": "USD",
  "method": "card",
  "userId": "user123",
  "description": "Product purchase"
}
```

### **2. Detect Jurisdiction**

```bash
GET /api/governance/jurisdiction?userId=user123
```

### **3. Assess Risk**

```bash
POST /api/governance/risk
```

**Body:**

```json
{
  "amount": 5000,
  "currency": "USD",
  "method": "card",
  "userId": "user123"
}
```

### **4. Get Available Processors**

```bash
GET /api/governance/processors?jurisdiction=USA
```

### **5. Get Jurisdiction Rules**

```bash
GET /api/governance/rules/USA
```

### **6. Get Compliance Report**

```bash
GET /api/governance/compliance/:transactionId
```

_(Requires authentication)_

### **7. Get Statistics (Admin)**

```bash
GET /api/governance/statistics
```

_(Requires admin authentication)_

### **8. Update Rules (Admin)**

```bash
PUT /api/governance/rules/USA
```

_(Requires admin authentication)_

### **9. Get Alerts (Admin)**

```bash
GET /api/governance/alerts?status=OPEN&severity=HIGH
```

_(Requires admin authentication)_

### **10. Resolve Alert (Admin)**

```bash
PUT /api/governance/alerts/:alertId/resolve
```

_(Requires admin authentication)_

---

## 🧪 **Testing Multi-Jurisdiction Scenarios**

### **Test 1: USA User with Large Transaction**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000,
    "currency": "USD",
    "method": "card",
    "userId": "usa-user-1"
  }'
```

**Expected Result:**

- ✅ Violation detected: Exceeds $10K daily limit
- ✅ Auto-corrected: Split into 2 transactions
- ✅ Routed to Stripe

### **Test 2: Canada User with Medium Transaction**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 8000,
    "currency": "CAD",
    "method": "card",
    "userId": "can-user-1"
  }'
```

**Expected Result:**

- ✅ All compliance checks passed
- ✅ Routed to Square (better fees than Stripe)

### **Test 3: UK User with PEP Flag**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "GBP",
    "method": "card",
    "userId": "uk-pep-user"
  }'
```

**Expected Result:**

- ⚠️ PEP screening triggered
- ⚠️ Manual review required
- ✅ Transaction held for compliance team
- 🚨 Compliance alert created (HIGH severity)

### **Test 4: Sanctioned Country (Iran)**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "currency": "USD",
    "method": "card",
    "userId": "iran-user"
  }'
```

**Expected Result:**

- ❌ Sanctions violation detected
- ❌ Transaction rejected
- 🚨 Compliance alert created (CRITICAL severity)

---

## 📈 **Production Monitoring**

### **Compliance Dashboard (Admin)**

```javascript
// Real-time statistics
const stats = await fetch('/api/governance/statistics');

{
  "runtime_stats": {
    "transactionsRouted": 15234,
    "complianceChecks": 76170,
    "autoCorrections": 847,
    "riskAssessments": 15234,
    "jurisdictionDetections": 15234
  },
  "database_stats": {
    "total_logs": 76170,
    "total_alerts": 23,
    "open_alerts": 5,
    "total_risk_assessments": 15234
  },
  "jurisdiction_breakdown": [
    { "jurisdiction": "USA", "_count": 8456 },
    { "jurisdiction": "CAN", "_count": 2134 },
    { "jurisdiction": "GBR", "_count": 1876 },
    { "jurisdiction": "EUR", "_count": 2134 },
    { "jurisdiction": "GLOBAL", "_count": 634 }
  ],
  "processor_usage": [
    { "processor": "stripe", "_count": 9234 },
    { "processor": "square", "_count": 3456 },
    { "processor": "paypal", "_count": 1876 },
    { "processor": "crypto", "_count": 668 }
  ]
}
```

### **Compliance Alerts**

```javascript
// Get open high-severity alerts
const alerts = await fetch("/api/governance/alerts?status=OPEN&severity=HIGH");

[
  {
    id: "alert-123",
    alertType: "PEP_DETECTED",
    severity: "HIGH",
    userId: "user-456",
    transactionId: "txn-789",
    description: "User flagged as Politically Exposed Person",
    status: "OPEN",
    createdAt: "2024-01-15T10:30:00Z",
  },
];
```

---

## 🔧 **Configuration**

### **Environment Variables**

```bash
# MaxMind GeoIP (for IP detection)
MAXMIND_LICENSE_KEY=your_license_key
MAXMIND_ACCOUNT_ID=your_account_id

# OFAC Sanctions API (optional, uses local list by default)
OFAC_API_KEY=your_ofac_key

# Processor API Keys (stored encrypted in ProcessorConfig table)
STRIPE_SECRET_KEY=sk_live_...
SQUARE_ACCESS_TOKEN=sq0atp-...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

### **Customize Jurisdiction Rules (Admin)**

```bash
PUT /api/governance/rules/USA
```

**Body:**

```json
{
  "requirements": {
    "kyc": { "required": true, "level": "enhanced" },
    "aml": { "required": true, "monitoring": "continuous" },
    "transactionLimit": { "daily": 15000, "monthly": 60000 }
  }
}
```

---

## 🎯 **Key Features Summary**

✅ **Multi-Jurisdiction Support** - USA, Canada, UK, EU, Global  
✅ **Smart Payment Routing** - Auto-select best processor  
✅ **Auto-Correction** - Split transactions, suggest alternatives  
✅ **Risk-Based Policies** - Adapt to transaction risk (never block)  
✅ **Complete Audit Trail** - Every decision logged for compliance  
✅ **Real-Time Alerts** - PEP, sanctions, high-risk transactions  
✅ **Admin Dashboard** - Statistics, alerts, rule management  
✅ **NEVER Blocks Users** - Always finds compliant path

---

## 📚 **Next Steps**

1. **Deploy Database Schema** (5 minutes)
2. **Configure MaxMind GeoIP** (15 minutes)
3. **Set Up Processor API Keys** (10 minutes each)
4. **Test Multi-Jurisdiction Scenarios** (30 minutes)
5. **Build Frontend Dashboard** (2-4 hours)
6. **Monitor Production Alerts** (Ongoing)

---

## 🆘 **Support**

**Questions?** Check the [API Documentation](#-api-endpoints)  
**Issues?** Review [Compliance Alerts](#-compliance-alerts)  
**Custom Rules?** Use [Admin Endpoints](#8-update-rules-admin)

**Governance AI ensures your payment system works globally while maintaining full compliance. No user restrictions. Smart routing. Complete transparency.** 🌐✅
