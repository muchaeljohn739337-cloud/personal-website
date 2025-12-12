# 🔗 Web3Auth Chain Networks Configuration

**Date:** 2025-12-10  
**Project:** advancia  
**Dashboard:** [Chain Networks Configuration](https://dashboard.web3auth.io/organization/advanciapay/projects/BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI/chain-networks)

---

## 📋 Supported Chains

The Web3Auth provider now supports multiple blockchain networks:

### 1. **Ethereum Mainnet** (Default)

- **Chain ID:** `0x1`
- **RPC:** `https://rpc.ankr.com/eth`
- **Explorer:** https://etherscan.io
- **Ticker:** ETH
- **Status:** ✅ Configured

### 2. **Polygon Mainnet**

- **Chain ID:** `0x89`
- **RPC:** `https://rpc.ankr.com/polygon`
- **Explorer:** https://polygonscan.com
- **Ticker:** MATIC
- **Status:** ✅ Configured

### 3. **Arbitrum One**

- **Chain ID:** `0xa4b1`
- **RPC:** `https://rpc.ankr.com/arbitrum`
- **Explorer:** https://arbiscan.io
- **Ticker:** ETH
- **Status:** ✅ Configured

### 4. **Base Mainnet**

- **Chain ID:** `0x2105`
- **RPC:** `https://mainnet.base.org`
- **Explorer:** https://basescan.org
- **Ticker:** ETH
- **Status:** ✅ Configured

---

## 🔧 Configuration in Web3Auth Dashboard

To enable these chains in your Web3Auth project:

1. **Navigate to Chain Networks:**
   - Go to: https://dashboard.web3auth.io/organization/advanciapay/projects/BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI/chain-networks

2. **Enable Supported Chains:**
   - ✅ Ethereum Mainnet (Chain ID: 1)
   - ✅ Polygon Mainnet (Chain ID: 137)
   - ✅ Arbitrum One (Chain ID: 42161)
   - ✅ Base Mainnet (Chain ID: 8453)

3. **Configure RPC Endpoints:**
   - Ensure RPC endpoints are configured for each chain
   - Default endpoints are already set in the code
   - You can customize RPC endpoints in the dashboard if needed

---

## 💻 Code Implementation

### Chain Configuration

Chains are defined in `lib/web3auth/provider.tsx`:

```typescript
export const CHAIN_CONFIGS = {
  ethereum: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x1',
    rpcTarget: 'https://rpc.ankr.com/eth',
    displayName: 'Ethereum Mainnet',
    blockExplorerUrl: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
  // ... other chains
};
```

### Switching Chains

Use the `switchChain` function from the Web3Auth hook:

```typescript
import { useWeb3Auth } from '@/lib/web3auth/provider';

function MyComponent() {
  const { switchChain, currentChain } = useWeb3Auth();

  const handleSwitch = async () => {
    const success = await switchChain('polygon');
    if (success) {
      console.log('Switched to Polygon');
    }
  };

  return (
    <div>
      <p>Current Chain: {currentChain}</p>
      <button onClick={handleSwitch}>Switch to Polygon</button>
    </div>
  );
}
```

---

## 🎯 Usage in Web3 Dashboard

The Web3 dashboard (`/dashboard/web3`) supports chain switching:

1. **Network Selector:**
   - Users can select from available networks
   - Current selection is stored in state
   - Web3Auth will switch chains when connecting

2. **Automatic Chain Detection:**
   - When connecting via Web3Auth, the selected network is used
   - Chain switching happens automatically if needed

3. **Multi-Chain Wallet Support:**
   - Each network maintains separate wallet connections
   - Balances are fetched per network
   - Transactions are network-specific

---

## 🔒 Security Notes

1. **RPC Endpoints:**
   - Using public RPC endpoints (Ankr) by default
   - For production, consider using private RPC endpoints
   - Update `CHAIN_CONFIGS` with your preferred RPC providers

2. **Chain Validation:**
   - Always validate chain IDs before processing transactions
   - Use the `currentChain` state to ensure correct network
   - Implement chain switching confirmation dialogs

3. **Network Configuration:**
   - Ensure chains are enabled in Web3Auth dashboard
   - Verify RPC endpoints are accessible
   - Test chain switching in development before production

---

## 📚 Resources

- **Web3Auth Dashboard:** https://dashboard.web3auth.io/organization/advanciapay/projects/BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI/chain-networks
- **Web3Auth Chain Docs:** https://web3auth.io/docs/chain-configuration
- **Ethereum Chain IDs:** https://chainlist.org

---

## ✅ Next Steps

1. **Enable Chains in Dashboard:**
   - Visit the chain networks page
   - Enable all required chains
   - Verify RPC endpoints

2. **Test Chain Switching:**
   - Connect wallet via Web3Auth
   - Test switching between networks
   - Verify balances update correctly

3. **Update RPC Endpoints (Optional):**
   - Consider using private RPC endpoints for production
   - Update `CHAIN_CONFIGS` with preferred providers
   - Test connectivity and performance

---

**Status:** ✅ Multi-chain support implemented  
**Action Required:** Enable chains in Web3Auth dashboard
