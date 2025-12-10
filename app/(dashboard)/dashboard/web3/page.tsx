'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeb3Auth } from '@/lib/web3auth/provider';
import {
  Copy,
  DollarSign,
  ExternalLink,
  LogIn,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
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

export default function Web3WalletPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [connectionMethod, setConnectionMethod] = useState<'metamask' | 'web3auth'>('web3auth');
  const web3Auth = useWeb3Auth();

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-violet-500' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', color: 'bg-blue-500' },
    { id: 'base', name: 'Base', symbol: 'BASE', color: 'bg-cyan-500' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', color: 'bg-emerald-500' },
  ];

  useEffect(() => {
    fetchWallets();
  }, []);

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

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      if (connectionMethod === 'web3auth') {
        // Connect via Web3Auth (Social Login + Multi-Wallet)
        if (!web3Auth.web3auth) {
          alert('Web3Auth is not initialized. Please check your configuration.');
          return;
        }

        await web3Auth.connect();
        const accounts = await web3Auth.getAccounts();

        if (accounts.length > 0) {
          const address = accounts[0];
          // Get balance for future use
          await web3Auth.getBalance(address);

          // Save to backend
          const response = await fetch('/api/web3/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              network: selectedNetwork,
              chainId: '0x1', // Ethereum Mainnet
              provider: 'web3auth',
            }),
          });

          if (response.ok) {
            await fetchWallets();
          }
        }
      } else {
        // Connect via MetaMask (Original method)
        if (typeof window.ethereum === 'undefined') {
          alert('Please install MetaMask to connect your wallet!');
          window.open('https://metamask.io/download/', '_blank');
          return;
        }

        // Request account access
        const accounts = (await window.ethereum.request({
          method: 'eth_requestAccounts',
        })) as string[];

        // Get network
        const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;

        // Save to backend
        const response = await fetch('/api/web3/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: accounts[0],
            network: selectedNetwork,
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
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web3 Wallets</h1>
          <p className="mt-1 text-slate-500">Connect and manage your blockchain wallets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>

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
              className={`rounded-xl border p-4 text-left transition-all ${
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
              className={`rounded-xl border p-4 text-left transition-all ${
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

      {/* Network Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Network</CardTitle>
          <CardDescription>Choose the blockchain network to connect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedNetwork === network.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${network.color} text-white`}
                >
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="font-medium">{network.name}</p>
                <p className="text-sm text-slate-500">{network.symbol}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <Button onClick={connectWallet} disabled={isConnecting}>
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
                  <Button variant="ghost" size="sm" onClick={() => copyAddress(wallet.address)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {formatAddress(wallet.address)}
                  <a
                    href={`https://etherscan.io/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance */}
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white">
                  <p className="text-sm opacity-80">Total Balance</p>
                  <p className="mt-1 text-3xl font-bold">{wallet.balance}</p>
                  <p className="mt-1 text-sm opacity-80">≈ ${wallet.balanceUsd.toLocaleString()}</p>
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
                          <p className="font-medium">{token.balance}</p>
                          <p className="text-sm text-slate-500">${token.balanceUsd.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Buy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                Connect wallets across Ethereum, Polygon, Arbitrum, Base, and Solana
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
