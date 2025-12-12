'use client';

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Cookie,
  Database,
  Eye,
  FileText,
  Lock,
  Mail,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: FileText,
    content: `Welcome to Advancia PayLedger ("Company", "we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

Your privacy is paramount to us. We've built our platform with privacy-by-design principles, ensuring that your data is protected at every step of your journey with us.`,
  },
  {
    id: 'information-collected',
    title: 'Information We Collect',
    icon: Database,
    details: [
      {
        category: 'Account Information',
        items: [
          'Name, email address, and password',
          'Profile information (company name, job title)',
          'Authentication credentials and security questions',
        ],
      },
      {
        category: 'Payment Information',
        items: [
          'Payment method details (processed securely via Stripe)',
          'Billing address and transaction history',
          'Subscription and plan information',
        ],
      },
      {
        category: 'Usage Data',
        items: [
          'Platform interactions and feature usage',
          'Device information and browser type',
          'IP address and location data',
          'Analytics and performance metrics',
        ],
      },
      {
        category: 'Communications',
        items: [
          'Support tickets and customer service interactions',
          'Feedback and survey responses',
          'Marketing preferences and consent',
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    icon: Eye,
    details: [
      {
        category: 'Service Delivery',
        items: [
          'Provide, maintain, and improve our services',
          'Process transactions and send related information',
          'Authenticate users and prevent fraud',
        ],
      },
      {
        category: 'Communication',
        items: [
          'Send technical notices and support messages',
          'Respond to your comments and questions',
          'Deliver important service updates',
        ],
      },
      {
        category: 'Analytics & Improvement',
        items: [
          'Analyze usage patterns and trends',
          'Develop new features and functionality',
          'Optimize user experience and performance',
        ],
      },
      {
        category: 'Security & Compliance',
        items: [
          'Protect against fraudulent or illegal activity',
          'Comply with legal obligations',
          'Enforce our terms and policies',
        ],
      },
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing & Disclosure',
    icon: Users,
    content: `We do not sell your personal information. Your data is yours, and we respect that. We may share your information with third parties only in the following circumstances:

With your explicit consent, to comply with legal obligations, with trusted service providers who assist in our operations (under strict confidentiality agreements), and in connection with a merger or acquisition (with prior notice).

All third-party service providers are carefully vetted and required to maintain the same level of data protection as we do.`,
  },
  {
    id: 'data-security',
    title: 'Data Security',
    icon: Shield,
    content: `We implement industry-leading technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Our security measures include: end-to-end encryption for sensitive data, secure servers with regular security audits, multi-factor authentication options, regular penetration testing, and compliance with SOC 2 Type II, PCI DSS Level 1, and GDPR standards.

We continuously monitor and update our security practices to stay ahead of emerging threats.`,
  },
  {
    id: 'your-rights',
    title: 'Your Privacy Rights',
    icon: CheckCircle2,
    rights: [
      {
        right: 'Right to Access',
        description: 'Request a copy of all personal data we hold about you',
      },
      {
        right: 'Right to Rectification',
        description: 'Correct any inaccurate or incomplete personal data',
      },
      {
        right: 'Right to Erasure',
        description: 'Request deletion of your personal data (right to be forgotten)',
      },
      {
        right: 'Right to Restrict Processing',
        description: 'Limit how we use your personal data in certain circumstances',
      },
      {
        right: 'Right to Data Portability',
        description: 'Receive your data in a structured, machine-readable format',
      },
      {
        right: 'Right to Object',
        description: 'Object to processing of your data for specific purposes',
      },
      {
        right: 'Right to Withdraw Consent',
        description: 'Withdraw consent at any time where processing is based on consent',
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking Technologies',
    icon: Cookie,
    content: `We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies help us provide you with a better experience by remembering your preferences and understanding how you use our services.

You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.

We use both session cookies (which expire when you close your browser) and persistent cookies (which stay on your device until deleted or expired).`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: Mail,
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, we're here to help. Our privacy team is committed to addressing your inquiries promptly and transparently.`,
    contact: {
      email: 'privacy@advanciapayledger.com',
      address: '123 Business Street, Suite 100, San Francisco, CA 94102',
      responseTime: 'We aim to respond to all privacy inquiries within 48 hours.',
    },
  },
];

export default function PrivacyPolicyPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['introduction']));
  const [lastUpdated] = useState('December 10, 2024');

  useEffect(() => {
    document.title = 'Privacy Policy | Advancia PayLedger';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Comprehensive Privacy Policy for Advancia PayLedger platform - Your data protection and privacy rights'
      );
    }
  }, []);

  const toggleSection = (id: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenSections(newOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-sm bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              <span className="font-semibold text-white">Privacy Policy</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-sm border border-violet-500/30 mb-6">
            <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-violet-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-violet-100 to-blue-100 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Quick Navigation (Desktop) */}
        <div className="hidden lg:block mb-12">
          <div className="sticky top-24 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{section.title}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 sm:space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections.has(section.id);

            return (
              <div
                key={section.id}
                id={section.id}
                className="group bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                        {section.title}
                      </h2>
                      {section.id === 'introduction' && (
                        <p className="text-sm text-slate-400 hidden sm:block">
                          Your privacy matters to us
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 sm:h-6 sm:w-6 text-slate-400 transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Section Content */}
                {isOpen && (
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {section.content && (
                      <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                        {section.content}
                      </p>
                    )}

                    {section.details && (
                      <div className="grid gap-4 sm:gap-6">
                        {section.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-white/5"
                          >
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-violet-400" />
                              {detail.category}
                            </h3>
                            <ul className="space-y-2">
                              {detail.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className="text-slate-300 text-sm sm:text-base flex items-start gap-2"
                                >
                                  <span className="text-violet-400 mt-1.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.rights && (
                      <div className="grid gap-3 sm:gap-4">
                        {section.rights.map((right, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl border border-violet-500/20"
                          >
                            <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-white mb-1">{right.right}</h4>
                              <p className="text-sm text-slate-300">{right.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.contact && (
                      <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl p-6 border border-violet-500/20">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Mail className="h-5 w-5 text-violet-400" />
                              Email
                            </h4>
                            <a
                              href={`mailto:${section.contact.email}`}
                              className="text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              {section.contact.email}
                            </a>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Address</h4>
                            <p className="text-slate-300">{section.contact.address}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400 italic">
                              {section.contact.responseTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-2xl p-8 sm:p-12 border border-violet-500/20">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-violet-400 mx-auto mb-4" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Your Privacy is Our Priority
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              We&apos;re committed to transparency and protecting your data. If you have any
              questions about how we handle your information, don&apos;t hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-lg font-semibold hover:from-violet-600 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                Contact Privacy Team
              </Link>
              <Link
                href="/terms"
                className="px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all border border-white/10"
              >
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
