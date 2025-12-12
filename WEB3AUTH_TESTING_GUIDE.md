# Web3Auth Network Switching Test Guide

## Overview

This guide provides comprehensive test cases for verifying Web3Auth network switching functionality, balance display, transaction sending, and error handling.

---

## Prerequisites

1. **Development Server Running**

   ```bash
   npm run dev
   ```

2. **Browser Console Open**
   - Press `F12` to open Developer Tools
   - Navigate to the **Console** tab
   - Navigate to the **Network** tab for monitoring requests

3. **Web3Auth Configuration**
   - Ensure `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` is set in `.env.local`
   - Verify Web3Auth dashboard configuration

---

## Test Cases

### Test Case 1: Switch to Polygon

**Steps:**

1. Navigate to `http://localhost:3000/dashboard/web3`
2. Connect wallet using Web3Auth
3. Click the network selector dropdown
4. Select "Polygon Mainnet"

**Expected Results:**

- ✅ Network switches to Polygon (chainId: 0x89)
- ✅ UI updates to show Polygon network
- ✅ Balance refreshes to show MATIC balance
- ✅ Console logs:
  ```
  [Web3Auth] Switching to chain: polygon
  [Web3Auth] Network switched successfully: polygon (X.XXs)
  [Balance] Fetching balance for address: 0x... on Polygon Mainnet
  [Balance] Balance fetched successfully (X.XXs): ...
  ```

**Verification:**

- Check console for success messages
- Verify balance displays in MATIC
- Verify network indicator shows "Polygon Mainnet"

---

### Test Case 2: Switch to Arbitrum

**Steps:**

1. From Polygon network, click network selector
2. Select "Arbitrum One"

**Expected Results:**

- ✅ Network switches to Arbitrum (chainId: 0xa4b1)
- ✅ UI updates to show Arbitrum network
- ✅ Balance refreshes to show ETH balance on Arbitrum
- ✅ Console logs show successful switch

**Verification:**

- Balance should display ETH (not MATIC)
- Network indicator shows "Arbitrum One"
- Block explorer link updates to arbiscan.io

---

### Test Case 3: Switch to Base

**Steps:**

1. From current network, click network selector
2. Select "Base Mainnet"

**Expected Results:**

- ✅ Network switches to Base (chainId: 0x2105)
- ✅ UI updates to show Base network
- ✅ Balance refreshes to show ETH balance on Base
- ✅ Console logs show successful switch

**Verification:**

- Balance displays ETH
- Network indicator shows "Base Mainnet"
- Block explorer link updates to basescan.org

---

### Test Case 4: Verify Balance Display

**Steps:**

1. Connect wallet with known balances
2. Switch between different networks
3. Observe balance updates

**Expected Results:**

- ✅ Balance displays correctly for each network
- ✅ Balance updates after network switch
- ✅ Loading indicator shows during balance fetch
- ✅ Balance loads within 3 seconds

**Verification:**

- Compare displayed balance with wallet's actual balance
- Verify balance format (6 decimal places)
- Check loading states are shown

---

### Test Case 5: Send Transaction

**Steps:**

1. Ensure wallet is connected and has sufficient balance
2. Click "Send" button on a wallet card
3. Enter recipient address (valid Ethereum address)
4. Enter amount: 0.001
5. Click "Send" in modal
6. Confirm transaction in wallet

**Expected Results:**

- ✅ Transaction confirmation modal appears
- ✅ Transaction is processed on the correct network
- ✅ Balance updates after confirmation
- ✅ Transaction appears in wallet history
- ✅ Console logs:
  ```
  [Transaction] Transaction sent: 0x...
  ```

**Verification:**

- Check transaction hash in console
- Verify balance decreased by amount + gas
- Check block explorer for transaction

---

### Test Case 6: Insufficient Funds

**Steps:**

1. Connect wallet with low balance
2. Click "Send" button
3. Enter amount greater than available balance
4. Click "Send"

