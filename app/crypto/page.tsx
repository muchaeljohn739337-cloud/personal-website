'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShield,
  FiLock,
  FiZap,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiStar,
} from 'react-icons/fi';

// Trump Coins and other supported cryptocurrencies
const cryptoCoins = [
  {
    id: 'magatrump',
    symbol: 'MAGA',
    name: 'MAGA Trump',
    fullName: 'MAGATRUMP.COIN',
    logo: '/coins/maga.svg',
    color: 'from-red-500 to-red-700',
    bgColor: 'red',
    price: 0.00847,
    change24h: 15.7,
    volume24h: 2847392,
    marketCap: 84700000,
    networks: ['ETH', 'BASE', 'SOL'],
    featured: true,
    description: 'The official MAGA movement cryptocurrency',
  },
  {
    id: 'trump',
    symbol: 'TRUMP',
    name: 'Trump Coin',
    fullName: 'Official Trump',
    logo: '/coins/trump.svg',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'amber',
    price: 12.47,
    change24h: 8.3,
    volume24h: 15847000,
    marketCap: 1247000000,
    networks: ['ETH', 'SOL'],
    featured: true,
    description: 'Premium Trump digital asset',
  },
  {
    id: 'strump',
    symbol: 'STRUMP',
    name: 'Super Trump',
    fullName: 'STRUMP Token',
    logo: '/coins/strump.svg',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'blue',
    price: 0.0234,
    change24h: -3.2,
    volume24h: 847000,
    marketCap: 23400000,
    networks: ['SOL', 'BASE'],
    featured: false,
    description: 'Community-driven Trump token',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    fullName: 'Ethereum',
    logo: '/coins/eth.svg',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'violet',
    price: 3847.23,
    change24h: 2.1,
    volume24h: 18470000000,
    marketCap: 462000000000,
    networks: ['ETH'],
    featured: true,
    description: 'Leading smart contract platform',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    fullName: 'Solana',
    logo: '/coins/sol.svg',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'emerald',
    price: 187.45,
    change24h: 5.8,
    volume24h: 4847000000,
    marketCap: 87400000000,
    networks: ['SOL'],
    featured: true,
    description: 'High-performance blockchain',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    fullName: 'Bitcoin',
    logo: '/coins/btc.svg',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'orange',
    price: 97842.15,
    change24h: 1.2,
    volume24h: 48470000000,
    marketCap: 1920000000000,
    networks: ['BTC'],
    featured: true,
    description: 'The original cryptocurrency',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    fullName: 'Tether USD',
    logo: '/coins/usdt.svg',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'green',
    price: 1.0,
    change24h: 0.01,
    volume24h: 98470000000,
    marketCap: 120000000000,
    networks: ['ETH', 'SOL', 'TRC20', 'BSC'],
    featured: false,
    description: 'Leading stablecoin',
  },
  {
    id: 'base',
    symbol: 'BASE',
    name: 'Base',
    fullName: 'Base Network',
    logo: '/coins/base.svg',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'blue',
    price: 0.0,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    networks: ['BASE'],
    featured: false,
    description: 'Coinbase L2 network',
  },
];

const tradingActions = [
  { id: 'buy', name: 'Buy', icon: FiArrowDown, color: 'from-emerald-500 to-green-600' },
  { id: 'sell', name: 'Sell', icon: FiArrowUp, color: 'from-red-500 to-rose-600' },
  { id: 'convert', name: 'Convert', icon: FiRefreshCw, color: 'from-violet-500 to-purple-600' },
  { id: 'withdraw', name: 'Withdraw', icon: FiDollarSign, color: 'from-amber-500 to-orange-600' },
  { id: 'cashout', name: 'Cash Out', icon: FiZap, color: 'from-blue-500 to-cyan-600' },
];

