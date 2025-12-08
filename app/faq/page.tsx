'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiHeadphones,
  FiHelpCircle,
  FiHexagon,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
} from 'react-icons/fi';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I get started with Advancia PayLedger?',
        a: 'Getting started is simple and risk-free. Click "Start Free Trial" to create your account in under 2 minutes. No credit card required. You\'ll have full access to all features during your 14-day trial period.',
      },
      {
        q: 'Is there a free trial available?',
        a: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. If you're not completely satisfied, you can cancel anytime with no obligations.",
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and cryptocurrency payments including Bitcoin and Ethereum. Choose what works best for your business.',
      },
    ],
  },
  {
    category: 'Security & Trust',
    questions: [
      {
        q: 'Is my data secure with Advancia?',
        a: 'Absolutely. We use bank-level 256-bit SSL encryption, are SOC 2 Type II certified, PCI DSS Level 1 compliant, and GDPR compliant. Your data is protected by the same security standards used by major financial institutions worldwide.',
      },
      {
        q: 'What is your uptime guarantee?',
        a: 'We guarantee 99.999% uptime SLA. Our infrastructure is distributed across 200+ global edge locations, ensuring your payments process reliably 24/7/365. In the rare event of downtime, we provide service credits.',
      },
      {
        q: 'How do you protect against fraud?',
        a: "Our AI-powered fraud detection system analyzes transactions in real-time with 99.99% accuracy. We've blocked over $1.2M in fraudulent transactions today alone. Your business is protected around the clock.",
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    questions: [
      {
        q: 'What is your pricing structure?',
        a: 'We offer transparent, competitive pricing with no hidden fees. Our Starter plan begins at $29/month, Professional at $99/month, and Enterprise plans are custom-quoted. All plans include our 30-day money-back guarantee.',
      },
      {
        q: 'Do you offer a money-back guarantee?',
        a: "Yes! We offer a 30-day money-back guarantee on all plans. If you're not 100% satisfied with Advancia PayLedger, we'll refund your payment in full—no questions asked. Your satisfaction is our priority.",
      },
      {
        q: 'Can I upgrade or downgrade my plan?',
        a: "Absolutely. You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately, and we'll prorate any billing differences. No penalties or hidden fees.",
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No hidden fees, ever. What you see is what you pay. We believe in transparent pricing. Transaction fees are clearly displayed, and there are no setup fees, cancellation fees, or surprise charges.',
      },
    ],
  },
  {
    category: 'Features & Integration',
    questions: [
      {
        q: 'What integrations do you support?',
        a: 'We integrate with 100+ popular platforms including Shopify, WooCommerce, Stripe, QuickBooks, Salesforce, and more. Our REST API and webhooks make custom integrations simple for developers.',
      },
      {
        q: 'Do you support cryptocurrency payments?',
        a: 'Yes! We support Bitcoin, Ethereum, USDC, and 50+ other cryptocurrencies. Receive crypto payments and automatically convert to your preferred currency with competitive exchange rates.',
      },
      {
        q: 'Can I process international payments?',
        a: 'Absolutely. We support payments in 135+ currencies across 89 countries. Our global infrastructure ensures fast processing times regardless of where your customers are located.',
      },
    ],
  },
  {
    category: 'Support',
    questions: [
      {
        q: 'What kind of support do you offer?',
        a: "We provide 24/7 customer support via live chat, email, and phone. Enterprise customers get a dedicated account manager with a 15-minute response SLA. We're here whenever you need us.",
      },
      {
        q: 'Do you have documentation and tutorials?',
        a: 'Yes! We have comprehensive documentation, video tutorials, API references, and a knowledge base. Our developer docs are praised for being clear and thorough. Get started quickly with our guides.',
      },
      {
        q: 'How can I contact support?',
        a: 'Reach us 24/7 via live chat on our website, email at support@advanciapayledger.com, or call our support line. Enterprise customers have direct access to their dedicated account manager.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-purple-950/30" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <FiHexagon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Advancia</span>
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <FiHelpCircle className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-gray-400">Help Center</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Frequently Asked
            </span>{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about Advancia PayLedger. Can&apos;t find what you&apos;re
            looking for? Our support team is here 24/7.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative z-10 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <FiCheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">14-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <FiRefreshCw className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
              <FiLock className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-400">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <FiHeadphones className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="relative z-10 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    {categoryIndex === 0 && <FiArrowRight className="w-4 h-4" />}
                    {categoryIndex === 1 && <FiShield className="w-4 h-4" />}
                    {categoryIndex === 2 && <FiRefreshCw className="w-4 h-4" />}
                    {categoryIndex === 3 && <FiHelpCircle className="w-4 h-4" />}
                    {categoryIndex === 4 && <FiHeadphones className="w-4 h-4" />}
                  </div>
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((item, itemIndex) => {
                    const key = `${categoryIndex}-${itemIndex}`;
                    const isOpen = openItems[key];
                    return (
                      <div
                        key={itemIndex}
                        className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-colors"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left"
                        >
                          <span className="font-semibold pr-4">{item.q}</span>
                          <FiChevronDown
                            className={`w-5 h-5 text-violet-400 flex-shrink-0 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isOpen ? 'max-h-96' : 'max-h-0'
                          }`}
                        >
                          <p className="px-6 pb-5 text-gray-400 leading-relaxed">{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="relative z-10 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-500/20 rounded-3xl border border-white/10 p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Our friendly support team is available 24/7 to help you with any questions. We
              typically respond within minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@advanciapayledger.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <FiMail className="w-5 h-5" />
                Contact Support
              </a>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-colors"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <FiHexagon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Advancia PayLedger</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </div>
            <p className="text-sm text-gray-500">© 2024 Advancia PayLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
