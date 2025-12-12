"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (token && userEmail) {
      setIsAuthenticated(true);
      // Redirect authenticated users to dashboard
      router.push("/dashboard");
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show marketing homepage for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Advancia Pay Ledger
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">Advancia Pay Ledger</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Instant payments with bank-grade security.
              <br />
              Balance updates in real time. Always available.
            </p>
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Create secure account
            </Link>
          </div>
        </section>

        {/* Value Pillars */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Security first</h3>
                <p className="text-gray-600">
                  End-to-end encryption. Fraud protection built in. Your funds
                  stay protected.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Fast transactions
                </h3>
                <p className="text-gray-600">
                  No delays. Money moves and updates instantly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Reliable uptime</h3>
                <p className="text-gray-600">
                  Engineered for continuity. Service stays on.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Clear records</h3>
                <p className="text-gray-600">
                  Precise ledger tracking for every transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need for secure, reliable payments
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                "Real-time balance updates",
                "Encrypted data storage",
                "Trusted identity verification",
                "Global access from any device",
                "Role-based controls for businesses",
                "Automatic error prevention",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-8">
              Trusted by Growing Businesses
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  99.9%
                </div>
                <div className="text-gray-300">uptime infrastructure</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  Bank-grade
                </div>
                <div className="text-gray-300">security standards</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  Global
                </div>
                <div className="text-gray-300">compliance ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">Get started in minutes</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Create your secure account",
                  desc: "Sign up with email verification",
                },
                {
                  step: "2",
                  title: "Add wallet or payment source",
                  desc: "Connect your preferred payment method",
                },
                {
                  step: "3",
                  title: "Send and receive payments instantly",
                  desc: "Transfer money with one click",
                },
                {
                  step: "4",
                  title: "Track every transaction in one place",
                  desc: "Complete visibility and control",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Move your money with confidence
            </h2>
            <p className="text-xl mb-8">
              Join thousands of businesses already using Advancia Pay Ledger
            </p>
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Get started now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Advancia Pay Ledger</h3>
              <p className="text-gray-400 mb-4">
                Secure, fast, and reliable payment solutions
              </p>
              <div className="flex justify-center space-x-6">
                <Link
                  href="/auth/login"
                  className="text-gray-400 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-gray-400 hover:text-white"
                >
                  Sign Up
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  About
                </Link>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // This should not be reached, but just in case
  return null;
}
