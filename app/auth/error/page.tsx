'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification link has expired or has already been used.',
    OAuthSignin: 'Error in constructing an authorization URL.',
    OAuthCallback: 'Error in handling the response from an OAuth provider.',
    OAuthCreateAccount: 'Could not create OAuth provider user in the database.',
    EmailCreateAccount: 'Could not create email provider user in the database.',
    Callback: 'Error in the OAuth callback handler route.',
    OAuthAccountNotLinked: 'Email already exists with a different provider.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin: 'Invalid email or password.',
    SessionRequired: 'Please sign in to access this page.',
    Default: 'An error occurred during authentication.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Authentication Error</h1>
        <p className="mb-6 text-slate-400">{message}</p>
        {error && (
          <p className="mb-6 rounded-lg bg-slate-800 p-3 font-mono text-sm text-slate-500">
            Error code: {error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Try Again
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