export default function CryptoPage() {
  const router = useRouter();
  const [selectedCoin, setSelectedCoin] = useState<(typeof cryptoCoins)[0] | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ETH');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // Simulated price updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate minor price fluctuations
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = cryptoCoins.filter((coin) => {
    const matchesSearch =
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeatured = filterFeatured ? coin.featured : true;
    return matchesSearch && matchesFeatured;
  });

  const handleAction = (action: string) => {
    if (action === 'withdraw' || action === 'cashout') {
      // Check auth - redirect if not logged in
      const isLoggedIn = false; // Replace with actual auth check
      if (!isLoggedIn) {
        router.push('/auth/login?redirect=/crypto');
      } else {
        setShowWithdrawModal(true);
      }
    } else if (action === 'buy' || action === 'sell' || action === 'convert') {
      // Redirect to login for trading actions
      router.push('/auth/login?redirect=/crypto');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-amber-950/20" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Advancia</span>
                <span className="text-xs text-amber-400 block -mt-1">Crypto Exchange</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Banner */}
      {!welcomeDismissed && (
        <div className="relative z-10 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FiStar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Welcome to Advancia Crypto Exchange</h2>
                  <p className="text-gray-400">
                    Trade digital assets, recover lost cryptocurrency, and access premium tokens
                    with institutional-grade security.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWelcomeDismissed(true)}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <FiShield className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">Secure • Fast • Reliable</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Trump Coins
              </span>{' '}
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                & Crypto Trading
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Access exclusive Trump-themed cryptocurrencies alongside major digital assets. Buy,
              sell, convert, and withdraw with confidence.
            </p>
          </div>

          {/* Trading Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {tradingActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className={`group relative p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}
                  >
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold">{action.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Trading Diagram */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12">
            <h3 className="text-xl font-bold mb-6 text-center">Trading Flow Architecture</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <FiArrowDown className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Buy</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2 px-4 py-3 bg-violet-500/20 rounded-xl border border-violet-500/30">
                <FiRefreshCw className="w-5 h-5 text-violet-400" />
                <span className="font-medium text-violet-400">Convert</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <FiDollarSign className="w-5 h-5 text-amber-400" />
                <span className="font-medium text-amber-400">Withdraw</span>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <FiZap className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-blue-400">Cash Out</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <FiArrowUp className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">Sell (Anytime)</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coins..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFilterFeatured(!filterFeatured)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-colors ${
                filterFeatured
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              <FiFilter className="w-5 h-5" />
              Featured Only
            </button>
          </div>

          {/* Coins Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoins.map((coin) => (
              <button
                key={coin.id}
                onClick={() => setSelectedCoin(coin)}
                className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden text-left ${
                  selectedCoin?.id === coin.id
                    ? 'border-amber-500/50 ring-2 ring-amber-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {coin.featured && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/20 rounded-full">
                    <span className="text-xs text-amber-400 font-medium">Featured</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Coin Logo */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-xl font-bold text-white">{coin.symbol.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{coin.name}</h3>
                      <p className="text-sm text-gray-500">{coin.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPrice(coin.price)}</p>
                      <p
                        className={`text-sm flex items-center justify-end gap-1 ${
                          coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {coin.change24h >= 0 ? (
                          <FiTrendingUp className="w-4 h-4" />
                        ) : (
                          <FiTrendingDown className="w-4 h-4" />
                        )}
                        {coin.change24h >= 0 ? '+' : ''}
                        {coin.change24h}%
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{coin.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">24h Volume</p>
                      <p className="font-semibold">{formatNumber(coin.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Market Cap</p>
                      <p className="font-semibold">{formatNumber(coin.marketCap)}</p>
                    </div>
                  </div>

                  {/* Networks */}
                  <div className="flex flex-wrap gap-2">
                    {coin.networks.map((network) => (
                      <span
                        key={network}
                        className="px-2 py-1 text-xs bg-white/5 rounded-lg text-gray-400"
                      >
                        {network}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-white/5 p-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('buy');
                    }}
                    className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                  >
                    Buy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('sell');
                    }}
                    className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Sell
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCoin(coin);
                      setShowWithdrawModal(true);
                    }}
                    className="flex-1 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Crypto Recovery Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl border border-violet-500/20 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-6">
                  <FiShield className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-400">Crypto Recovery Service</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Lost Access to Your Crypto?</h2>
                <p className="text-gray-400 mb-6">
                  Our advanced blockchain forensics team can help recover lost, stolen, or
                  inaccessible cryptocurrency. We use cutting-edge technology and legal frameworks
                  to maximize recovery success.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Lost wallet recovery',
                    'Scam & fraud investigation',
                    'Exchange account recovery',
                    'Hardware wallet data recovery',
                    'Blockchain transaction tracing',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <FiCheck className="w-5 h-5 text-violet-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Start Recovery Process
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-[#0a0a12] rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <FiLock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Recovery Status</p>
                      <p className="text-xs text-gray-500">Real-time tracking</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { step: 'Case Analysis', status: 'complete' },
                      { step: 'Blockchain Forensics', status: 'complete' },
                      { step: 'Asset Location', status: 'in-progress' },
                      { step: 'Recovery Execution', status: 'pending' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.status === 'complete'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'in-progress'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-white/5 text-gray-500'
                          }`}
                        >
                          {item.status === 'complete' ? (
                            <FiCheck className="w-4 h-4" />
                          ) : item.status === 'in-progress' ? (
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-xs">{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={item.status === 'pending' ? 'text-gray-500' : 'text-white'}
                        >
                          {item.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-[#0a0a12] rounded-3xl border border-white/10 p-8 max-w-lg w-full">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <FiDollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Withdraw {selectedCoin?.symbol || 'Crypto'}
              </h3>
              <p className="text-gray-400">Enter your wallet address to receive your funds</p>
            </div>

            <div className="space-y-6">
              {/* Network Selection */}
              <fieldset>
                <legend className="block text-sm font-medium mb-2">Select Network</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(selectedCoin?.networks || ['ETH', 'BASE', 'SOL']).map((network) => (
                    <button
                      key={network}
                      type="button"
                      onClick={() => setWithdrawNetwork(network)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        withdrawNetwork === network
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {network}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Wallet Address */}
              <div>
                <label htmlFor="wallet-address" className="block text-sm font-medium mb-2">
                  {withdrawNetwork} Wallet Address
                </label>
                <input
                  id="wallet-address"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={`Enter your ${withdrawNetwork} address`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {selectedCoin?.symbol || 'CRYPTO'}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <FiAlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium">Important</p>
                  <p className="text-gray-400">
                    Ensure you are using the correct network ({withdrawNetwork}). Sending to the
                    wrong network may result in permanent loss of funds.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => {
                  // Check auth and redirect
                  router.push('/auth/login?redirect=/dashboard');
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FiTrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Advancia Crypto</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </div>
            <p className="text-sm text-gray-500">© 2024 Advancia Crypto Exchange</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
