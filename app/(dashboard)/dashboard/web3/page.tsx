'use client';

// eslint-disable-next-line import/no-unresolved
import { Button } from '@/components/ui/button';
// eslint-disable-next-line import/no-unresolved
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// eslint-disable-next-line import/no-unresolved
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown';
// eslint-disable-next-line import/no-unresolved
import { BalanceVisibility } from '@/components/dashboard/BalanceVisibility';
import { useWeb3Auth, type ChainId } from '@/lib/web3auth/provider';
import BuyCryptoButton from '@/components/payments/BuyCryptoButton';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  DollarSign,
  ExternalLink,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
// Helper function to convert Wei to Ether
const weiToEther = (wei: string): string => {
  const weiBigInt = BigInt(wei);
  const divisor = BigInt('1000000000000000000'); // 10^18
  const ether = Number(weiBigInt) / Number(divisor);
  return ether.toFixed(6);
};

// Helper function to convert Ether to Wei
const etherToWei = (ether: string): string => {
  const etherNum = parseFloat(ether);
  const wei = BigInt(Math.floor(etherNum * 1e18));
  return `0x${wei.toString(16)}`;
};

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
      chainId?: string;
    };
  }
}

interface WalletData {
  address: string;
  network: string;
  balance: string;
  balanceUsd: number;
  tokens: Array<{
    symbol: string;
    name: string;
    balance: string;
    balanceUsd: number;
    logo?: string;
  }>;
}

interface TransactionData {
  to: string;
  amount: string;
  network: ChainId;
}

