# 🎴 Governance AI - Developer Quick Reference Card

## 🚀 One-Command Deploy

```bash
cd backend && psql $DATABASE_URL -f prisma/migrations/add_governance_ai_tables.sql && npx prisma generate && npm run dev
```

---

## 📡 Core API Calls

### **Route Payment (Most Common)**

```javascript
const response = await fetch("http://localhost:4000/api/governance/route", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 5000,
    currency: "USD",
    method: "card",
    userId: "user123", // optional
  }),
});
```

### **Detect Jurisdiction**

```javascript
const response = await fetch(
  "http://localhost:4000/api/governance/jurisdiction?userId=user123"
);
```

### **Assess Risk**

```javascript
const response = await fetch("http://localhost:4000/api/governance/risk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 10000,
    currency: "USD",
    method: "crypto",
    userId: "user123",
  }),
});
```

---

## 🌍 Jurisdiction Quick Reference

| Code       | Name           | Daily Limit | KYC Level | Compliance |
| ---------- | -------------- | ----------- | --------- | ---------- |
| **USA**    | United States  | $10K        | Enhanced  | **Strict** |
| **CAN**    | Canada         | $15K        | Standard  | Moderate   |
| **GBR**    | United Kingdom | £8K         | Enhanced  | **Strict** |
| **EUR**    | European Union | €10K        | Standard  | **Strict** |
| **GLOBAL** | Fallback       | $50K        | Optional  | Lenient    |

---

## 💳 Processor Selection

| Processor  | Fees         | Settlement | Best For         |
| ---------- | ------------ | ---------- | ---------------- |
| **Stripe** | 2.9% + $0.30 | 2 days     | Global reach     |
| **Square** | 2.6% + $0.10 | 1 day      | **Lowest fees**  |
| **PayPal** | 3.5% + $0.49 | 3 days     | User familiarity |
| **Crypto** | 1.0% + $0    | Instant    | **Fastest**      |

---

## 🔐 Compliance Checks (5 Automatic)

1. ✅ **Transaction Limits** - Daily/monthly caps
2. ✅ **KYC Level** - Identity verification
3. ✅ **Sanctions Screening** - OFAC/UN/EU lists
4. ✅ **Source of Funds** - AML documentation
5. ✅ **PEP Screening** - Politically exposed persons

---

## 🎲 Risk Levels

| Level        | Score Range | Action                       |
| ------------ | ----------- | ---------------------------- |
| **LOW**      | 0.0 - 0.3   | Standard processing          |
| **MEDIUM**   | 0.3 - 0.6   | Standard KYC required        |
| **HIGH**     | 0.6 - 0.8   | Enhanced KYC + lower limits  |
| **CRITICAL** | 0.8 - 1.0   | Manual review + halve limits |

---

## 🚨 Auto-Correction Examples

### **Transaction Too Large**

```
Input: $15K (USA limit: $10K)
Auto-Correct: Split into $10K + $5K
Result: ✅ APPROVED
```

### **Insufficient KYC**

```
Input: $12K (requires Enhanced KYC)
User: Standard KYC only
Auto-Correct: Suggest KYC upgrade
Result: ⚠️ UPGRADE REQUIRED
```

### **High Risk**

```
Input: 20 transactions in 24h
Risk: 0.85 (CRITICAL)
Auto-Correct: Halve limit, require enhanced KYC
Result: ✅ APPROVED with adaptive policies
```

---

## 📊 Admin Endpoints

### **Get Statistics**

```bash
curl http://localhost:4000/api/governance/statistics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Get Alerts**

```bash
curl "http://localhost:4000/api/governance/alerts?status=OPEN" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Update Rules**

```bash
curl -X PUT http://localhost:4000/api/governance/rules/USA \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requirements": {...}}'
```

---

## 🧪 Quick Test Commands

### **Test 1: Basic Routing**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "method": "card"}'
```

### **Test 2: Large Transaction (Auto-Split)**

```bash
curl -X POST http://localhost:4000/api/governance/route \
  -H "Content-Type: application/json" \
  -d '{"amount": 15000, "currency": "USD", "method": "card", "userId": "test-usa"}'
