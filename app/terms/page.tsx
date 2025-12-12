'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  Gavel,
  Mail,
  Scale,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: CheckCircle2,
    content: `By accessing or using Advancia PayLedger, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.

These terms constitute a legally binding agreement between you and Advancia PayLedger. Your use of our services indicates your acceptance of these terms in their entirety.`,
  },
  {
    id: 'description',
    title: 'Description of Service',
    icon: FileText,
    content: `Advancia PayLedger provides a comprehensive SaaS platform for payment processing, business automation, CRM, AI-powered tools, and blockchain integration. Our platform is designed to help businesses streamline operations, process payments securely, and scale efficiently.

We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice. We continuously improve our services based on user feedback and technological advancements.`,
    features: [
      'Payment processing and financial management',
      'Business automation and workflow tools',
      'Customer relationship management (CRM)',
      'AI-powered analytics and insights',
      'Blockchain and cryptocurrency integration',
      'Multi-currency support and global payments',
    ],
  },
  {
    id: 'user-accounts',
    title: 'User Accounts & Responsibilities',
    icon: Users,
    responsibilities: [
      {
        title: 'Account Registration',
        items: [
          'You must provide accurate and complete registration information',
          'You must be at least 18 years old or have parental consent',
          'You may not create accounts for others without authorization',
          'One person or entity may not maintain multiple accounts without permission',
        ],
      },
      {
        title: 'Account Security',
        items: [
          'You are responsible for maintaining the security of your account',
          'You must use a strong, unique password',
          'You must notify us immediately of any unauthorized access',
          'You may not share your account credentials with others',
          'Enable two-factor authentication for enhanced security',
        ],
      },
      {
        title: 'Account Activity',
        items: [
          'You are responsible for all activities under your account',
          'You must comply with all applicable laws and regulations',
          'You must not use the service for illegal purposes',
          'You must respect intellectual property rights',
        ],
      },
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    icon: Shield,
    content: `To ensure a safe and productive environment for all users, you agree not to engage in prohibited activities. Violation of these terms may result in immediate account suspension or termination.`,
    prohibitions: [
      {
        category: 'Illegal Activities',
        items: [
          'Use the service for any illegal purpose or in violation of any laws',
          'Engage in money laundering, fraud, or financial crimes',
          'Violate export control laws or sanctions',
        ],
      },
      {
        category: 'Security & Access',
        items: [
          'Attempt to gain unauthorized access to our systems or networks',
          'Interfere with or disrupt the service or servers',
          'Introduce malware, viruses, or harmful code',
          'Reverse engineer, decompile, or disassemble the service',
        ],
      },
      {
        category: 'Content & Intellectual Property',
        items: [
          'Infringe on intellectual property rights of others',
          'Upload or transmit content that is defamatory, obscene, or harmful',
          'Impersonate others or provide false information',
          'Collect or harvest user data without authorization',
        ],
      },
      {
        category: 'Service Abuse',
        items: [
          'Use automated systems to access the service without permission',
          'Overload or stress test our infrastructure',
          'Resell or redistribute the service without authorization',
          'Use the service to compete with our business',
        ],
      },
    ],
  },
  {
    id: 'payment-terms',
    title: 'Payment Terms & Billing',
    icon: CreditCard,
    terms: [
      {
        title: 'Subscription Fees',
        description:
          'Subscription fees are billed in advance on a monthly or annual basis. All fees are quoted in USD unless otherwise specified.',
      },
      {
        title: 'Payment Methods',
        description:
          'We accept major credit cards, bank transfers, and cryptocurrency payments. Payment processing is handled securely through our trusted partners.',
      },
      {
        title: 'Refund Policy',
        description:
          'All fees are non-refundable except as required by law or as explicitly stated in our refund policy. Annual subscriptions may be eligible for prorated refunds under certain circumstances.',
      },
      {
        title: 'Price Changes',
        description:
          'We may change pricing with 30 days advance notice. Existing subscribers will be grandfathered at their current rate for the remainder of their billing cycle.',
      },
      {
        title: 'Failed Payments',
        description:
          'Failed payments may result in service suspension. We will attempt to notify you before suspending service. You are responsible for maintaining valid payment information.',
      },
      {
        title: 'Taxes',
        description:
          'You are responsible for any taxes, duties, or fees applicable to your use of the service based on your location and applicable tax laws.',
      },
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Rights',
    icon: Gavel,
    content: `All content, features, and functionality of the service, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, and software, are owned by Advancia PayLedger and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

You may not copy, modify, distribute, sell, or lease any part of our service or included software, nor may you reverse engineer or attempt to extract the source code of that software, except as expressly permitted by law or with our written permission.`,
    userContent: `You retain ownership of any content you create, upload, or submit through the service. By using our service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content solely for the purpose of providing and improving our services.`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    icon: AlertTriangle,
    content: `To the maximum extent permitted by applicable law, Advancia PayLedger shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use or inability to use the service.

Our total liability to you for all claims arising from or related to the use of the service shall not exceed the amount paid by you to us in the twelve (12) months preceding the claim, or one hundred dollars ($100), whichever is greater.

Some jurisdictions do not allow the exclusion or limitation of certain damages, so the above limitations may not apply to you.`,
  },
  {
    id: 'termination',
    title: 'Termination & Cancellation',
    icon: XCircle,
    content: `We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.

Upon termination, your right to use the service will immediately cease. You may cancel your account at any time through your account settings or by contacting our support team.`,
    terminationDetails: [
      {
        title: 'Termination by Us',
        description:
          'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose a security risk.',
      },
      {
        title: 'Termination by You',
        description:
          'You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.',
      },
      {
        title: 'Effect of Termination',
        description:
          'Upon termination, you will lose access to your account and data. We may delete your account and data after a reasonable retention period.',
      },
      {
        title: 'Data Export',
        description:
          'You may request an export of your data before account termination. We will provide data in a standard format within 30 days of request.',
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    icon: Scale,
    content: `We reserve the right to modify or replace these Terms of Service at any time at our sole discretion. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.

What constitutes a material change will be determined at our sole discretion. We will notify users of material changes via email to the address associated with your account or through a prominent notice on our website.

Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service. If you do not agree to the new terms, you must stop using the service and may cancel your account.`,
  },
  {
    id: 'contact',
    title: 'Contact & Legal Inquiries',
    icon: Mail,
    content: `For questions, concerns, or legal inquiries about these Terms of Service, our legal team is here to assist you. We're committed to transparency and addressing your concerns promptly.`,
    contact: {
      email: 'legal@advanciapayledger.com',
      support: 'support@advanciapayledger.com',
      address: '123 Business Street, Suite 100, San Francisco, CA 94102',
      responseTime: 'We aim to respond to all legal inquiries within 48-72 hours.',
    },
  },
];

export default function TermsOfServicePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['acceptance']));
  const [lastUpdated] = useState('December 10, 2024');

  useEffect(() => {
    document.title = 'Terms of Service | Advancia PayLedger';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Terms of Service for Advancia PayLedger platform - Legal agreement and user guidelines'
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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px]" />
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
              <Scale className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-white">Terms of Service</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 mb-6">
            <Scale className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-amber-100 to-orange-100 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm sm:text-base flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            Last updated: {lastUpdated}
          </p>
          <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            Please read these terms carefully before using our service. By using Advancia PayLedger,
            you agree to be bound by these terms.
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
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                        {section.title}
                      </h2>
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

                    {section.features && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {section.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-white/5"
                          >
                            <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                            <span className="text-slate-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.responsibilities && (
                      <div className="grid gap-4 sm:gap-6">
                        {section.responsibilities.map((responsibility, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-white/5"
                          >
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              {responsibility.title}
                            </h3>
                            <ul className="space-y-2">
                              {responsibility.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className="text-slate-300 text-sm sm:text-base flex items-start gap-2"
                                >
                                  <span className="text-amber-400 mt-1.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.prohibitions && (
                      <div className="grid gap-4 sm:gap-6">
                        {section.prohibitions.map((prohibition, idx) => (
                          <div
                            key={idx}
                            className="bg-red-950/20 rounded-xl p-4 sm:p-6 border border-red-500/20"
                          >
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              {prohibition.category}
                            </h3>
                            <ul className="space-y-2">
                              {prohibition.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className="text-slate-300 text-sm sm:text-base flex items-start gap-2"
                                >
                                  <XCircle className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.terms && (
                      <div className="grid gap-3 sm:gap-4">
                        {section.terms.map((term, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20"
                          >
                            <CreditCard className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-white mb-1">{term.title}</h4>
                              <p className="text-sm text-slate-300">{term.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.userContent && (
                      <div className="bg-blue-950/20 rounded-xl p-6 border border-blue-500/20">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-400" />
                          Your Content
                        </h3>
                        <p className="text-slate-300 text-sm sm:text-base">{section.userContent}</p>
                      </div>
                    )}

                    {section.terminationDetails && (
                      <div className="grid gap-3 sm:gap-4">
                        {section.terminationDetails.map((detail, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-slate-800/50 rounded-xl border border-white/5"
                          >
                            <h4 className="font-semibold text-white mb-2">{detail.title}</h4>
                            <p className="text-sm text-slate-300">{detail.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.contact && (
                      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Mail className="h-5 w-5 text-amber-400" />
                              Legal Inquiries
                            </h4>
                            <a
                              href={`mailto:${section.contact.email}`}
                              className="text-amber-400 hover:text-amber-300 transition-colors block"
                            >
                              {section.contact.email}
                            </a>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">General Support</h4>
                            <a
                              href={`mailto:${section.contact.support}`}
                              className="text-amber-400 hover:text-amber-300 transition-colors block"
                            >
                              {section.contact.support}
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
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-8 sm:p-12 border border-amber-500/20">
            <Scale className="h-12 w-12 sm:h-16 sm:w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Questions About Our Terms?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Our legal team is here to help clarify any questions you may have about these terms
              and how they apply to your use of our service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Contact Legal Team
              </Link>
              <Link
                href="/privacy"
                className="px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all border border-white/10"
              >
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