export default function Web3WalletPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'metamask' | 'web3auth'>('web3auth');
  const [balance, setBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendData, setSendData] = useState<TransactionData>({
    to: '',
    amount: '',
    network: 'ethereum',
  });
  const [isSending, setIsSending] = useState(false);
  const [modalLoadTime, setModalLoadTime] = useState<number | null>(null);
  const web3Auth = useWeb3Auth();

  const networkOptions: DropdownOption[] = [
    {
      value: 'ethereum',
      label: 'Ethereum Mainnet',
      icon: <Wallet className="h-4 w-4" />,
      description: 'ETH',
    },
    {
      value: 'polygon',
      label: 'Polygon Mainnet',
      icon: <Wallet className="h-4 w-4" />,
      description: 'MATIC',
    },
    {
      value: 'arbitrum',
      label: 'Arbitrum One',
      icon: <Wallet className="h-4 w-4" />,
      description: 'ETH',
    },
    {
      value: 'base',
      label: 'Base Mainnet',
      icon: <Wallet className="h-4 w-4" />,
      description: 'ETH',
    },
  ];

  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (web3Auth.loggedIn && web3Auth.provider) {
      checkNetwork();
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3Auth.loggedIn, web3Auth.currentChain]);

  const checkNetwork = async () => {
    if (!web3Auth.provider) return;

    try {
      const chainId = await web3Auth.provider.request({ method: 'eth_chainId' });
      const expectedChainId = web3Auth.chainConfigs[web3Auth.currentChain].chainId;

      if (chainId !== expectedChainId) {
        setIsWrongNetwork(true);
        console.warn(
          `[Network] Wrong network detected. Expected: ${expectedChainId}, Got: ${chainId}`
        );
      } else {
        setIsWrongNetwork(false);
        console.log(`[Network] Correct network: ${web3Auth.currentChain}`);
      }
    } catch (error) {
      console.error('[Network] Failed to check network:', error);
    }
  };

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/web3/wallets');
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!web3Auth.loggedIn || !web3Auth.provider) return;

    try {
      setBalanceLoading(true);
      const accounts = await web3Auth.getAccounts();
      if (accounts.length > 0) {
        const address = accounts[0];
        const balanceHex = await web3Auth.getBalance(address);
        const balanceEth = weiToEther(balanceHex);
        setBalance(balanceEth);
      }
    } catch (error) {
      console.error('[Balance] Failed to fetch balance:', error);
      setError('Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleNetworkSwitch = async (chainId: ChainId) => {
    try {
      setError(null);
      console.log(`[Network] User requested switch to: ${chainId}`);
      const success = await web3Auth.switchChain(chainId);
      if (success) {
        await fetchBalance();
        setIsWrongNetwork(false);
      } else {
        setError(`Failed to switch to ${chainId}. Please try again.`);
      }
    } catch (error) {
      console.error('[Network] Switch error:', error);
      setError('Failed to switch network. Please check your wallet.');
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const startTime = performance.now();

      if (connectionMethod === 'web3auth') {
        if (!web3Auth.web3auth) {
          setError('Web3Auth is not initialized. Please check your configuration.');
          return;
        }

        await web3Auth.connect();
        const accounts = await web3Auth.getAccounts();

        if (accounts.length > 0) {
          const address = accounts[0];
          await fetchBalance();

          const response = await fetch('/api/web3/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              network: web3Auth.currentChain,
              chainId: web3Auth.chainConfigs[web3Auth.currentChain].chainId,
              provider: 'web3auth',
            }),
          });

          if (response.ok) {
            await fetchWallets();
          }
        }

        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        setModalLoadTime(parseFloat(loadTime));
        console.log(`[Performance] Web3Auth modal load time: ${loadTime}s`);
      } else {
        if (typeof window.ethereum === 'undefined') {
          setError('Please install MetaMask to connect your wallet!');
          window.open('https://metamask.io/download/', '_blank');
          return;
        }

        const accounts = (await window.ethereum.request({
          method: 'eth_requestAccounts',
        })) as string[];

        const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;

        const response = await fetch('/api/web3/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: accounts[0],
            network: 'ethereum',
            chainId,
            provider: 'metamask',
          }),
        });

        if (response.ok) {
          await fetchWallets();
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!web3Auth.provider || !web3Auth.loggedIn) {
      setError('Wallet not connected');
      return;
    }

    if (!sendData.to || !sendData.amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const accounts = await web3Auth.getAccounts();
      if (accounts.length === 0) {
        setError('No accounts found');
        return;
      }

      const currentBalance = await web3Auth.getBalance(accounts[0]);
      const balanceWei = BigInt(currentBalance);
      const amountWei = BigInt(etherToWei(sendData.amount));
      const gasEstimate = BigInt('21000') * BigInt('20000000000'); // Rough gas estimate

      // Check sufficient funds
      if (balanceWei < amountWei + gasEstimate) {
        setError('Insufficient funds for transaction');
        setIsSending(false);
        return;
      }

      // Send transaction
      const txHash = await web3Auth.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: sendData.to,
            value: etherToWei(sendData.amount),
          },
        ],
      });

      console.log('[Transaction] Transaction sent:', txHash);
      setShowSendModal(false);
      setSendData({ to: '', amount: '', network: 'ethereum' });
      await fetchBalance();
      await fetchWallets();
    } catch (error) {
      console.error('[Transaction] Send error:', error);
      setError('Transaction failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // You could use a toast notification here instead
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.000001) return num.toExponential(2);
    return num.toFixed(6);
  };

  const getCurrentTicker = () => {
    return web3Auth.chainConfigs[web3Auth.currentChain]?.ticker || 'ETH';
  };

  const getBlockExplorerUrl = (address: string) => {
    const explorer = web3Auth.chainConfigs[web3Auth.currentChain]?.blockExplorerUrl;
    return `${explorer}/address/${address}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Web3 Wallets
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Connect and manage your blockchain wallets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="min-h-[44px] sm:min-h-[40px]"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
                <span className="sm:hidden">Connecting</span>
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-400">{error}</p>
                {isWrongNetwork && (
                  <Button
                    onClick={() => handleNetworkSwitch(web3Auth.currentChain)}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Switch Network
                  </Button>
                )}
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wrong Network Warning */}
      {isWrongNetwork && !error && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-400">
                  Wrong Network Detected
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  Please switch to {web3Auth.chainConfigs[web3Auth.currentChain]?.displayName} to
                  continue.
                </p>
                <Button
                  onClick={() => handleNetworkSwitch(web3Auth.currentChain)}
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  Switch Network
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Method Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Connection Method</CardTitle>
          <CardDescription>
            Connect with social login (Web3Auth) or use MetaMask directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setConnectionMethod('web3auth')}
              className={`rounded-xl border p-4 text-left transition-all min-h-[44px] sm:min-h-[80px] ${
                connectionMethod === 'web3auth'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <LogIn className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Web3Auth</span>
              </div>
              <p className="text-sm text-slate-500">
                Social login with Google, GitHub, Email + Multiple wallet support
              </p>
              {web3Auth.loggedIn && <p className="mt-2 text-xs text-emerald-600">✓ Connected</p>}
            </button>

            <button
              onClick={() => setConnectionMethod('metamask')}
              className={`rounded-xl border p-4 text-left transition-all min-h-[44px] sm:min-h-[80px] ${
                connectionMethod === 'metamask'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">MetaMask</span>
              </div>
              <p className="text-sm text-slate-500">
                Direct connection using MetaMask browser extension
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Network Selector and Balance - Only show when connected */}
      {web3Auth.loggedIn && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Network Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Current Network</CardTitle>
              <CardDescription>Switch between supported networks</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedDropdown
                options={networkOptions}
                value={web3Auth.currentChain}
                onChange={(val) => handleNetworkSwitch(val as ChainId)}
                placeholder="Select network"
                searchable
                showIcons
                className="w-full"
              />
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>
                  {web3Auth.chainConfigs[web3Auth.currentChain]?.displayName || 'Unknown Network'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Balance Display */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Current balance on {web3Auth.currentChain}</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="relative rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white overflow-hidden">
                  {/* Water Drop Animation Background */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-white/10 blur-lg animate-float"
                        style={{
                          width: `${15 + Math.random() * 20}px`,
                          height: `${15 + Math.random() * 20}px`,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <p className="text-sm opacity-80 mb-2">Total Balance</p>
                    <BalanceVisibility
                      value={formatBalance(balance)}
                      currency={getCurrentTicker()}
                      size="lg"
                      variant="default"
                      iconPosition="right"
                      className="mb-3"
                    />
                    <Button
                      onClick={fetchBalance}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connected Wallets */}
      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Wallet className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Wallets Connected</h3>
            <p className="mb-6 text-center text-slate-500">
              Connect your first Web3 wallet to start interacting with blockchain apps
            </p>
            <Button onClick={connectWallet} disabled={isConnecting} className="min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              Connect Your First Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {wallets.map((wallet, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {wallet.network.toUpperCase()} Wallet
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(wallet.address)}
                    className="min-h-[44px] sm:min-h-[40px]"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {formatAddress(wallet.address)}
                  <a
                    href={getBlockExplorerUrl(wallet.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance with Water Drop Effects */}
                <div className="relative rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white overflow-hidden">
                  {/* Water Drop Animation Background */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-white/10 blur-lg animate-float"
                        style={{
                          width: `${15 + Math.random() * 20}px`,
                          height: `${15 + Math.random() * 20}px`,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <p className="text-sm opacity-80 mb-2">Total Balance</p>
                    <BalanceVisibility
                      value={wallet.balance}
                      size="lg"
                      variant="default"
                      iconPosition="right"
                      className="mb-2"
                    />
                    <div className="mt-2">
                      <BalanceVisibility
                        value={wallet.balanceUsd}
                        currency="USD"
                        size="sm"
                        variant="minimal"
                        className="text-white/70"
                      />
                    </div>
                  </div>
                </div>

                {/* Tokens */}
                {wallet.tokens && wallet.tokens.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Tokens</p>
                    {wallet.tokens.map((token, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <span className="text-sm font-bold">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-sm text-slate-500">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <BalanceVisibility
                            value={token.balance}
                            size="sm"
                            variant="default"
                            showIcon={false}
                            className="font-medium"
                          />
                          <BalanceVisibility
                            value={token.balanceUsd}
                            currency="USD"
                            size="sm"
                            variant="minimal"
                            showIcon={false}
                            className="text-sm text-slate-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] sm:min-h-[40px]"
                    onClick={() => {
                      if (web3Auth.loggedIn) {
                        const accounts = web3Auth.getAccounts();
                        accounts.then((accs) => {
                          if (accs.length > 0) {
                            setSendData({ ...sendData, to: '', amount: '', network: 'ethereum' });
                            setShowSendModal(true);
                          }
                        });
                      } else {
                        setError('Please connect your wallet first');
                      }
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                  <BuyCryptoButton
                    variant="outline"
                    className="w-full min-h-[44px] sm:min-h-[40px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Transaction Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Send Transaction</CardTitle>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSendData({ to: '', amount: '', network: 'ethereum' });
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                Send {getCurrentTicker()} on{' '}
                {web3Auth.chainConfigs[web3Auth.currentChain]?.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="recipient-address" className="mb-2 block text-sm font-medium">
                  Recipient Address
                </label>
                <input
                  id="recipient-address"
                  type="text"
                  value={sendData.to}
                  onChange={(e) => setSendData({ ...sendData, to: e.target.value })}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 min-h-[44px] sm:min-h-[40px]"
                />
              </div>
              <div>
                <label htmlFor="send-amount" className="mb-2 block text-sm font-medium">
                  Amount ({getCurrentTicker()})
                </label>
                <input
                  id="send-amount"
                  type="number"
                  step="0.000001"
                  value={sendData.amount}
                  onChange={(e) => setSendData({ ...sendData, amount: e.target.value })}
                  placeholder="0.001"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 min-h-[44px] sm:min-h-[40px]"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Available: {formatBalance(balance)} {getCurrentTicker()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendTransaction}
                  disabled={isSending || !sendData.to || !sendData.amount}
                  className="flex-1 min-h-[44px] sm:min-h-[40px]"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendModal(false);
                    setSendData({ to: '', amount: '', network: 'ethereum' });
                    setError(null);
                  }}
                  className="min-h-[44px] sm:min-h-[40px]"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Info */}
      {modalLoadTime !== null && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 dark:text-blue-400">
              <strong>Performance:</strong> Web3Auth modal loaded in {modalLoadTime}s
            </p>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Multi-Chain Support</h3>
              <p className="mt-1 text-sm text-slate-500">
                Connect wallets across Ethereum, Polygon, Arbitrum, and Base
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Wallet className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold">Real-Time Balances</h3>
              <p className="mt-1 text-sm text-slate-500">
                View your token balances and portfolio value in real-time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Seamless Transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Send and receive crypto with just a few clicks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
