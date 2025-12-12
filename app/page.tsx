'use client';

import { Logo } from '@/components/Logo';
import SecurityShield from '@/components/security/SecurityShield';
import { ThemeToggle } from '@/components/ThemeToggle';
import TrustBadges from '@/components/TrustBadges';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiCheck,
  FiCheckCircle,
  FiCpu,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiHexagon,
  FiLayers,
  FiLinkedin,
  FiLock,
  FiMail,
  FiMenu,
  FiPieChart,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiTwitter,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { SiCoinbase, SiMastercard, SiSquare, SiStripe, SiVisa } from 'react-icons/si';

// Animated Counter Component
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {target >= 1000 ? formatNumber(count) : count}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [particlePositions, setParticlePositions] = useState<
    Array<{
      left: number;
      top: number;
      delay: number;
      duration: number;
    }>
  >([]);
  const [particlesMounted, setParticlesMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate particle positions on client only (avoid hydration mismatch)
  useEffect(() => {
    setParticlePositions(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      }))
    );
    setParticlesMounted(true);
  }, []);

  const features = [
    {
      icon: FiCreditCard,
      title: 'Smart Payment Processing',
      description:
        'AI-powered fraud detection with 99.99% accuracy. Process payments via Stripe, crypto, and 50+ payment methods.',
      stats: '2.5M+ transactions/day',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: FiLock,
      title: 'Military-Grade Security',
      description:
        'SOC 2 Type II certified. End-to-end encryption with quantum-resistant algorithms.',
      stats: 'Zero breaches since 2020',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      icon: FiTrendingUp,
      title: 'Real-Time Intelligence',
      description:
        'Live dashboards with predictive analytics. Make data-driven decisions in milliseconds.',
      stats: '< 50ms latency',
      gradient: 'from-violet-600 to-purple-500',
    },
    {
      icon: FiGlobe,
      title: 'Global Infrastructure',
      description:
        'Edge computing across 200+ locations. Process payments in 135+ currencies instantly.',
      stats: '99.999% uptime SLA',
      gradient: 'from-purple-600 to-violet-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a12] text-slate-900 dark:text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-purple-100/40 dark:from-violet-950/30 dark:via-transparent dark:to-purple-950/30" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-200/20 dark:bg-purple-600/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-200/20 dark:bg-violet-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-violet-200/15 dark:bg-purple-600/10 rounded-full blur-[80px] animate-pulse delay-500" />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Navigation - Modern VS Code-inspired design */}
      <nav
        id="navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/50 shadow-lg'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Desktop Navigation - Clean, professional layout */}
            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'Pricing', 'About', 'Docs'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium"
                >
                  {item}
                </a>
              ))}
              <Link
                href="/faq"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium"
              >
                FAQ
              </Link>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2" />
              <Link
                href="/medbed"
                className="px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors rounded hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-1.5 font-medium"
              >
                <FiHeart className="w-3.5 h-3.5" />
                MedBed
              </Link>
              <Link
                href="/crypto"
                className="px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors rounded hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-1.5 font-medium"
              >
                <FiTrendingUp className="w-3.5 h-3.5" />
                Crypto
              </Link>
            </div>

            {/* Auth Buttons - VS Code style */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle variant="icon" />
              <Link
                href="/auth/login"
                className="px-4 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="group relative px-5 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-all"
              >
                Get Started
                <FiArrowRight className="inline-block w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <FiX className="w-5 h-5" aria-hidden="true" />
              ) : (
                <FiMenu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Clean design */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden bg-[#1e1e1e]/98 backdrop-blur-xl border-t border-slate-800/50"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="px-4 py-4 space-y-1">
              {['Features', 'Pricing', 'About', 'Docs'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Link
                href="/faq"
                className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors font-medium text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <div className="h-px bg-slate-800 my-2" />
              <Link
                href="/medbed"
                className="flex items-center gap-2 px-3 py-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors font-medium text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiHeart className="w-4 h-4" />
                MedBed
              </Link>
              <Link
                href="/crypto"
                className="flex items-center gap-2 px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors font-medium text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiTrendingUp className="w-4 h-4" />
                Crypto
              </Link>
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors font-medium text-sm text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 text-center bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Professional, clean layout */}
      <section
        id="main-content"
        className="relative min-h-screen flex items-center pt-14"
        aria-label="Hero section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Badge - Subtle, professional */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-blue-500/30 bg-blue-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-medium tracking-wide uppercase">
                  AI-Powered Analytics
                </span>
              </div>

              {/* Heading - Clean typography */}
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                <span className="text-slate-900 dark:text-white">The Future of</span>
                <br />
                <span className="text-blue-600 dark:text-blue-400">Digital Finance</span>
              </h1>

              {/* Description - Professional tone */}
              <p className="text-lg text-slate-700 dark:text-slate-400 max-w-xl leading-relaxed">
                Join{' '}
                <span className="text-slate-900 dark:text-white font-semibold">
                  50,000+ businesses
                </span>{' '}
                who trust Advancia for secure, lightning-fast payment processing. Start risk-free
                today.
              </p>

              {/* CTA Buttons - Enhanced for Accessibility */}
              <div
                className="flex flex-col sm:flex-row gap-3 pt-2"
                role="group"
                aria-label="Call to action buttons"
              >
                <Link
                  href="/auth/register"
                  className="group relative px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label="Start your free trial - No credit card required"
                >
                  Start Free Trial
                  <FiArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
                <a
                  href="#features"
                  className="group px-6 py-3 text-base font-semibold rounded border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label="Watch product demo video"
                >
                  <FiActivity className="w-4 h-4" aria-hidden="true" />
                  Watch Demo
                </a>
              </div>

              {/* Trust Badges Row 1 */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  Cancel anytime
                </div>
              </div>

              {/* 30-Day Money Back Guarantee Badge */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <FiRefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-400">30-Day Money Back</p>
                    <p className="text-xs text-gray-500">100% Satisfaction Guaranteed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <FiShield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-400">Bank-Level Security</p>
                    <p className="text-xs text-gray-500">256-bit SSL Encryption</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              {/* Main Card - Advanced Revenue Dashboard */}
              <div className="relative z-10 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-violet-500/20 p-8 shadow-2xl shadow-violet-500/10 overflow-hidden">
                {/* Animated Background Glow - More Intense */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-600/40 rounded-full blur-3xl animate-pulse" />
                <div
                  className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/30 rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

                {/* Dashboard Preview */}
                <div className="relative space-y-6">
                  {/* Header with Live Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                          Live Revenue
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">$2,847,392</span>
                        <span className="text-sm text-gray-500">.47</span>
                      </div>
                      <p className="text-xs text-gray-500">Updated 2 seconds ago</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <FiTrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-lg font-bold text-emerald-400">+24.5%</span>
                      </div>
                      <p className="text-xs text-gray-500">vs last month</p>
                    </div>
                  </div>

                  {/* Advanced Chart with Multiple Layers */}
                  <div className="h-44 bg-gradient-to-t from-violet-900/40 via-slate-900/60 to-slate-900/80 rounded-2xl relative overflow-hidden border border-violet-500/20 shadow-inner">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-full border-t border-dashed border-gray-600"
                          style={{ top: `${(i + 1) * 20}%` }}
                        />
                      ))}
                    </div>

                    {/* Y-Axis Labels */}
                    <div className="absolute left-2 top-0 h-full flex flex-col justify-between py-2 text-[10px] text-gray-600">
                      <span>$3M</span>
                      <span>$2M</span>
                      <span>$1M</span>
                      <span>$0</span>
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 400 176" preserveAspectRatio="none">
                      <defs>
                        <linearGradient
                          id="chartGradientAdvanced"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="rgb(52, 211, 153)" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                          <stop offset="100%" stopColor="rgb(52, 211, 153)" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Area Fill */}
                      <path
                        d="M0,140 Q30,130 60,125 T120,100 T180,85 T240,70 T300,45 T360,35 T400,25 L400,176 L0,176 Z"
                        fill="url(#chartGradientAdvanced)"
                      />
                      {/* Main Line */}
                      <path
                        d="M0,140 Q30,130 60,125 T120,100 T180,85 T240,70 T300,45 T360,35 T400,25"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        filter="url(#glow)"
                      />
                      {/* Data Points */}
                      {[
                        [60, 125],
                        [120, 100],
                        [180, 85],
                        [240, 70],
                        [300, 45],
                        [360, 35],
                      ].map(([x, y], i) => (
                        <g key={i}>
                          <circle cx={x} cy={y} r="6" fill="rgba(139, 92, 246, 0.3)" />
                          <circle cx={x} cy={y} r="3" fill="white" />
                        </g>
                      ))}
                    </svg>

                    {/* Tooltip Preview */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                      <p className="text-[10px] text-gray-400">Today</p>
                      <p className="text-sm font-bold text-white">$127,482</p>
                    </div>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Transactions',
                        value: '847K',
                        change: '+12%',
                        icon: FiActivity,
                        gradient: 'from-violet-500 to-purple-600',
                        bg: 'bg-violet-500/10',
                        text: 'text-violet-400',
                        border: 'border-violet-500/30',
                      },
                      {
                        label: 'Active Users',
                        value: '12.4K',
                        change: '+8%',
                        icon: FiUsers,
                        gradient: 'from-emerald-500 to-teal-600',
                        bg: 'bg-emerald-500/10',
                        text: 'text-emerald-400',
                        border: 'border-emerald-500/30',
                      },
                      {
                        label: 'Countries',
                        value: '89',
                        change: '+3',
                        icon: FiGlobe,
                        gradient: 'from-cyan-500 to-blue-600',
                        bg: 'bg-cyan-500/10',
                        text: 'text-cyan-400',
                        border: 'border-cyan-500/30',
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className={`group relative ${stat.bg} hover:bg-opacity-20 rounded-xl p-4 text-center transition-all duration-300 border ${stat.border} cursor-pointer hover:scale-105 hover:shadow-lg`}
                      >
                        <div className="relative">
                          <div
                            className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                          >
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-2xl font-black text-white">{stat.value}</p>
                          <p className="text-xs text-gray-400">{stat.label}</p>
                          <p className={`text-xs ${stat.text} font-semibold mt-1`}>{stat.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <FiDollarSign className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FiCreditCard className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <FiPieChart className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                    <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                      View Full Dashboard <FiArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Cards - Enhanced */}
              <div className="absolute -top-8 -right-8 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <FiZap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Instant Settlement</p>
                      <p className="text-2xl font-bold">{'< 2s'}</p>
                      <p className="text-xs text-gray-500">Quantum-encrypted</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-8 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-4 shadow-xl animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                      <FiShield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-400">Fraud Blocked</p>
                      <p className="text-2xl font-bold">$1.2M</p>
                      <p className="text-xs text-gray-500">Saved today</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MedBed Quick Access */}
              <div className="absolute top-1/2 -right-16 group">
                <Link href="/medbed">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl animate-pulse cursor-pointer hover:scale-110 transition-transform">
                    <FiHeart className="w-6 h-6 text-white" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 dark:text-gray-500">
          <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-gray-700 flex justify-center pt-2">
            <div className="w-1 h-2 bg-slate-400 dark:bg-gray-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="relative z-10 py-12 md:py-16 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs md:text-sm text-slate-600 dark:text-gray-500 mb-6 md:mb-8 uppercase tracking-wider">
            Trusted by Industry Leaders
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 md:gap-12 items-center justify-items-center">
            {[
              { icon: SiStripe, name: 'Stripe' },
              { icon: SiVisa, name: 'Visa' },
              { icon: SiMastercard, name: 'Mastercard' },
              { icon: SiCoinbase, name: 'Coinbase' },
              { icon: SiSquare, name: 'Square' },
            ].map((brand) => (
              <div
                key={brand.name}
                className="group flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-all duration-300"
              >
                <brand.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-slate-400 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                <span className="text-xs text-slate-600 dark:text-gray-600 group-hover:text-slate-800 dark:group-hover:text-gray-400 transition-colors hidden sm:block">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: FiShield,
                title: 'SOC 2 Type II',
                desc: 'Certified',
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: FiLock,
                title: 'PCI DSS',
                desc: 'Level 1 Compliant',
                color: 'from-violet-500 to-blue-600',
              },
              {
                icon: FiDatabase,
                title: 'GDPR',
                desc: 'Compliant',
                color: 'from-purple-500 to-violet-600',
              },
              {
                icon: FiAward,
                title: 'ISO 27001',
                desc: 'Certified',
                color: 'from-blue-500 to-violet-600',
              },
            ].map((badge, i) => (
              <div
                key={i}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <badge.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{badge.title}</h3>
                <p className="text-sm text-gray-500">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <FiCpu className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-gray-400">Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Built for Scale,
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                Designed for Speed
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise infrastructure that handles millions of transactions while maintaining
              sub-50ms latency.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature Selector */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                    activeFeature === index
                      ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{feature.description}</p>
                      <span className="text-xs text-violet-400 font-medium">{feature.stats}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Feature Visual */}
            <div className="relative">
              <div className="sticky top-32 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-10`}
                />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center mb-6">
                    {(() => {
                      const Icon = features[activeFeature].icon;
                      return <Icon className="w-8 h-8 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{features[activeFeature].title}</h3>
                  <p className="text-gray-400 mb-6">{features[activeFeature].description}</p>

                  {/* Feature Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-2xl font-bold text-violet-400">99.99%</p>
                      <p className="text-sm text-gray-500">Accuracy Rate</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-2xl font-bold text-blue-400">{'< 50ms'}</p>
                      <p className="text-sm text-gray-500">Response Time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced with Animated Counters */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-violet-500/10 rounded-3xl border border-white/10 p-12">
            {/* Animated background particles */}
            {particlesMounted && (
              <div className="absolute inset-0 overflow-hidden">
                {particlePositions.map((particle, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-violet-400/30 rounded-full animate-pulse"
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
            <div className="relative grid md:grid-cols-4 gap-8">
              {[
                {
                  target: 50000000000,
                  prefix: '$',
                  suffix: '+',
                  label: 'Processed Annually',
                  icon: FiBarChart2,
                  color: 'from-violet-400 to-purple-500',
                },
                {
                  target: 10000000,
                  suffix: '+',
                  label: 'Active Users',
                  icon: FiUsers,
                  color: 'from-blue-400 to-cyan-500',
                },
                {
                  target: 99.999,
                  suffix: '%',
                  label: 'Uptime SLA',
                  icon: FiActivity,
                  color: 'from-green-400 to-emerald-500',
                },
                {
                  target: 200,
                  suffix: '+',
                  label: 'Edge Locations',
                  icon: FiGlobe,
                  color: 'from-orange-400 to-amber-500',
                },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter
                      target={stat.target}
                      prefix={stat.prefix || ''}
                      suffix={stat.suffix}
                      duration={2500}
                    />
                  </p>
                  <p className="text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proxy & Security Section */}
      <section className="relative z-10 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <FiShield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-400">Speed, Security & Scale</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Enterprise-Grade
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Proxy Infrastructure
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tools to browse, scrape and manage online activity with ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FiGlobe,
                title: 'Global Coverage',
                description:
                  'Access IPs from multiple countries with fast, consistent connections.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: FiRefreshCw,
                title: 'Unlimited Rotations',
                description: 'Rotate IPs automatically to avoid bans and throttling.',
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                icon: FiLock,
                title: 'Secure & Encrypted',
                description: 'Stay anonymous with strong encryption and zero-logging.',
                gradient: 'from-emerald-500 to-green-500',
              },
              {
                icon: FiZap,
                title: 'High Speed',
                description: 'Enjoy fast response times and low-latency proxy servers.',
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                icon: FiCpu,
                title: 'Easy Integration',
                description: 'Simple API integration with comprehensive documentation.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: FiActivity,
                title: 'Real-Time Dashboard',
                description: 'Monitor usage, performance and manage your proxies with ease.',
                gradient: 'from-indigo-500 to-blue-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                  }}
                />
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-emerald-400" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-emerald-400" />
              <span>195+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-emerald-400" />
              <span>10M+ IPs</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-emerald-400" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <FiLayers className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-gray-400">Flexible Plans</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Simple, Transparent
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: '/month',
                description: 'Perfect for side projects and MVPs',
                features: [
                  '1,000 transactions/mo',
                  'Basic analytics',
                  'Email support',
                  '2 team members',
                  'Standard API',
                ],
                cta: 'Start Free',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$99',
                period: '/month',
                description: 'For growing businesses',
                features: [
                  'Unlimited transactions',
                  'Advanced analytics',
                  'Priority support',
                  '25 team members',
                  'Full API access',
                  'Custom webhooks',
                  'White-label options',
                ],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large-scale operations',
                features: [
                  'Everything in Pro',
                  'Dedicated infrastructure',
                  '24/7 phone support',
                  'Unlimited team',
                  'Custom SLA',
                  'On-premise option',
                  'Dedicated CSM',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-3xl border transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-violet-500/20 to-blue-500/20 border-violet-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <FiCheck className="w-5 h-5 text-violet-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className={`block w-full py-4 text-center rounded-xl font-medium transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-90'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <FiAward className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-gray-400">About Us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Building the Future
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  of Finance
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                Advancia PayLedger was founded with a singular vision: to democratize access to
                enterprise-grade financial infrastructure. We believe every business, regardless of
                size, deserves the same powerful tools that Fortune 500 companies use.
              </p>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Our team of fintech veterans and AI researchers has built a platform that processes
                billions in transactions while maintaining the highest security standards in the
                industry.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <FiShield className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold">SOC 2 Type II</p>
                    <p className="text-sm text-gray-500">Certified</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <FiDatabase className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">PCI DSS</p>
                    <p className="text-sm text-gray-500">Level 1 Compliant</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                <h3 className="text-2xl font-bold mb-6">Why Choose Advancia?</h3>
                <div className="space-y-6">
                  {[
                    {
                      title: 'AI-First Approach',
                      desc: 'Machine learning models trained on billions of transactions',
                    },
                    {
                      title: 'Global Infrastructure',
                      desc: 'Edge computing across 200+ locations worldwide',
                    },
                    {
                      title: 'Developer Experience',
                      desc: 'Beautiful APIs, comprehensive SDKs, and detailed docs',
                    },
                    {
                      title: 'Enterprise Support',
                      desc: '24/7 dedicated support with 15-minute response SLA',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">{item.title}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <FiStar className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-gray-400">Customer Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Trusted by
              </span>{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what industry leaders say about Advancia PayLedger
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  'Advancia reduced our payment processing costs by 40% while improving our fraud detection. The AI-powered analytics are game-changing.',
                author: 'Sarah Chen',
                role: 'CTO',
                company: 'TechFlow Inc.',
                avatar: 'SC',
                rating: 5,
              },
              {
                quote:
                  'The integration was seamless. We went from legacy systems to a modern payment infrastructure in just 2 weeks. Outstanding support team.',
                author: 'Marcus Johnson',
                role: 'VP of Engineering',
                company: 'FinanceHub',
                avatar: 'MJ',
                rating: 5,
              },
              {
                quote:
                  'Best-in-class security with SOC 2 compliance gave us the confidence to scale globally. Our transaction volume grew 10x in 6 months.',
                author: 'Elena Rodriguez',
                role: 'CEO',
                company: 'GlobalPay Solutions',
                avatar: 'ER',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-8 hover:border-violet-500/30 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <FiStar key={j} className="w-5 h-5 text-violet-400 fill-violet-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-8 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-500/20 rounded-3xl border border-white/10 p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(52,211,153,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Payment Infrastructure?
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using Advancia to power their financial
                operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-gradient-to-r from-violet-500 to-blue-500 rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#contact"
                  className="px-8 py-4 border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/5 transition-colors"
                >
                  Talk to Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center">
                  <FiHexagon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Advancia</span>
              </Link>
              <p className="text-gray-500 mb-6 max-w-sm">
                Enterprise-grade payment infrastructure for the modern economy.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <FiTwitter className="w-5 h-5 text-gray-400" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <FiLinkedin className="w-5 h-5 text-gray-400" />
                </a>
                <a
                  href="mailto:contact@advanciapayledger.com"
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <FiMail className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'API Docs', 'Integrations'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['FAQ', 'Help Center', 'Contact', '24/7 Live Chat'] },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      {link === 'FAQ' ? (
                        <Link
                          href="/faq"
                          className="text-gray-500 hover:text-white transition-colors text-sm"
                        >
                          {link}
                        </Link>
                      ) : (
                        <span className="text-gray-500 hover:text-white transition-colors text-sm cursor-pointer">
                          {link}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Security Shield & Trust Badges */}
          <div className="border-t border-white/5 pt-8 pb-8">
            <div className="flex flex-col items-center gap-6 mb-8">
              {/* Security Shield Badge */}
              <SecurityShield variant="badge" />

              {/* Trust Badges */}
              <TrustBadges />
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2024 Advancia PayLedger. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
