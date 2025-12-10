'use client';

import { Clock, Mail, Shield } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 text-center backdrop-blur-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
            <Clock className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="mb-2 text-2xl font-bold text-white">Account Under Review</h1>

          {/* Message */}
          <div className="mb-6 space-y-4 text-slate-300">
            <p>
              Thank you for registering with{' '}
              <span className="font-semibold text-purple-400">Advancia PayLedger</span>! 🎉
            </p>

            <p>
              Your account is currently being reviewed by our team. This is a standard security
              measure to ensure the safety and integrity of our platform for all users.
            </p>

            <div className="rounded-lg bg-slate-700/50 p-4">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Security Verification in Progress</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                We typically review new accounts within 24 hours.
              </p>
            </div>

            <p className="text-sm">
              You will receive an email notification once your account has been approved.
            </p>
          </div>

          {/* What to Expect */}
          <div className="mb-6 rounded-lg border border-slate-600 p-4 text-left">
            <h3 className="mb-3 font-semibold text-white">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                Our team will verify your registration details
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                You&apos;ll receive an approval email
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                Sign in and start using all features
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Mail className="h-4 w-4" />
            <span>Questions? Contact support@advancia.com</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Check Status
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Return to Homepage
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="h-3 w-px bg-slate-600" />
            <span>Licensed Platform</span>
            <div className="h-3 w-px bg-slate-600" />
            <span>24/7 Support</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          We appreciate your patience and look forward to welcoming you to our platform!
        </p>
      </div>
    </div>
  );
}
