'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiLock, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';

export default function MaintenancePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown timer
  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 14); // 14 days from now

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse delay-500" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/50 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <FiZap className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Advancia PayLedger
          </span>
        </div>

        {/* Main Content */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm text-violet-300 font-medium">Under Construction</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Something Amazing
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Is Coming Soon
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            We&apos;re building the future of digital payments. Get ready for a revolutionary
            fintech platform with AI-powered analytics, crypto support, and enterprise-grade
            security.
          </p>

          {/* Countdown Timer */}
          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto mb-12">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-violet-500/20 p-4"
              >
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {String(item.value).padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-16">
            {submitted ? (
              <div className="bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/30 rounded-2xl p-6">
                <p className="text-violet-300 font-medium">
                  Thanks for subscribing! We&apos;ll notify you when we launch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-violet-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: FiShield,
                title: 'Bank-Grade Security',
                desc: 'SOC 2 certified with end-to-end encryption',
              },
              {
                icon: FiTrendingUp,
                title: 'AI Analytics',
                desc: 'Real-time insights powered by machine learning',
              },
              {
                icon: FiZap,
                title: 'Instant Payments',
                desc: 'Process transactions in under 2 seconds',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-violet-500/5 to-blue-500/5 backdrop-blur-xl rounded-2xl border border-violet-500/10 p-6 text-left hover:border-violet-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Access Link (hidden) */}
        <a
          href="/auth/login"
          className="fixed bottom-4 right-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          title="Admin Access"
        >
          <FiLock className="w-5 h-5 text-gray-600 group-hover:text-violet-400 transition-colors" />
        </a>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
