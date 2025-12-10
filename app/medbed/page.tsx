/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCpu,
  FiHeadphones,
  FiHeart,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiShield,
  FiTarget,
  FiUser,
  FiX,
  FiZap,
} from 'react-icons/fi';

// Chamber types
const chambers = [
  {
    id: 'alpha',
    name: 'Recovery Chamber Alpha',
    subtitle: 'Cellular Regeneration Protocol',
    description:
      'Advanced quantum healing technology that accelerates cellular repair and tissue regeneration. Ideal for post-operative recovery and chronic condition management.',
    features: [
      'Nano-particle tissue repair',
      'DNA strand optimization',
      'Immune system enhancement',
      'Pain signal neutralization',
    ],
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'indigo',
    icon: FiHeart,
    duration: '45-90 min',
    price: '$2,500',
  },
  {
    id: 'beta',
    name: 'Enhancement Chamber Beta',
    subtitle: 'Biometric Optimization Suite',
    description:
      'Next-generation performance enhancement system designed to optimize physical and cognitive capabilities beyond natural limits.',
    features: [
      'Neural pathway enhancement',
      'Metabolic acceleration',
      'Strength amplification',
      'Cognitive clarity boost',
    ],
    color: 'from-pink-500 to-rose-600',
    bgColor: 'pink',
    icon: FiZap,
    duration: '60-120 min',
    price: '$3,500',
  },
  {
    id: 'gamma',
    name: 'Diagnostic Chamber Gamma',
    subtitle: 'Quantum Health Analysis',
    description:
      'State-of-the-art diagnostic system utilizing quantum resonance imaging to detect health anomalies at the molecular level before symptoms manifest.',
    features: [
      'Full-body quantum scan',
      'Predictive health modeling',
      'Genetic risk assessment',
      'Real-time biomarker analysis',
    ],
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'indigo',
    icon: FiCpu,
    duration: '30-45 min',
    price: '$1,800',
  },
];

