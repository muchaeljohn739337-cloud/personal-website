import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Advancia',
  description: 'Privacy Policy for Advancia PayLedger platform',
};

export default function PrivacyPolicyPage() {
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

        <h1 className="mb-8 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mb-8 text-slate-400">Last updated: January 1, 2024</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">1. Introduction</h2>
            <p className="text-slate-400">
              Welcome to Advancia PayLedger (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;,
              &quot;us&quot;). We are committed to protecting your personal information and your
              right to privacy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">2. Information We Collect</h2>
            <p className="mb-4 text-slate-400">
              We collect information that you provide directly to us:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>Account information (name, email, password)</li>
              <li>Profile information (company name, job title)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Communications you send to us</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">
              3. How We Use Your Information
            </h2>
            <p className="mb-4 text-slate-400">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns and trends</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">4. Data Sharing</h2>
            <p className="text-slate-400">
              We do not sell your personal information. We may share your information with third
              parties only in the following circumstances:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-400">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who assist in our operations</li>
              <li>In connection with a merger or acquisition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">5. Data Security</h2>
            <p className="text-slate-400">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. This includes encryption, secure servers, and regular security audits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">6. Your Rights</h2>
            <p className="mb-4 text-slate-400">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-400">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">7. Cookies</h2>
            <p className="text-slate-400">
              We use cookies and similar tracking technologies to track activity on our platform and
              hold certain information. You can instruct your browser to refuse all cookies or to
              indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">8. Contact Us</h2>
            <p className="text-slate-400">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4 text-slate-400">
              Email: privacy@advanciapayledger.com
              <br />
              Address: 123 Business Street, Suite 100, San Francisco, CA 94102
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
