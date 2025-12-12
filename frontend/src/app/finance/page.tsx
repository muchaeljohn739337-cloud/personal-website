"use client";

import {
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ShareIcon,
  SparklesIcon,
  WalletIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const glowVariants = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(16, 185, 129, 0.2)",
      "0 0 40px rgba(16, 185, 129, 0.4)",
      "0 0 20px rgba(16, 185, 129, 0.2)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

// Social Media Icons including Discord
const socialIcons = {
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  discord: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
};

interface CashFlowEntry {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  pendingTransactions: number;
  monthlyGrowth: number;
  projectedRevenue: number;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "cashflow" | "reports"
  >("overview");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const [summary, setSummary] = useState<FinanceSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    pendingTransactions: 0,
    monthlyGrowth: 0,
    projectedRevenue: 0,
  });

  const [cashFlowData, setCashFlowData] = useState<CashFlowEntry[]>([]);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    fetchFinanceData();
  }, [dateRange]);

  const fetchFinanceData = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setSummary({
      totalIncome: 125840.5,
      totalExpenses: 45320.25,
      netCashFlow: 80520.25,
      pendingTransactions: 12,
      monthlyGrowth: 18.5,
      projectedRevenue: 156000,
    });

    setCashFlowData([
      {
        id: "1",
        type: "income",
        category: "Sales",
        amount: 15000,
        description: "Product sales Q4",
        date: "2024-12-01",
        status: "completed",
      },
      {
        id: "2",
        type: "expense",
        category: "Operations",
        amount: 3500,
        description: "Server infrastructure",
        date: "2024-12-01",
        status: "completed",
      },
      {
        id: "3",
        type: "income",
        category: "Subscriptions",
        amount: 8500,
        description: "Monthly subscriptions",
        date: "2024-11-30",
        status: "completed",
      },
      {
        id: "4",
        type: "expense",
        category: "Marketing",
        amount: 2800,
        description: "Ad campaigns",
        date: "2024-11-29",
        status: "pending",
      },
      {
        id: "5",
        type: "income",
        category: "Consulting",
        amount: 12000,
        description: "Enterprise consulting",
        date: "2024-11-28",
        status: "completed",
      },
      {
        id: "6",
        type: "expense",
        category: "Payroll",
        amount: 25000,
        description: "Team salaries",
        date: "2024-11-25",
        status: "completed",
      },
      {
        id: "7",
        type: "income",
        category: "Investments",
        amount: 5000,
        description: "Dividend income",
        date: "2024-11-24",
        status: "completed",
      },
      {
        id: "8",
        type: "expense",
        category: "Software",
        amount: 1200,
        description: "SaaS subscriptions",
        date: "2024-11-23",
        status: "failed",
      },
    ]);

    setLoading(false);
  };

  const sendFinanceReport = async () => {
    if (!recipientEmail) return;
    setEmailSending(true);

    try {
      const response = await fetch("/api/email/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          reportType: "finance",
          data: { summary, cashFlowData },
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailSent(false);
          setRecipientEmail("");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to send report:", error);
    } finally {
      setEmailSending(false);
    }
  };

  const shareToSocial = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(
      `Check out my finance dashboard at Advancia! Net Cash Flow: $${summary.netCashFlow.toLocaleString()}`,
    );

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      discord: `https://discord.com/channels/@me`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
      whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
    setShareModalOpen(false);
  };

  // Chart Data
  const cashFlowChartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Income",
        data: [
          45000, 52000, 48000, 61000, 55000, 67000, 72000, 68000, 85000, 92000,
          105000, 125840,
        ],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: [
          32000, 28000, 35000, 31000, 29000, 38000, 35000, 42000, 38000, 41000,
          43000, 45320,
        ],
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const expenseBreakdownData = {
    labels: ["Payroll", "Operations", "Marketing", "Software", "Other"],
    datasets: [
      {
        data: [55, 18, 12, 8, 7],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(107, 114, 128, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const monthlyComparisonData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "This Month",
        data: [28000, 35000, 42000, 48000],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 8,
      },
      {
        label: "Last Month",
        data: [22000, 28000, 35000, 38000],
        backgroundColor: "rgba(107, 114, 128, 0.4)",
        borderRadius: 8,
      },
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading financial data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          style={{ animationDelay: "0.5s" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center"
            >
              <BanknotesIcon className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-white font-semibold text-xl">
              Finance & Cash Flow
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <EnvelopeIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Email Report</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg"
            >
              <ShareIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Share</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-6 py-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 mb-8"
          >
            {(["overview", "cashflow", "reports"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              title="Select date range"
              aria-label="Select date range"
              className="ml-auto px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7d" className="bg-gray-800">
                Last 7 Days
              </option>
              <option value="30d" className="bg-gray-800">
                Last 30 Days
              </option>
              <option value="90d" className="bg-gray-800">
                Last 90 Days
              </option>
              <option value="1y" className="bg-gray-800">
                This Year
              </option>
            </select>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Income */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6"
            >
              <motion.div
                variants={glowVariants}
                animate="animate"
                className="absolute inset-0 rounded-2xl"
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                    <ArrowUpRightIcon className="w-4 h-4" />+
                    {summary.monthlyGrowth}%
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Income</p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-bold text-white"
                >
                  ${summary.totalIncome.toLocaleString()}
                </motion.p>
              </div>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <ArrowTrendingDownIcon className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-medium flex items-center gap-1">
                  <ArrowDownRightIcon className="w-4 h-4" />
                  -5.2%
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-white">
                ${summary.totalExpenses.toLocaleString()}
              </p>
            </motion.div>

            {/* Net Cash Flow */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
            >
              <motion.div variants={floatVariants} animate="animate">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <WalletIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <SparklesIcon className="w-5 h-5 text-blue-400" />
                </div>
              </motion.div>
              <p className="text-gray-400 text-sm mb-1">Net Cash Flow</p>
              <p className="text-3xl font-bold text-white">
                ${summary.netCashFlow.toLocaleString()}
              </p>
            </motion.div>

            {/* Projected Revenue */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <ChartBarIcon className="w-6 h-6 text-purple-400" />
                </div>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  AI Forecast
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Projected Revenue</p>
              <p className="text-3xl font-bold text-white">
                ${summary.projectedRevenue.toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Cash Flow Chart */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Cash Flow Trend
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-gray-400 text-sm">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-gray-400 text-sm">Expenses</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <Line
                  data={cashFlowChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        grid: { color: "rgba(255,255,255,0.1)" },
                        ticks: { color: "#9ca3af" },
                      },
                      y: {
                        grid: { color: "rgba(255,255,255,0.1)" },
                        ticks: { color: "#9ca3af" },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            {/* Expense Breakdown */}
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Expense Breakdown
              </h3>
              <div className="h-64">
                <Doughnut
                  data={expenseBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#9ca3af", padding: 15 },
                      },
                    },
                    cutout: "65%",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Monthly Comparison & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Monthly Comparison
              </h3>
              <div className="h-64">
                <Bar
                  data={monthlyComparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        labels: { color: "#9ca3af" },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: "#9ca3af" },
                      },
                      y: {
                        grid: { color: "rgba(255,255,255,0.1)" },
                        ticks: { color: "#9ca3af" },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Recent Cash Flow
                </h3>
                <Link
                  href="/transactions"
                  className="text-emerald-400 text-sm hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {cashFlowData.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${entry.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"}`}
                        >
                          {entry.type === "income" ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {entry.description}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {entry.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${entry.type === "income" ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {entry.type === "income" ? "+" : "-"}$
                          {entry.amount.toLocaleString()}
                        </span>
                        {getStatusIcon(entry.status)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              {
                icon: CreditCardIcon,
                label: "Add Income",
                color: "emerald",
                href: "/transactions/new?type=income",
              },
              {
                icon: BanknotesIcon,
                label: "Record Expense",
                color: "red",
                href: "/transactions/new?type=expense",
              },
              {
                icon: BuildingLibraryIcon,
                label: "Bank Transfer",
                color: "blue",
                href: "/transfers",
              },
              {
                icon: PaperAirplaneIcon,
                label: "Send Invoice",
                color: "purple",
                href: "/invoices/new",
              },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all cursor-pointer"
                >
                  <action.icon className={`w-8 h-8 text-${action.color}-400`} />
                  <span className="text-white text-sm font-medium">
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </motion.main>

      {/* Email Modal */}
      <AnimatePresence>
        {emailModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !emailSending && setEmailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <EnvelopeIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Email Finance Report
                  </h3>
                  <p className="text-gray-400 text-sm">Send via Resend</p>
                </div>
              </div>

              {emailSent ? (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <p className="text-white font-medium">
                    Report Sent Successfully!
                  </p>
                </motion.div>
              ) : (
                <>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@email.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEmailModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-white/10 text-gray-400 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={sendFinanceReport}
                      disabled={emailSending || !recipientEmail}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {emailSending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <PaperAirplaneIcon className="w-5 h-5" />
                          Send Report
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal with Discord */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShareModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <ShareIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Share Dashboard
                  </h3>
                  <p className="text-gray-400 text-sm">Share on social media</p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                {Object.entries(socialIcons).map(([platform, icon]) => (
                  <motion.button
                    key={platform}
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => shareToSocial(platform)}
                    className={`p-4 rounded-xl transition-all flex items-center justify-center ${
                      platform === "twitter"
                        ? "bg-black hover:bg-gray-900 text-white"
                        : platform === "facebook"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : platform === "linkedin"
                            ? "bg-blue-700 hover:bg-blue-800 text-white"
                            : platform === "discord"
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                              : platform === "telegram"
                                ? "bg-sky-500 hover:bg-sky-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setShareModalOpen(false)}
                className="w-full mt-4 px-4 py-3 bg-white/10 text-gray-400 rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
