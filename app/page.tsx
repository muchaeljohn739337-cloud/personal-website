'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiShield,
  FiCreditCard,
  FiGlobe,
  FiArrowRight,
  FiCheck,
  FiLock,
  FiTrendingUp,
  FiUsers,
  FiMail,
  FiTwitter,
  FiLinkedin,
  FiZap,
  FiLayers,
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCpu,
  FiDatabase,
  FiHexagon,
  FiMenu,
  FiX,
} from 'react-icons/fi';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

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
      gradient: 'from-violet-500 to-teal-600',
    },
    {
      icon: FiTrendingUp,
      title: 'Real-Time Intelligence',
      description:
        'Live dashboards with predictive analytics. Make data-driven decisions in milliseconds.',
      stats: '< 50ms latency',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: FiGlobe,
      title: 'Global Infrastructure',
      description:
        'Edge computing across 200+ locations. Process payments in 135+ currencies instantly.',
      stats: '99.999% uptime SLA',
      gradient: 'from-blue-500 to-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-blue-950/30" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] animate-pulse delay-500" />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <FiHexagon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Advancia
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'Pricing', 'About', 'Docs'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="group relative px-6 py-2.5 text-sm font-medium overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-white flex items-center gap-2">
                  Get Started{' '}
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5">
            <div className="px-4 py-6 space-y-4">
              {['Features', 'Pricing', 'About', 'Docs'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block px-4 py-2 text-gray-400 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link href="/auth/login" className="block px-4 py-2 text-gray-400 hover:text-white">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-3 text-center bg-gradient-to-r from-violet-500 to-blue-500 rounded-xl text-white font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm text-violet-400 font-medium">
                  Now with AI-Powered Analytics
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  The Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
                  Digital Finance
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Enterprise-grade payment infrastructure with AI-powered fraud detection, real-time
                analytics, and seamless multi-currency support.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="group relative px-8 py-4 text-lg font-semibold overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,white,transparent_70%)]" />
                  </div>
                  <span className="relative text-white flex items-center justify-center gap-2">
                    Start Free Trial
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <a
                  href="#features"
                  className="group px-8 py-4 text-lg font-semibold rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <FiActivity className="w-5 h-5" />
                  Watch Demo
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheck className="w-4 h-4 text-violet-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheck className="w-4 h-4 text-violet-400" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiCheck className="w-4 h-4 text-violet-400" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              {/* Main Card */}
              <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                {/* Dashboard Preview */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-3xl font-bold">$2,847,392</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm">
                      <FiTrendingUp className="w-4 h-4" />
                      +24.5%
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="h-40 bg-gradient-to-t from-violet-500/20 to-transparent rounded-xl relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,120 Q50,100 100,90 T200,70 T300,50 T400,30 L400,160 L0,160 Z"
                        fill="url(#chartGradient)"
                      />
                      <path
                        d="M0,120 Q50,100 100,90 T200,70 T300,50 T400,30"
                        fill="none"
                        stroke="rgb(52, 211, 153)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Transactions', value: '847K', icon: FiActivity },
                      { label: 'Users', value: '12.4K', icon: FiUsers },
                      { label: 'Countries', value: '89', icon: FiGlobe },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                        <stat.icon className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                        <p className="text-lg font-semibold">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-8 -right-8 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <FiZap className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instant Settlement</p>
                    <p className="text-xs text-gray-400">{'< 2 seconds'}</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-8 bg-gradient-to-br from-violet-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <FiShield className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fraud Blocked</p>
                    <p className="text-xs text-gray-400">$1.2M saved today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
          <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-700 flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="relative z-10 py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY INDUSTRY LEADERS</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['Stripe', 'Visa', 'Mastercard', 'PayPal', 'Coinbase', 'Square'].map((brand) => (
              <div key={brand} className="text-2xl font-bold text-gray-600">
                {brand}
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

      {/* Stats Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-violet-500/10 rounded-3xl border border-white/10 p-12">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { value: '$50B+', label: 'Processed Annually', icon: FiBarChart2 },
                { value: '10M+', label: 'Active Users', icon: FiUsers },
                { value: '99.999%', label: 'Uptime SLA', icon: FiActivity },
                { value: '200+', label: 'Edge Locations', icon: FiGlobe },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-4 text-violet-400" />
                  <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-gray-500">{stat.label}</p>
                </div>
              ))}
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

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl border border-white/10 p-12 md:p-16 relative overflow-hidden">
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
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <span className="text-gray-500 hover:text-white transition-colors text-sm cursor-pointer">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
