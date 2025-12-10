import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Advancia',
  description: 'Terms of Service for Advancia PayLedger platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mb-8 text-slate-400">Last updated: January 1, 2024</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="text-slate-400">
              By accessing or using Advancia PayLedger, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">2. Description of Service</h2>
            <p className="text-slate-400">
              Advancia PayLedger provides a SaaS platform for payment processing, business
              automation, CRM, and AI-powered tools. We reserve the right to modify, suspend, or
              discontinue any part of the service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">3. User Accounts</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>You may not share your account credentials with others</li>
              <li>One person or entity may not maintain multiple accounts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">4. Acceptable Use</h2>
            <p className="mb-4 text-slate-400">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>Use the service for any illegal purpose</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">5. Payment Terms</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We may change pricing with 30 days notice</li>
              <li>Failed payments may result in service suspension</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">6. Intellectual Property</h2>
            <p className="text-slate-400">
              All content, features, and functionality of the service are owned by Advancia and are
              protected by international copyright, trademark, and other intellectual property laws.
              You may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">7. Limitation of Liability</h2>
            <p className="text-slate-400">
              To the maximum extent permitted by law, Advancia shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use of the
              service. Our total liability shall not exceed the amount paid by you in the twelve
              months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">8. Termination</h2>
            <p className="text-slate-400">
              We may terminate or suspend your account at any time for violation of these terms.
              Upon termination, your right to use the service will immediately cease. You may cancel
              your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">9. Changes to Terms</h2>
            <p className="text-slate-400">
              We reserve the right to modify these terms at any time. We will notify users of
              material changes via email or through the service. Continued use after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">10. Contact</h2>
            <p className="text-slate-400">
              For questions about these Terms, contact us at:
              <br />
              Email: legal@advanciapayledger.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