export default function MedBedPage() {
  const router = useRouter();
  const [selectedChamber, setSelectedChamber] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [isDetecting, setIsDetecting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [healthStatus, setHealthStatus] = useState<'normal' | 'elevated' | 'critical' | null>(null);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  });

  // Simulate heart rate detection when holding
  const startHeartDetection = useCallback(() => {
    setIsDetecting(true);
    setHoldProgress(0);
    setHealthStatus(null);
  }, []);

  const stopHeartDetection = useCallback(() => {
    if (holdProgress >= 100) {
      // Detection complete - analyze results
      const rate = Math.floor(Math.random() * 60) + 60; // 60-120 BPM
      setHeartRate(rate);

      if (rate < 60 || rate > 100) {
        setHealthStatus('critical');
      } else if (rate > 85) {
        setHealthStatus('elevated');
      } else {
        setHealthStatus('normal');
      }
    }
    setIsDetecting(false);
  }, [holdProgress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetecting && holdProgress < 100) {
      interval = setInterval(() => {
        setHoldProgress((prev) => Math.min(prev + 2, 100));
        // Simulate fluctuating heart rate during detection
        setHeartRate(Math.floor(Math.random() * 30) + 65);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDetecting, holdProgress]);

  // Show support popup after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSupport(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCashOut = () => {
    const isLoggedIn = false;
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  };

  const handleWithdraw = () => {
    const isLoggedIn = false;
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth/register');
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard/medbed?booking=new');
  };

  const getHealthMessage = () => {
    switch (healthStatus) {
      case 'critical':
        return {
          title: 'Attention Required',
          message:
            'Your vital signs indicate elevated stress levels. We recommend scheduling a Diagnostic Chamber Gamma session.',
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
        };
      case 'elevated':
        return {
          title: 'Slightly Elevated',
          message:
            'Your heart rate is slightly above optimal range. Consider our Recovery Chamber Alpha for a rejuvenating session.',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'normal':
        return {
          title: 'Optimal Health Detected',
          message:
            "Wonderful! Your vital signs are within optimal parameters. You're an excellent candidate for our Enhancement Chamber Beta.",
          color: 'text-green-400',
          bg: 'bg-green-500/10 border-green-500/20',
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-indigo-950 dark:via-slate-900 dark:to-pink-950 text-slate-900 dark:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-indigo-100 dark:border-indigo-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">Advancia</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 block -mt-1">
                  MedBed Division
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCashOut}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                Cash Out
              </button>
              <button
                onClick={handleWithdraw}
                className="px-5 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="relative z-10 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-indigo-500/10 border-b border-indigo-200 dark:border-indigo-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <FiHeart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Welcome to Advancia MedBed Quantum Healing Center! ✨
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Experience revolutionary cellular regeneration technology
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-6">
              <FiActivity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Quantum Healing Technology
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-slate-900 dark:text-white">Advanced</span>{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                MedBed Systems
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Experience the future of healthcare with our revolutionary quantum healing chambers.
              Cellular regeneration, cognitive enhancement, and predictive diagnostics.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <FiZap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    &lt; 2 seconds
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Instant Settlement</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <FiShield className="w-4 h-4" />
                  <span>Quantum Secured</span>
                </div>
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                  <FiTarget className="w-4 h-4" />
                  <span>99.99% Uptime</span>
                </div>
              </div>
            </div>

            {/* Heart Rate Scanner */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Biometric Health Scanner
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Press and hold to detect heart rate
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDetecting
                        ? 'bg-gradient-to-br from-pink-500/30 to-rose-500/30 scale-110'
                        : 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20'
                    }`}
                  >
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="rgba(236, 72, 153, 0.2)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#heartGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={352}
                        strokeDashoffset={352 - (352 * holdProgress) / 100}
                        className="transition-all duration-100"
                      />
                      <defs>
                        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="text-center">
                      <FiHeart
                        className={`w-10 h-10 mx-auto mb-1 ${
                          isDetecting
                            ? 'text-pink-500 animate-pulse'
                            : 'text-indigo-500 dark:text-indigo-400'
                        }`}
                      />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {heartRate}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">BPM</p>
                    </div>
                  </div>
                </div>
                <button
                  onMouseDown={startHeartDetection}
                  onMouseUp={stopHeartDetection}
                  onMouseLeave={stopHeartDetection}
                  onTouchStart={startHeartDetection}
                  onTouchEnd={stopHeartDetection}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isDetecting
                      ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white scale-105 shadow-lg'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                  }`}
                >
                  {isDetecting ? `Detecting... ${holdProgress}%` : 'Press & Hold to Detect'}
                </button>
                {healthStatus && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${getHealthMessage()?.bg} max-w-sm text-center animate-fade-in`}
                  >
                    <h4 className={`text-sm font-bold mb-1 ${getHealthMessage()?.color}`}>
                      {getHealthMessage()?.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {getHealthMessage()?.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chambers Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {chambers.map((chamber) => (
              <div
                key={chamber.id}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${chamber.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <chamber.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
                    {chamber.name}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-4 font-medium">
                    {chamber.subtitle}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    {chamber.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {chamber.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <FiCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {chamber.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Starting at</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">
                        {chamber.price}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedChamber(chamber.id);
                      setShowBooking(true);
                    }}
                    className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r ${chamber.color} text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md`}
                  >
                    Book Session
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Popup */}
      {showSupport && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 max-w-sm shadow-2xl">
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <FiHeadphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1 text-slate-900 dark:text-white">
                  Quantum Health Concierge
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Ready to begin your wellness journey? Our specialists are here to help.
                </p>
                <button
                  onClick={() => {
                    setShowSupport(false);
                    setShowBooking(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md"
                >
                  Begin Your Journey
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowBooking(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                Schedule Your Session
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedChamber
                  ? `Booking: ${chambers.find((c) => c.id === selectedChamber)?.name}`
                  : 'Select your preferred chamber and time'}
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Chamber Selection */}
              {!selectedChamber && (
                <div>
                  <label className="block text-sm font-medium mb-3 text-slate-900 dark:text-white">
                    Select Chamber
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {chambers.map((chamber) => (
                      <button
                        key={chamber.id}
                        type="button"
                        onClick={() => setSelectedChamber(chamber.id)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          selectedChamber === chamber.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <chamber.icon
                          className={`w-6 h-6 mx-auto mb-2 ${
                            selectedChamber === chamber.id
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <p className="text-xs font-medium text-slate-900 dark:text-white">
                          {chamber.id.toUpperCase()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                    Phone
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                    Preferred Time
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      required
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none appearance-none text-slate-900 dark:text-white"
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                  Additional Notes
                </label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-4 top-4 text-slate-400" />
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none min-h-[100px] text-slate-900 dark:text-white"
                    placeholder="Any health conditions or special requirements..."
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <FiCheck className="w-5 h-5" />
                Confirm Booking
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                By booking, you agree to our terms of service and privacy policy
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-md">
                <FiHeart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Advancia MedBed</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link
                href="/privacy"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/faq"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Home
              </Link>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 Advancia MedBed Division
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
