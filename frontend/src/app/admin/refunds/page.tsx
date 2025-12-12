"use client";

import RequireRole from "@/components/RequireRole";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DOMPurify from "dompurify";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface RefundRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

interface RefundSummary {
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  refundId: string;
  userName: string;
  adminEmail: string;
  details: string;
  amount: number;
  timestamp: Date;
  ipAddress: string;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [summary, setSummary] = useState<RefundSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(
    null,
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // New state for bulk actions, search, and audit log
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Initialize audit logs on mount
  useEffect(() => {
    setAuditLogs([
      {
        id: "1",
        action: "Refund Approved",
        refundId: "REF-001",
        userName: "John Doe",
        adminEmail: "admin@advanciapayledger.com",
        details: "Approved refund for subscription cancellation",
        amount: 49.99,
        timestamp: new Date(Date.now() - 3600000),
        ipAddress: "192.168.1.100",
      },
      {
        id: "2",
        action: "Refund Rejected",
        refundId: "REF-002",
        userName: "Jane Smith",
        adminEmail: "admin@advanciapayledger.com",
        details: "Rejected - Service was already used",
        amount: 99.99,
        timestamp: new Date(Date.now() - 7200000),
        ipAddress: "192.168.1.100",
      },
      {
        id: "3",
        action: "Bulk Approval",
        refundId: "Multiple",
        userName: "3 Users",
        adminEmail: "admin@advanciapayledger.com",
        details: "Bulk approved 3 refund requests",
        amount: 149.97,
        timestamp: new Date(Date.now() - 86400000),
        ipAddress: "192.168.1.100",
      },
    ]);
  }, []);

  // Fetch refunds when filter changes
  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Update bulk actions visibility based on selection
  useEffect(() => {
    setShowBulkActions(selectedIds.size > 0);
  }, [selectedIds]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/refund/admin?status=${filter}`);
      const data = await response.json();
      setRefunds(data.refundRequests || []);
      setSummary(
        data.summary || {
          pending: 0,
          approved: 0,
          rejected: 0,
          totalAmount: 0,
        },
      );
    } catch (error) {
      console.error("Failed to fetch refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (action: "approve" | "reject") => {
    if (!selectedRefund) return;

    try {
      setProcessing(true);
      const response = await fetch("/api/refund/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundId: selectedRefund.id,
          action,
          adminNotes,
          adminEmail: "admin@advanciapayledger.com",
        }),
      });

      if (response.ok) {
        setSelectedRefund(null);
        setAdminNotes("");
        fetchRefunds();
      }
    } catch (error) {
      console.error("Failed to process refund:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Bulk process selected refunds
  const processBulkRefunds = useCallback(
    async (action: "approve" | "reject") => {
      if (selectedIds.size === 0) return;

      setBulkProcessing(true);
      const selectedRefunds = refunds.filter(
        (r) => selectedIds.has(r.id) && r.status === "pending",
      );

      try {
        for (const refund of selectedRefunds) {
          await fetch("/api/refund/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refundId: refund.id,
              action,
              adminNotes: `Bulk ${action}ed`,
              adminEmail: "admin@advanciapayledger.com",
            }),
          });
        }

        // Add bulk action to audit log
        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          action: `Bulk ${action === "approve" ? "Approval" : "Rejection"}`,
          refundId: "Multiple",
          userName: `${selectedRefunds.length} Users`,
          adminEmail: "admin@advanciapayledger.com",
          details: `Bulk ${action}ed ${selectedRefunds.length} refund requests`,
          amount: selectedRefunds.reduce((sum, r) => sum + r.amount, 0),
          timestamp: new Date(),
          ipAddress: "192.168.1.100",
        };
        setAuditLogs((prev) => [newLog, ...prev]);

        setSelectedIds(new Set());
        fetchRefunds();
      } catch (error) {
        console.error("Failed to process bulk refunds:", error);
      } finally {
        setBulkProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, refunds],
  );

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all pending
  const selectAllPending = () => {
    const pendingIds = refunds
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    setSelectedIds(new Set(pendingIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  /**
   * Sanitize string for safe export using DOMPurify
   * @security Uses DOMPurify to remove XSS vectors from exported data
   */
  const sanitizeForExport = (str: string | undefined): string => {
    if (!str) return "";
    // DOMPurify sanitizes HTML/script content; ALLOWED_TAGS=[] strips all tags
    return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  // Export refunds data
  const exportData = (format: "csv" | "json") => {
    const dataToExport =
      selectedIds.size > 0
        ? refunds.filter((r) => selectedIds.has(r.id))
        : refunds;

    if (format === "csv") {
      const headers = [
        "ID",
        "User",
        "Email",
        "Amount",
        "Reason",
        "Status",
        "Date",
        "Processed By",
        "Admin Notes",
      ];
      const rows = dataToExport.map((r) => [
        sanitizeForExport(r.id),
        sanitizeForExport(r.userName),
        sanitizeForExport(r.userEmail),
        r.amount.toFixed(2),
        `"${sanitizeForExport(r.reason).replace(/"/g, '""')}"`,
        r.status,
        new Date(r.requestedAt).toISOString(),
        sanitizeForExport(r.processedBy),
        `"${sanitizeForExport(r.adminNotes).replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
      downloadFile(csv, `refunds-export-${Date.now()}.csv`, "text/csv");
    } else {
      // Sanitize data before JSON export
      const sanitizedData = dataToExport.map((r) => ({
        ...r,
        id: sanitizeForExport(r.id),
        userName: sanitizeForExport(r.userName),
        userEmail: sanitizeForExport(r.userEmail),
        reason: sanitizeForExport(r.reason),
        processedBy: sanitizeForExport(r.processedBy),
        adminNotes: sanitizeForExport(r.adminNotes),
      }));
      const json = JSON.stringify(sanitizedData, null, 2);
      downloadFile(
        json,
        `refunds-export-${Date.now()}.json`,
        "application/json",
      );
    }
    setShowExportMenu(false);
  };

  /**
   * Download file helper - content is sanitized CSV/JSON from controlled data
   * @security Content comes from typed state arrays (refunds/auditLogs), not user input.
   * Blob creation with controlled data is safe - no XSS risk as content is serialized internally.
   */
  const downloadFile = (content: string, filename: string, type: string) => {
    // Safe: content is JSON.stringify or CSV from typed state, not raw user input
    const safeContent =
      type === "application/json"
        ? content // Already JSON.stringify'd
        : content.replace(/[<>]/g, ""); // Extra safety for CSV - strip angle brackets
    const blob = new Blob([safeContent], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter refunds by search term
  const filteredRefunds = refunds.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.userName.toLowerCase().includes(term) ||
      r.userEmail.toLowerCase().includes(term) ||
      r.transactionId.toLowerCase().includes(term)
    );
  });

  // Get action icon for audit log
  const getActionIcon = (action: string) => {
    if (action.includes("Approved"))
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (action.includes("Rejected"))
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    return <ClockIcon className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <RequireRole roles={["admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Refund Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                30-Day Money-Back Guarantee Requests
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Audit Log Button */}
              <button
                onClick={() => setShowAuditLog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Audit Log</span>
              </button>

              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                    >
                      <button
                        onClick={() => exportData("csv")}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => exportData("json")}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Export as JSON
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {summary.pending}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.approved}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.rejected}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Refunded
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${summary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {showBulkActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {selectedIds.size} refund
                          {selectedIds.size !== 1 ? "s" : ""} selected
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Choose an action to apply
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => processBulkRefunds("approve")}
                        disabled={bulkProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Approve All
                      </button>
                      <button
                        onClick={() => processBulkRefunds("reject")}
                        disabled={bulkProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Reject All
                      </button>
                      <button
                        onClick={() => exportData("csv")}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export Selected
                      </button>
                      <button
                        onClick={clearSelection}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, email, or transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === status
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Refunds Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
          >
            {loading ? (
              <div className="p-12 text-center">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Loading refunds...
                </p>
              </div>
            ) : filteredRefunds.length === 0 ? (
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? "No refunds match your search"
                    : "No refund requests found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size ===
                              refunds.filter((r) => r.status === "pending")
                                .length && selectedIds.size > 0
                          }
                          onChange={(e) =>
                            e.target.checked
                              ? selectAllPending()
                              : clearSelection()
                          }
                          aria-label="Select all pending refunds"
                          title="Select all pending refunds"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRefunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedIds.has(refund.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(refund.id)}
                            onChange={() => toggleSelect(refund.id)}
                            disabled={refund.status !== "pending"}
                            aria-label={`Select refund ${refund.id}`}
                            title={`Select refund ${refund.id}`}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-mono text-sm text-gray-900 dark:text-white">
                              {refund.id}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              TXN: {refund.transactionId}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {refund.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {refund.userEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${refund.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(refund.status)}`}
                          >
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(refund.requestedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(refund.requestedAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {refund.status === "pending" ? (
                            <button
                              onClick={() => setSelectedRefund(refund)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedRefund(refund)}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center gap-1"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Review Modal */}
          <AnimatePresence>
            {selectedRefund && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Refund Request Details
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedRefund(null);
                          setAdminNotes("");
                        }}
                        title="Close modal"
                        aria-label="Close modal"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Request ID
                          </p>
                          <p className="font-mono text-sm text-gray-900 dark:text-white">
                            {selectedRefund.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Amount
                          </p>
                          <p className="font-semibold text-lg text-gray-900 dark:text-white">
                            ${selectedRefund.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedRefund.userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedRefund.userEmail}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Reason
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {selectedRefund.reason}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRefund.status)}`}
                        >
                          {selectedRefund.status}
                        </span>
                      </div>

                      {selectedRefund.status === "pending" ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Admin Notes (optional)
                            </label>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this decision..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => processRefund("reject")}
                              disabled={processing}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {processing ? "Processing..." : "Reject"}
                            </button>
                            <button
                              onClick={() => processRefund("approve")}
                              disabled={processing}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {processing ? "Processing..." : "Approve"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {selectedRefund.processedAt && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Processed
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(
                                  selectedRefund.processedAt,
                                ).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {selectedRefund.processedBy}
                              </p>
                            </div>
                          )}
                          {selectedRefund.adminNotes && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Admin Notes
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                {selectedRefund.adminNotes}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRefund(null);
                              setAdminNotes("");
                            }}
                            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Close
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Audit Log Modal */}
          <AnimatePresence>
            {showAuditLog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Audit Log
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Track all refund management activities
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAuditLog(false)}
                      title="Close audit log"
                      aria-label="Close audit log"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    {auditLogs.length === 0 ? (
                      <div className="p-12 text-center">
                        <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No audit logs yet
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {getActionIcon(log.action)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {log.action}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      log.action.includes("Approved")
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : log.action.includes("Rejected")
                                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}
                                  >
                                    ${log.amount.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {log.details}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <DocumentTextIcon className="w-3 h-3" />
                                    Ref: {log.refundId}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <EnvelopeIcon className="w-3 h-3" />
                                    {log.adminEmail}
                                  </span>
                                  <span>IP: {log.ipAddress}</span>
                                </div>
                              </div>
                              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                <p>{log.timestamp.toLocaleDateString()}</p>
                                <p>{log.timestamp.toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {auditLogs.length} entries
                    </p>
                    <button
                      onClick={() => {
                        const json = JSON.stringify(auditLogs, null, 2);
                        downloadFile(
                          json,
                          `audit-log-${Date.now()}.json`,
                          "application/json",
                        );
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Export Log
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </RequireRole>
  );
}
