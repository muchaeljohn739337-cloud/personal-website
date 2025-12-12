'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowRight,
  FiArrowUp,
  FiCheck,
  FiDollarSign,
  FiFilter,
  FiLock,
  FiMenu,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingDown,
  FiTrendingUp,
  FiX,
  FiZap,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<Record<string, number>>({});
  const [particlePositions, setParticlePositions] = useState<
    Array<{
      left: number;
      top: number;
      delay: number;
      duration: number;
    }>
  >([]);
  const [particlesMounted, setParticlesMounted] = useState(false);

  // Generate particle positions on client only (avoid hydration mismatch)
  useEffect(() => {
    setParticlePositions(
      Array.from({ length: 15 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      }))
    );
    setParticlesMounted(true);
  }, []);

  // Simulated price updates with animation
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: Record<string, number> = {};
      cryptoCoins.forEach((coin) => {
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        updates[coin.id] = coin.price * (1 + variation);
      });
      setPriceUpdates(updates);
      setTimeout(() => setPriceUpdates({}), 1000);
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
      const isLoggedIn = false;
      if (!isLoggedIn) {
        router.push('/auth/login?redirect=/crypto');
      } else {
        setShowWithdrawModal(true);
      }
    } else if (action === 'buy' || action === 'sell' || action === 'convert') {
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

  const getCurrentPrice = (coinId: string, basePrice: number) => {
    return priceUpdates[coinId] || basePrice;
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      {/* Enhanced Background with Mobile Optimization */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-amber-950/20" />
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-amber-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
        {/* Animated particles for advanced look */}
        {particlesMounted && (
          <div className="absolute inset-0 overflow-hidden">
            {particlePositions.map((particle, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/20 rounded-full animate-pulse"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Mobile-First Navigation */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-sm bg-[#0a0a12]/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden xs:block">
                <span className="text-lg sm:text-xl font-bold">Advancia</span>
                <span className="text-[10px] sm:text-xs text-amber-400 block -mt-0.5 sm:-mt-1">
                  Crypto Exchange
                </span>
              </div>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/5 py-4 animate-in slide-in-from-top">
              <Link
                href="/dashboard"
                className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Welcome Banner - Mobile Optimized */}
      {!welcomeDismissed && (
        <div className="relative z-10 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <FiStar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-1">
                    Welcome to Advancia Crypto Exchange
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                    Trade digital assets, recover lost cryptocurrency, and access premium tokens
                    with institutional-grade security.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWelcomeDismissed(true)}
                className="text-gray-400 hover:text-white flex-shrink-0 p-1"
                aria-label="Dismiss"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hero Section - Mobile First */}
      <section className="relative z-10 pt-6 sm:pt-8 md:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 sm:mb-6">
              <FiShield className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              <span className="text-xs sm:text-sm text-amber-400">Secure • Fast • Reliable</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent block sm:inline">
                Trump Coins
              </span>{' '}
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent block sm:inline">
                & Crypto Trading
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              Access exclusive Trump-themed cryptocurrencies alongside major digital assets. Buy,
              sell, convert, and withdraw with confidence.
            </p>
          </div>

          {/* Enhanced Trading Actions - Mobile Optimized Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-12">
            {tradingActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="group relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden active:scale-95"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 group-active:opacity-15 transition-opacity`}
                />
                <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}
                  >
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm md:text-base">
                    {action.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Enhanced Trading Diagram - Mobile Responsive */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 md:p-8 mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
              Trading Flow Architecture
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-emerald-500/20 rounded-lg sm:rounded-xl border border-emerald-500/30">
                <FiArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="font-medium text-xs sm:text-sm text-emerald-400">Buy</span>
              </div>
              <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-violet-500/20 rounded-lg sm:rounded-xl border border-violet-500/30">
                <FiRefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                <span className="font-medium text-xs sm:text-sm text-violet-400">Convert</span>
              </div>
              <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-amber-500/20 rounded-lg sm:rounded-xl border border-amber-500/30">
                <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="font-medium text-xs sm:text-sm text-amber-400">Withdraw</span>
              </div>
              <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-500/20 rounded-lg sm:rounded-xl border border-blue-500/30">
                <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="font-medium text-xs sm:text-sm text-blue-400">Cash Out</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500/20 rounded-lg sm:rounded-xl border border-red-500/30">
                <FiArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="font-medium text-xs sm:text-sm text-red-400">Sell (Anytime)</span>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coins..."
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setFilterFeatured(!filterFeatured)}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border transition-colors text-sm sm:text-base ${
                filterFeatured
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              <FiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Featured Only</span>
              <span className="sm:hidden">Featured</span>
            </button>
          </div>

          {/* Enhanced Coins Grid - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCoins.map((coin) => {
              const currentPrice = getCurrentPrice(coin.id, coin.price);
              const isUpdating = priceUpdates[coin.id] !== undefined;
              return (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin)}
                  className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden text-left active:scale-[0.98] ${
                    selectedCoin?.id === coin.id
                      ? 'border-amber-500/50 ring-2 ring-amber-500/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {coin.featured && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 bg-amber-500/20 rounded-full z-10">
                      <span className="text-[10px] sm:text-xs text-amber-400 font-medium">
                        Featured
                      </span>
                    </div>
                  )}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {/* Coin Logo */}
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {coin.symbol.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate">{coin.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{coin.symbol}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold text-base sm:text-lg transition-colors ${
                            isUpdating ? 'text-amber-400' : ''
                          }`}
                        >
                          {formatPrice(currentPrice)}
                        </p>
                        <p
                          className={`text-xs sm:text-sm flex items-center justify-end gap-1 ${
                            coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {coin.change24h >= 0 ? (
                            <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <FiTrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          {coin.change24h >= 0 ? '+' : ''}
                          {coin.change24h}%
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                      {coin.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">24h Volume</p>
                        <p className="font-semibold text-xs sm:text-sm">
                          {formatNumber(coin.volume24h)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Market Cap</p>
                        <p className="font-semibold text-xs sm:text-sm">
                          {formatNumber(coin.marketCap)}
                        </p>
                      </div>
                    </div>

                    {/* Networks */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {coin.networks.map((network) => (
                        <span
                          key={network}
                          className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-white/5 rounded-lg text-gray-400"
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons - Mobile Optimized */}
                  <div className="border-t border-white/5 p-3 sm:p-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('buy');
                      }}
                      className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-500/30 active:bg-emerald-500/40 transition-colors"
                    >
                      Buy
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('sell');
                      }}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/30 active:bg-red-500/40 transition-colors"
                    >
                      Sell
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCoin(coin);
                        setShowWithdrawModal(true);
                      }}
                      className="flex-1 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-500/30 active:bg-amber-500/40 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Crypto Recovery Section - Mobile Responsive */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl sm:rounded-3xl border border-violet-500/20 p-6 sm:p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-4 sm:mb-6">
                  <FiShield className="w-3 h-3 sm:w-4 sm:h-4 text-violet-400" />
                  <span className="text-xs sm:text-sm text-violet-400">
                    Crypto Recovery Service
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Lost Access to Your Crypto?
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                  Our advanced blockchain forensics team can help recover lost, stolen, or
                  inaccessible cryptocurrency. We use cutting-edge technology and legal frameworks
                  to maximize recovery success.
                </p>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {[
                    'Lost wallet recovery',
                    'Scam & fraud investigation',
                    'Exchange account recovery',
                    'Hardware wallet data recovery',
                    'Blockchain transaction tracing',
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-300"
                    >
                      <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base active:scale-95"
                >
                  Start Recovery Process
                  <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
              <div className="relative">
                <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl sm:rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-[#0a0a12] rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <FiLock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Recovery Status</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Real-time tracking</p>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { step: 'Case Analysis', status: 'complete' },
                      { step: 'Blockchain Forensics', status: 'complete' },
                      { step: 'Asset Location', status: 'in-progress' },
                      { step: 'Recovery Execution', status: 'pending' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.status === 'complete'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'in-progress'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-white/5 text-gray-500'
                          }`}
                        >
                          {item.status === 'complete' ? (
                            <FiCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : item.status === 'in-progress' ? (
                            <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          ) : (
                            <span className="text-[10px] sm:text-xs">{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm ${
                            item.status === 'pending' ? 'text-gray-500' : 'text-white'
                          }`}
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

      {/* Enhanced Withdraw Modal - Mobile Optimized */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowWithdrawModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowWithdrawModal(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="relative bg-[#0a0a12] rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') e.stopPropagation();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
          >
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-white p-1"
              aria-label="Close"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 id="withdraw-modal-title" className="text-xl sm:text-2xl font-bold mb-2">
                Withdraw {selectedCoin?.symbol || 'Crypto'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Enter your wallet address to receive your funds
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Network Selection */}
              <fieldset>
                <legend className="block text-xs sm:text-sm font-medium mb-2">
                  Select Network
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(selectedCoin?.networks || ['ETH', 'BASE', 'SOL']).map((network) => (
                    <button
                      key={network}
                      type="button"
                      onClick={() => setWithdrawNetwork(network)}
                      className={`p-2 sm:p-3 rounded-xl border text-center transition-all text-xs sm:text-sm active:scale-95 ${
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
                <label
                  htmlFor="wallet-address"
                  className="block text-xs sm:text-sm font-medium mb-2"
                >
                  {withdrawNetwork} Wallet Address
                </label>
                <input
                  id="wallet-address"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={`Enter your ${withdrawNetwork} address`}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none text-sm sm:text-base"
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="withdraw-amount"
                  className="block text-xs sm:text-sm font-medium mb-2"
                >
                  Amount
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-16 sm:pr-20 bg-white/5 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none text-sm sm:text-base"
                  />
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">
                    {selectedCoin?.symbol || 'CRYPTO'}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="text-amber-400 font-medium mb-1">Important</p>
                  <p className="text-gray-400">
                    Ensure you are using the correct network ({withdrawNetwork}). Sending to the
                    wrong network may result in permanent loss of funds.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => {
                  router.push('/auth/login?redirect=/dashboard');
                }}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
              >
                <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Footer - Mobile Responsive */}
      <footer className="relative z-10 border-t border-white/5 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-base">Advancia Crypto</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
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
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © 2024 Advancia Crypto Exchange
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
