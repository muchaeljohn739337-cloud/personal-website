'use client';

import Link from 'next/link';
import {
  FiShield,
  FiLock,
  FiCheck,
  FiServer,
  FiGlobe,
  FiKey,
  FiEye,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import SecurityShield from '@/components/security/SecurityShield';

const securityFeatures = [
  {
    icon: FiLock,
    title: 'End-to-End Encryption',
    description:
      'All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. Your sensitive information is never stored in plain text.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiShield,
    title: 'SOC 2 Type II Certified',
    description:
      'We maintain SOC 2 Type II compliance, demonstrating our commitment to security, availability, and confidentiality of customer data.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: FiKey,
    title: 'Multi-Factor Authentication',
    description:
      'Protect your account with multiple authentication factors including TOTP, SMS, and hardware security keys.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FiServer,
    title: 'DDoS Protection',
    description:
      'Enterprise-grade DDoS mitigation with automatic traffic analysis and rate limiting to ensure platform availability.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: FiEye,
    title: 'Real-Time Monitoring',
    description:
      '24/7 security monitoring with automated threat detection and incident response capabilities.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: FiGlobe,
    title: 'GDPR & CCPA Compliant',
    description:
      'Full compliance with global data protection regulations including GDPR, CCPA, and PCI DSS.',
    color: 'from-indigo-500 to-blue-500',
  },
];

const certifications = [
  { name: 'SOC 2 Type II', status: 'Certified' },
  { name: 'PCI DSS Level 1', status: 'Certified' },
  { name: 'ISO 27001', status: 'Certified' },
  { name: 'GDPR', status: 'Compliant' },
  { name: 'CCPA', status: 'Compliant' },
  { name: 'HIPAA', status: 'Compliant' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-violet-950/20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Advancia</span>
                <span className="text-xs text-blue-400 block -mt-1">Security Center</span>
              </div>
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <FiShield className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-sm text-blue-400">Enterprise Security</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Bank-Grade
              </span>{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Security
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Your security is our top priority. We employ multiple layers of protection to ensure
              your data and transactions are always safe.
            </p>
          </div>

          {/* Security Shield Component */}
          <div className="max-w-4xl mx-auto mb-20">
            <SecurityShield variant="full" showDetails />
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Security Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every layer of our platform is designed with security in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Certifications & Compliance</h2>
              <p className="text-gray-400">
                We maintain the highest industry standards for security and compliance
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 text-center border border-white/10"
                >
                  <FiCheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">{cert.name}</h4>
                  <span className="text-xs text-emerald-400">{cert.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Security Practices</h2>
              <div className="space-y-4">
                {[
                  'Regular penetration testing by third-party security firms',
                  'Automated vulnerability scanning and patching',
                  'Employee security training and background checks',
                  'Incident response team available 24/7',
                  'Data backup and disaster recovery procedures',
                  'Secure development lifecycle (SDLC) practices',
                ].map((practice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{practice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Report a Vulnerability</h3>
                  <p className="text-gray-400 text-sm">Help us keep everyone safe</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                If you discover a security vulnerability, please report it responsibly. We have a
                bug bounty program that rewards security researchers.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Report Vulnerability
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Security?</h2>
          <p className="text-gray-400 mb-8">
            Our security team is here to help. Contact us for more information about our security
            practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Contact Security Team
            </Link>
            <Link
              href="/faq"
              className="px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-colors"
            >
              View Security FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2024 Advancia PayLedger. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