**Expected Results:**

- ✅ Clear error message: "Insufficient funds for transaction"
- ✅ Transaction is not submitted
- ✅ Wallet remains connected
- ✅ Error message is dismissible

**Verification:**

- Error card appears with red border
- No transaction is sent
- Balance remains unchanged

---

### Test Case 7: Wrong Network Detection

**Steps:**

1. Connect wallet via Web3Auth
2. Manually switch to an unsupported network in MetaMask (e.g., BSC)
3. Observe app behavior

**Expected Results:**

- ✅ App detects wrong network
- ✅ Shows "Please switch to [supported network]" message
- ✅ Provides "Switch Network" button
- ✅ Console logs:
  ```
  [Network] Wrong network detected. Expected: 0x1, Got: 0x38
  ```

**Verification:**

- Warning card appears with amber border
- "Switch Network" button is functional
- Network automatically switches when button clicked

---

### Test Case 8: Modal Load Time

**Steps:**

1. Open browser console
2. Clear console
3. Click "Connect Wallet"
4. Measure time until modal appears

**Expected Results:**

- ✅ Web3Auth modal loads within 2 seconds
- ✅ No UI freezes during loading
- ✅ Performance info card shows load time
- ✅ Console logs:
  ```
  [Performance] Web3Auth modal load time: X.XXs
  ```

**Verification:**

- Check performance card for load time
- Verify modal appears smoothly
- No browser freezing

---

### Test Case 9: Balance Loading Performance

**Steps:**

1. Connect wallet
2. Switch networks multiple times
3. Observe balance load times

**Expected Results:**

- ✅ Balance loads within 3 seconds
- ✅ Loading indicator is shown during fetch
- ✅ Console logs show fetch duration:
  ```
  [Balance] Balance fetched successfully (X.XXs): ...
  ```

**Verification:**

- Check console for timing logs
- Verify loading spinner appears
- Balance updates promptly

---

## Console Logging Reference

All operations log to the browser console with prefixes:

- `[Web3Auth]` - Web3Auth initialization and connection
- `[Network]` - Network switching and detection
- `[Balance]` - Balance fetching operations
- `[Transaction]` - Transaction sending
- `[Performance]` - Performance metrics

---

## Error Handling

### Common Errors and Solutions

1. **"Web3Auth not initialized"**
   - Check `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` in `.env.local`
   - Verify Web3Auth dashboard configuration

2. **"Failed to switch chain"**
   - User may have rejected the switch in wallet
   - Check wallet is unlocked
   - Verify network is supported

3. **"Insufficient funds"**
   - Ensure wallet has enough balance for amount + gas
   - Check gas price estimates

4. **"Wrong Network Detected"**
   - Click "Switch Network" button
   - Or manually switch in wallet

---

## Performance Benchmarks

Expected performance metrics:

- **Modal Load Time:** < 2 seconds
- **Balance Fetch:** < 3 seconds
- **Network Switch:** < 5 seconds
- **Transaction Send:** < 10 seconds (including wallet confirmation)

---

## Testing Checklist

- [ ] Test Case 1: Switch to Polygon
- [ ] Test Case 2: Switch to Arbitrum
- [ ] Test Case 3: Switch to Base
- [ ] Test Case 4: Verify Balance Display
- [ ] Test Case 5: Send Transaction
- [ ] Test Case 6: Insufficient Funds
- [ ] Test Case 7: Wrong Network Detection
- [ ] Test Case 8: Modal Load Time
- [ ] Test Case 9: Balance Loading Performance

---

## Next Steps

After completing all test cases:

1. Review any issues found
2. Check console logs for errors
3. Optimize performance if needed
4. Add more test cases for edge cases
5. Document any bugs or improvements needed

---

## Support

For issues or questions:

- Check browser console for detailed error messages
- Review Web3Auth dashboard: https://dashboard.web3auth.io
- Check network requests in Network tab
- Verify environment variables are set correctly
