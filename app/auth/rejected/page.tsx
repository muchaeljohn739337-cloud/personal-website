'use client';

import { XCircle, Mail, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function RejectedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 text-center backdrop-blur-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600">
            <XCircle className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="mb-2 text-2xl font-bold text-white">Account Not Approved</h1>

          {/* Message */}
          <div className="mb-6 space-y-4 text-slate-300">
            <p>
              We regret to inform you that your account registration with{' '}
              <span className="font-semibold text-purple-400">Advancia PayLedger</span> was not
              approved at this time.
            </p>

            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-center justify-center gap-2 text-red-400">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Verification Unsuccessful</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                This may be due to incomplete information or verification issues.
              </p>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="mb-6 rounded-lg border border-slate-600 p-4 text-left">
            <h3 className="mb-3 font-semibold text-white">Common reasons for rejection:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Incomplete or inaccurate registration information
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Unable to verify identity or email address
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Violation of our terms of service
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Suspicious activity detected during review
              </li>
            </ul>
          </div>

          {/* What to Do */}
          <div className="mb-6 rounded-lg bg-slate-700/50 p-4 text-left">
            <h3 className="mb-3 font-semibold text-white">What you can do:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                Contact our support team for more information
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                Re-apply with accurate and complete information
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                Provide additional documentation if requested
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Mail className="h-4 w-4" />
            <span>Need help? Contact support@advancia.com</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/auth/register">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Registering Again
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
          We appreciate your interest and hope to serve you in the future.
        </p>
      </div>
    </div>
  );
}
