"use client";

import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  CheckCircleIcon,
  CubeTransparentIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const upcomingFeatures = [
  {
    icon: CubeTransparentIcon,
    title: "Digital Products",
    description:
      "Buy and sell digital goods, templates, courses, and software licenses.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: ShieldCheckIcon,
    title: "Escrow Protection",
    description:
      "Secure transactions with built-in escrow and buyer protection.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BoltIcon,
    title: "Instant Payouts",
    description: "Get paid instantly with our integrated payment system.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: GlobeAltIcon,
    title: "Global Reach",
    description: "Multi-currency support and international payment processing.",
    color: "from-blue-500 to-cyan-500",
  },
];

export default function MarketplacePage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Simulate API call for waitlist signup
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          variants={pulseVariants}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          variants={pulseVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"
          variants={pulseVariants}
          animate="animate"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-white font-semibold text-xl">Advancia</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <motion.main
        className="relative z-10 px-6 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Coming Soon Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium">
              <SparklesIcon className="w-4 h-4" />
              Coming Soon
            </span>
          </motion.div>

          {/* Hero Icon */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl shadow-2xl shadow-emerald-500/30">
              <ShoppingBagIcon className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Advancia{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Marketplace
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            A revolutionary peer-to-peer marketplace is coming. Buy, sell, and
            trade digital products with secure escrow protection and instant
            settlements.
          </motion.p>

          {/* Email Signup */}
          <motion.div variants={itemVariants} className="mb-20">
            {!isSubmitted ? (
              <form
                onSubmit={handleNotifyMe}
                className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <BellIcon className="w-5 h-5" />
                      Notify Me
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 text-emerald-400"
              >
                <CheckCircleIcon className="w-6 h-6" />
                <span className="text-lg font-medium">
                  You&apos;re on the list! We&apos;ll notify you when we launch.
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-left group hover:bg-white/10 transition-all"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Launch Timeline */}
          <motion.div variants={itemVariants} className="mt-16">
            <p className="text-gray-500 text-sm">
              Expected Launch: Q1 2025 • Built for the Advancia Ecosystem
            </p>
          </motion.div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Advancia. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
