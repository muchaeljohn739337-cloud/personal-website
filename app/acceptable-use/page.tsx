import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Acceptable Use Policy | Advancia',
  description: 'Acceptable Use Policy for Advancia PayLedger platform',
};

export default function AcceptableUsePolicyPage() {
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

        <h1 className="mb-8 text-4xl font-bold text-white">Acceptable Use Policy</h1>
        <p className="mb-8 text-slate-400">Last updated: December 7, 2024</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">1. Introduction</h2>
            <p className="text-slate-300">
              This Acceptable Use Policy (&quot;AUP&quot;) governs your use of Advancia PayLedger
              services. By using our platform, you agree to comply with this policy. Violation of
              this AUP may result in suspension or termination of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">2. Prohibited Activities</h2>
            <p className="mb-4 text-slate-300">You may NOT use our services to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Engage in any illegal activities or promote illegal actions</li>
              <li>Conduct money laundering, fraud, or financial crimes</li>
              <li>Process payments for illegal goods or services</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>
                Attempt to gain unauthorized access to our systems or other users&apos; accounts
              </li>
              <li>Engage in harassment, abuse, or threatening behavior</li>
              <li>Send spam or unsolicited communications</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Circumvent security measures or access controls</li>
              <li>Use automated systems to access our services without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">3. Prohibited Businesses</h2>
            <p className="mb-4 text-slate-300">
              The following business types are prohibited from using our services:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Illegal gambling or unlicensed gaming operations</li>
              <li>Adult content or services</li>
              <li>Weapons, ammunition, or explosives sales</li>
              <li>Controlled substances or drug paraphernalia</li>
              <li>Counterfeit goods or intellectual property infringement</li>
              <li>Pyramid schemes or multi-level marketing scams</li>
              <li>High-risk financial services without proper licensing</li>
              <li>Cryptocurrency mixing or tumbling services</li>
              <li>Services that facilitate tax evasion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">4. Security Requirements</h2>
            <p className="mb-4 text-slate-300">Users must:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Maintain strong, unique passwords for their accounts</li>
              <li>Enable two-factor authentication when available</li>
              <li>Keep login credentials confidential</li>
              <li>Report any security vulnerabilities or breaches immediately</li>
              <li>Not share account access with unauthorized individuals</li>
              <li>Log out of shared or public devices after use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">5. API Usage</h2>
            <p className="mb-4 text-slate-300">When using our APIs, you must:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Respect rate limits and usage quotas</li>
              <li>Not attempt to reverse engineer our systems</li>
              <li>Secure your API keys and tokens</li>
              <li>Not use APIs for competitive analysis or scraping</li>
              <li>Implement proper error handling and retry logic</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">6. Content Guidelines</h2>
            <p className="mb-4 text-slate-300">
              Any content you submit or transmit through our platform must not:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Contain hate speech or discriminatory content</li>
              <li>Include violent or graphic material</li>
              <li>Violate intellectual property rights</li>
              <li>Contain false or misleading information</li>
              <li>Include personal information of others without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">7. Compliance</h2>
            <p className="text-slate-300">
              You are responsible for ensuring your use of our services complies with all applicable
              laws and regulations, including but not limited to anti-money laundering (AML) laws,
              know your customer (KYC) requirements, data protection regulations, and financial
              services regulations in your jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">8. Enforcement</h2>
            <p className="mb-4 text-slate-300">
              We reserve the right to investigate violations of this AUP. Actions we may take
              include:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Warning the user about the violation</li>
              <li>Temporarily suspending account access</li>
              <li>Permanently terminating the account</li>
              <li>Reporting illegal activities to law enforcement</li>
              <li>Pursuing legal action for damages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">9. Reporting Violations</h2>
            <p className="text-slate-300">
              If you become aware of any violations of this AUP, please report them immediately to{' '}
              <a href="mailto:abuse@advancia.com" className="text-blue-400 hover:text-blue-300">
                abuse@advancia.com
              </a>
              . We take all reports seriously and will investigate promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">10. Changes to This Policy</h2>
            <p className="text-slate-300">
              We may update this Acceptable Use Policy from time to time. We will notify users of
              significant changes via email or through our platform. Continued use of our services
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-white">11. Contact Us</h2>
            <p className="text-slate-300">
              If you have questions about this Acceptable Use Policy, please contact us at{' '}
              <a href="mailto:legal@advancia.com" className="text-blue-400 hover:text-blue-300">
                legal@advancia.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500">
            By using Advancia PayLedger, you acknowledge that you have read, understood, and agree
            to be bound by this Acceptable Use Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