```

### **Test 3: Risk Assessment**

```bash
curl -X POST http://localhost:4000/api/governance/risk \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000, "currency": "USD", "method": "crypto"}'
```

---

## 🔧 Integration Snippets

### **Integrate with Payment Route**

```javascript
// backend/src/routes/payments.ts
const { routeCompliantPayment } = require("../ai/governance_integration");

router.post("/checkout", async (req, res) => {
  const routing = await routeCompliantPayment(
    { amount: req.body.amount, currency: "USD", method: "card" },
    { userId: req.user.id }
  );

  if (!routing.success) {
    return res.status(400).json({ error: routing.error });
  }

  // Process with routing.processor
  const payment = await processPayment(routing.processor, req.body);
  res.json({ success: true, payment });
});
```

### **Listen to Events**

```javascript
// backend/src/index.ts
const governanceAI = getGovernanceAI();

governanceAI.on("payment_routed", (event) => {
  console.log("✅ Payment routed:", event.processor);
});

governanceAI.on("compliance_violation", (event) => {
  console.warn("⚠️ Violation:", event.violations);
});

governanceAI.on("risk_alert", (event) => {
  console.warn("🚨 Risk alert:", event.riskLevel);
});
```

---

## 📁 File Locations

```
backend/src/ai/governance_ai.js              # Core engine (~600 lines)
backend/src/ai/governance_integration.js     # Singleton (~150 lines)
backend/src/routes/governance.ts             # API routes (~650 lines)
backend/prisma/schema.prisma                 # Add 5 models
backend/prisma/migrations/add_governance_ai_tables.sql  # Database (~500 lines)
```

---

## 🐛 Troubleshooting

### **Error: "Governance AI not initialized"**

**Fix:** Check backend logs for initialization errors. Ensure Prisma connected.

### **Error: "No processors available"**

**Fix:** Run SQL migration to populate ProcessorConfig table.

### **Error: "Jurisdiction detection returns GLOBAL"**

**Fix:** Normal without user data. Pass `userId` for accurate detection.

---

## 📚 Documentation

- 📖 **Quick Start** (10 min): [GOVERNANCE_AI_QUICKSTART.md](./GOVERNANCE_AI_QUICKSTART.md)
- 📘 **Full Guide** (complete): [GOVERNANCE_AI_README.md](./GOVERNANCE_AI_README.md)
- 📋 **Deployment**: [GOVERNANCE_AI_DEPLOYMENT.md](./GOVERNANCE_AI_DEPLOYMENT.md)
- 📊 **Summary**: [GOVERNANCE_AI_SUMMARY.md](./GOVERNANCE_AI_SUMMARY.md)

---

## 🎯 Key Principles

1. **Never block users** - Smart routing + auto-correction
2. **Transparent compliance** - Complete audit trail
3. **Risk-based adaptation** - Tighten, don't restrict
4. **Jurisdiction-aware** - Different rules for different regions
5. **Processor-agnostic** - Best fees + fastest settlement

---

## ⚡ Quick Stats

- **Jurisdictions**: 5 (USA, CAN, GBR, EUR, GLOBAL)
- **Processors**: 4 (Stripe, Square, PayPal, Crypto)
- **Compliance Checks**: 5 (Limits, KYC, Sanctions, SOF, PEP)
- **Risk Factors**: 5 (Amount, History, Geography, Velocity, Method)
- **API Endpoints**: 10 (7 public, 3 admin)
- **Database Tables**: 5 (ComplianceLog, JurisdictionRule, RiskAssessment, ProcessorConfig, ComplianceAlert)

---

## 🚀 One-Line Summary

**Governance AI ensures global payment compliance WITHOUT blocking users via smart routing, auto-correction, and risk-based adaptation across 5+ jurisdictions. 🌐✅**

---

**Print this card and keep it at your desk! 📝**
