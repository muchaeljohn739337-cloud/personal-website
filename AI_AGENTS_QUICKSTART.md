# 🚀 AI AGENTS - QUICK START GUIDE

## Files Created

### **AI Agents** (4 new):
- `backend/src/agents/BlockchainVerificationAgent.ts` - Manifest integrity verification
- `backend/src/agents/MarketIntelligenceAgent.ts` - Crypto market monitoring
- `backend/src/agents/BugFixAgent.ts` - Automated error analysis
- `backend/src/agents/SuggestionAgent.ts` - Personalized AI recommendations

### **Blockchain Infrastructure** (2 new):
- `backend/src/blockchain/ProjectIntegrity.sol` - Solidity smart contract
- `backend/src/blockchain/contractInteraction.ts` - TypeScript client (ethers v6)

### **Modified Files**:
- `backend/src/agents/scheduler.ts` - Added 4 new agent imports and registrations

---

## Quick Test Commands

### 1. Check All Agents Are Running
```bash
cd backend
npm run dev

# Look for in logs:
# "[AgentScheduler] 14 agents initialized"
```

### 2. Verify Database Models Exist
```bash
cd backend
npx prisma studio

# Check tables:
# - BlockchainVerification
# - UserPreference
# - AISuggestion
# - MarketIntelligence
# - CrisisEvent
# - SecurityPatch
```

### 3. Test Market Intelligence (immediate)
```bash
# Wait 15 minutes, then check MarketIntelligence table
# Or manually trigger in Node.js REPL:

node
> const { MarketIntelligenceAgent } = require('./dist/agents/MarketIntelligenceAgent');
> const agent = new MarketIntelligenceAgent({...});
> agent.run();
```

### 4. Monitor Socket.IO Events
```javascript
// In frontend JavaScript console:
socket.on('security:alert', (data) => console.log('🚨 Security:', data));
socket.on('market:update', (data) => console.log('📊 Market:', data));
socket.on('bug:critical', (data) => console.log('🐛 Bug:', data));
socket.on('ai:suggestions', (data) => console.log('💡 Suggestion:', data));
```

---

## Environment Variables to Add

```env
# Optional - Blockchain Verification (feature disabled if not set)
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x...  # Deploy smart contract first
DEPLOYER_PRIVATE_KEY=0x...

# Optional - Market Intelligence (feature degraded if not set)
NEWS_API_KEY=your_newsapi_key  # newsapi.org (free 100 req/day)
```

---

## Agent Schedules

| Agent                   | Schedule         | Description                     |
|-------------------------|------------------|---------------------------------|
| BlockchainVerification  | Every 30 minutes | Verifies manifest integrity     |
| MarketIntelligence      | Every 15 minutes | Monitors crypto prices          |
| BugFix                  | Every 20 minutes | Analyzes recent errors          |
| Suggestion              | Every 4 hours    | Generates personalized tips     |

---

## Next Steps

1. **Deploy Smart Contract** (Optional):
   - Open `backend/src/blockchain/ProjectIntegrity.sol` in Remix IDE
   - Compile with Solidity 0.8.0+
   - Deploy to Polygon Mumbai testnet
   - Add CONTRACT_ADDRESS to .env

2. **Add API Keys** (Optional):
   - Get free NewsAPI key at https://newsapi.org
   - Add NEWS_API_KEY to .env

3. **Test Agents**:
   - Restart backend: `npm run dev`
   - Wait 15-30 minutes
   - Check database tables for new records

4. **Frontend Integration**:
   - Add Socket.IO listeners (see AI_SECURITY_ARCHITECTURE_IMPLEMENTATION.md)
   - Create AI Sentinel Badge component
   - Create Suggestions Dashboard

---

## Troubleshooting

**No agents running?**
```bash
# Check logs for:
[AgentScheduler] 14 agents initialized

# If not found, check imports in scheduler.ts
```

**TypeScript errors?**
```bash
cd backend
npx tsc --noEmit
npm run build
```

**Database errors?**
```bash
cd backend
npx prisma migrate dev --name add_ai_security_agents
npx prisma generate
```

---

**Full Documentation**: See `AI_SECURITY_ARCHITECTURE_IMPLEMENTATION.md`
