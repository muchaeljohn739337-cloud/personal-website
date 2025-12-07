/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiHeart,
  FiActivity,
  FiZap,
  FiShield,
  FiCpu,
  FiTarget,
  FiArrowRight,
  FiX,
  FiCheck,
  FiHeadphones,
  FiCalendar,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageSquare,
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
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'emerald',
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
    color: 'from-violet-500 to-purple-600',
    bgColor: 'violet',
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
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'blue',
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

  // Show support popup after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSupport(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCashOut = () => {
    // Check if user is logged in (simulated - would check auth state)
    const isLoggedIn = false; // Replace with actual auth check
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
    // Submit booking and redirect to admin
    router.push('/dashboard/admin?booking=new');
  };

  const getHealthMessage = () => {
    switch (healthStatus) {
      case 'critical':
        return {
          title: 'Attention Required',
          message:
            'Your vital signs indicate elevated stress levels. We recommend scheduling a Diagnostic Chamber Gamma session to ensure your wellbeing. Our caring team is here to support your health journey.',
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
        };
      case 'elevated':
        return {
          title: 'Slightly Elevated',
          message:
            'Your heart rate is slightly above optimal range. Consider our Recovery Chamber Alpha for a rejuvenating session that will help restore balance to your system.',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'normal':
        return {
          title: 'Optimal Health Detected',
          message:
            "Wonderful! Your vital signs are within optimal parameters. You're an excellent candidate for our Enhancement Chamber Beta to elevate your performance to new heights.",
          color: 'text-green-400',
          bg: 'bg-green-500/10 border-green-500/20',
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-emerald-950/20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse" />
        {/* DNA Helix Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="dna" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dna)" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Advancia</span>
                <span className="text-xs text-emerald-400 block -mt-1">MedBed Division</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCashOut}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Cash Out
              </button>
              <button
                onClick={handleWithdraw}
                className="px-6 py-2.5 border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="relative z-10 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-b border-emerald-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
                  <FiHeart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Welcome to Advancia MedBed Quantum Healing Center! ✨
                  </h2>
                  <p className="text-gray-400">
                    Experience revolutionary cellular regeneration technology. Your journey to
                    optimal health begins here.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <FiActivity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400">Quantum Healing Technology</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Advanced
              </span>{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                MedBed Systems
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of healthcare with our revolutionary quantum healing chambers.
              Cellular regeneration, cognitive enhancement, and predictive diagnostics—all powered
              by cutting-edge technology.
            </p>
          </div>

          {/* Instant Settlement Card - Enhanced */}
          <div className="max-w-md mx-auto mb-20">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
                {/* Animated rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-emerald-500/20 rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-teal-500/10 rounded-full animate-pulse" />

                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <FiZap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Instant Settlement</h3>
                  <p className="text-emerald-400 text-4xl font-bold mb-2">&lt; 2 seconds</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Lightning-fast transaction processing with quantum-encrypted security
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <FiShield className="w-4 h-4" />
                      <span>Quantum Secured</span>
                    </div>
                    <div className="flex items-center gap-2 text-teal-400">
                      <FiTarget className="w-4 h-4" />
                      <span>99.99% Uptime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heart Rate Detection */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Biometric Health Scanner</h3>
                <p className="text-gray-400">
                  Press and hold the heart icon to initiate vital sign detection
                </p>
              </div>

              <div className="flex flex-col items-center">
                {/* Heart Rate Display */}
                <div className="relative mb-8">
                  <div
                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDetecting
                        ? 'bg-gradient-to-br from-red-500/30 to-pink-500/30 scale-110'
                        : 'bg-gradient-to-br from-red-500/20 to-pink-500/20'
                    }`}
                  >
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.2)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="url(#heartGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * holdProgress) / 100}
                        className="transition-all duration-100"
                      />
                      <defs>
                        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="text-center">
                      <FiHeart
                        className={`w-12 h-12 mx-auto mb-2 ${
                          isDetecting ? 'text-red-400 animate-pulse' : 'text-red-500'
                        }`}
                      />
                      <p className="text-3xl font-bold">{heartRate}</p>
                      <p className="text-xs text-gray-500">BPM</p>
                    </div>
                  </div>
                </div>

                {/* Hold Button */}
                <button
                  onMouseDown={startHeartDetection}
                  onMouseUp={stopHeartDetection}
                  onMouseLeave={stopHeartDetection}
                  onTouchStart={startHeartDetection}
                  onTouchEnd={stopHeartDetection}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    isDetecting
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 scale-105'
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 hover:border-red-500/50'
                  }`}
                >
                  {isDetecting
                    ? `Detecting... ${holdProgress}%`
                    : 'Press & Hold to Detect Heart Rate'}
                </button>

                {/* Health Status Message */}
                {healthStatus && (
                  <div
                    className={`mt-8 p-6 rounded-2xl border ${getHealthMessage()?.bg} max-w-md text-center animate-fade-in`}
                  >
                    <h4 className={`text-lg font-bold mb-2 ${getHealthMessage()?.color}`}>
                      {getHealthMessage()?.title}
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {getHealthMessage()?.message}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedChamber(
                          healthStatus === 'critical'
                            ? 'gamma'
                            : healthStatus === 'elevated'
                              ? 'alpha'
                              : 'beta'
                        );
                        setShowBooking(true);
                      }}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Book Recommended Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chambers Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {chambers.map((chamber) => (
              <div
                key={chamber.id}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 hover:border-white/20 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${chamber.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`}
                />
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${chamber.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <chamber.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{chamber.name}</h3>
                  <p className={`text-sm text-${chamber.bgColor}-400 mb-4`}>{chamber.subtitle}</p>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {chamber.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {chamber.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <FiCheck className={`w-4 h-4 text-${chamber.bgColor}-400`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{chamber.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Starting at</p>
                      <p className={`font-bold text-${chamber.bgColor}-400`}>{chamber.price}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedChamber(chamber.id);
                      setShowBooking(true);
                    }}
                    className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r ${chamber.color} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
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
          <div className="relative bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-violet-500/30 p-6 max-w-sm shadow-2xl">
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <FiHeadphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Quantum Health Concierge</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Ready to embark on your wellness transformation? Our specialists are standing by
                  to guide you.
                </p>
                <button
                  onClick={() => {
                    setShowSupport(false);
                    setShowBooking(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
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
          <div className="relative bg-[#0a0a12] rounded-3xl border border-white/10 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBooking(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Schedule Your Session</h3>
              <p className="text-gray-400">
                {selectedChamber
                  ? `Booking: ${chambers.find((c) => c.id === selectedChamber)?.name}`
                  : 'Select your preferred chamber and time'}
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Chamber Selection */}
              {!selectedChamber && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Chamber</label>
                  <div className="grid grid-cols-3 gap-2">
                    {chambers.map((chamber) => (
                      <button
                        key={chamber.id}
                        type="button"
                        onClick={() => setSelectedChamber(chamber.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedChamber === chamber.id
                            ? `border-${chamber.bgColor}-500 bg-${chamber.bgColor}-500/10`
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <chamber.icon className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">{chamber.id.toUpperCase()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      required
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Date</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="date"
                      required
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                      required
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none appearance-none"
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
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-4 top-4 text-gray-500" />
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none min-h-[100px]"
                    placeholder="Any health conditions or special requirements..."
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Confirm Booking
              </button>

              <p className="text-center text-xs text-gray-500">
                By booking, you agree to our terms of service and privacy policy
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <FiHeart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Advancia MedBed</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </div>
            <p className="text-sm text-gray-500">© 2024 Advancia MedBed Division</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
