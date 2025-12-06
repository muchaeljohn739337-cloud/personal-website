'use client';

import { useState, useEffect } from 'react';
import {
  FiShield,
  FiCreditCard,
  FiDollarSign,
  FiGlobe,
  FiArrowRight,
  FiSun,
  FiMoon,
  FiCheck,
  FiLock,
  FiTrendingUp,
  FiUsers,
  FiMail,
  FiTwitter,
  FiLinkedin,
} from 'react-icons/fi';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // Check for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    if (
      savedMode === 'true' ||
      (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus('sent');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setFormStatus('idle'), 3000);
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Advancia PayLedger
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Features
              </a>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FiSun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <FiMoon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <a
                href="#pricing"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                About
              </a>
              <a
                href="/auth/login"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/auth/register"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
                <FiShield className="w-4 h-4 mr-2" />
                Secure & Compliant Financial Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                The Future of <span className="text-emerald-600 dark:text-emerald-400">Digital Payments</span>
              </h1>
              <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-8">
                Seamless payments, powerful analytics, unlimited possibilities
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto md:mx-0">
                Advancia PayLedger is your all-in-one fintech solution for managing payments, crypto transactions, health rewards, and more. Built for businesses and individuals who demand excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a
                  href="/auth/register"
                  className="px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <FiArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#features"
                  className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Learn More
                </a>
              </div>
              <div className="flex items-center gap-8 mt-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-emerald-500" />
                  14-day free trial
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 md:h-96 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-xl transform rotate-3 flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <FiCreditCard className="w-20 h-20 mx-auto mb-4 opacity-80" />
                  <p className="text-2xl font-bold">$2.5M+</p>
                  <p className="text-sm opacity-80">Processed Monthly</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-80 md:h-96 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl shadow-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
            <div className="w-20 h-1 bg-emerald-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage your finances in one powerful platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FiCreditCard,
                title: 'Payment Processing',
                description: 'Accept payments via Stripe, crypto, and traditional methods with ease.',
              },
              {
                icon: FiLock,
                title: 'Bank-Grade Security',
                description: 'Enterprise-level encryption and compliance with financial regulations.',
              },
              {
                icon: FiTrendingUp,
                title: 'Real-Time Analytics',
                description: 'Track transactions, revenue, and growth with powerful dashboards.',
              },
              {
                icon: FiGlobe,
                title: 'Global Reach',
                description: 'Process payments in 135+ currencies from customers worldwide.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '$50M+', label: 'Processed' },
              { value: '10K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-emerald-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <div className="w-20 h-1 bg-emerald-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: '/month',
                description: 'Perfect for individuals getting started',
                features: ['Up to 100 transactions/mo', 'Basic analytics', 'Email support', '2 team members'],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Professional',
                price: '$49',
                period: '/month',
                description: 'For growing businesses',
                features: ['Unlimited transactions', 'Advanced analytics', 'Priority support', '10 team members', 'API access', 'Custom integrations'],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$199',
                period: '/month',
                description: 'For large organizations',
                features: ['Everything in Pro', 'Dedicated account manager', 'Custom SLA', 'Unlimited team members', 'White-label options', 'On-premise deployment'],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${plan.popular ? 'ring-2 ring-emerald-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="bg-emerald-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                        <FiCheck className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/auth/register"
                    className={`block w-full py-3 text-center rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About Advancia PayLedger</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Founded with a vision to democratize financial technology, Advancia PayLedger is building the future of digital payments and financial management.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our platform combines cutting-edge technology with user-friendly design to provide businesses and individuals with powerful tools for managing payments, tracking health rewards, and growing their financial portfolio.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FiShield className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Secure</p>
                    <p className="text-sm text-gray-500">Bank-grade encryption</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiUsers className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Trusted</p>
                    <p className="text-sm text-gray-500">10K+ active users</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FiCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span>Industry-leading security with SOC 2 compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span>24/7 customer support with dedicated account managers</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span>Seamless integration with existing business tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span>Transparent pricing with no hidden fees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Get In Touch</h2>
            <div className="w-20 h-1 bg-emerald-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Have questions about our platform? Our team is here to help!
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="How can I help you?"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Your message here..."
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={formStatus === 'sending'}
                  className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400"
                >
                  {formStatus === 'sending'
                    ? 'Sending...'
                    : formStatus === 'sent'
                      ? 'Message Sent!'
                      : 'Send Message'}
                </button>
                {formStatus === 'error' && (
                  <p className="mt-2 text-red-500 text-sm">Failed to send. Please try again.</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Advancia PayLedger</h2>
              <p className="text-gray-400 mb-4 max-w-md">
                The future of digital payments. Secure, fast, and built for modern businesses.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                  <FiTwitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
                  <FiLinkedin className="w-5 h-5" />
                </a>
                <a href="mailto:support@advanciapayledger.com" className="text-gray-400 hover:text-white transition-colors">
                  <FiMail className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/auth/register" className="hover:text-white transition-colors">Get Started</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Advancia PayLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
