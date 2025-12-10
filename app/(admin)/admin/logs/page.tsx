'use client';

import { useState, useEffect } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
} from 'react-icons/fi';

interface AuditLog {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const severityColors = {
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WARNING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ERROR: 'bg-red-500/10 text-red-400 border-red-500/20',
  CRITICAL: 'bg-red-600/20 text-red-300 border-red-500/30',
};

const severityIcons = {
  INFO: FiCheckCircle,
  WARNING: FiAlertTriangle,
  ERROR: FiXCircle,
  CRITICAL: FiXCircle,
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm);

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesEventType = eventTypeFilter === 'all' || log.eventType === eventTypeFilter;

    return matchesSearch && matchesSeverity && matchesEventType;
  });

  const eventTypes = [...new Set(logs.map((log) => log.eventType))];

  const exportLogs = () => {
    const csv = [
      ['ID', 'Event Type', 'Severity', 'User', 'IP Address', 'Details', 'Created At'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.id,
          log.eventType,
          log.severity,
          log.userEmail || 'N/A',
          log.ipAddress || 'N/A',
          `"${log.details?.replace(/"/g, '""') || ''}"`,
          log.createdAt,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor system activity and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiDownload className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="all">All Event Types</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {(['INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map((severity) => {
          const count = logs.filter((l) => l.severity === severity).length;
          const Icon = severityIcons[severity];
          return (
            <div key={severity} className={`rounded-lg border p-4 ${severityColors[severity]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{severity}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <Icon className="h-8 w-8 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <FiActivity className="mx-auto h-8 w-8 animate-pulse" />
                    <p className="mt-2">Loading logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log) => {
                  const Icon = severityIcons[log.severity];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono text-sm text-slate-900 dark:text-white">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${severityColors[log.severity]}`}
                        >
                          <Icon className="h-3 w-3" />
                          {log.severity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {log.userEmail || 'System'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-500 dark:text-slate-400">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {log.details}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 100 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            Showing 100 of {filteredLogs.length} logs. Export to see all.
          </div>
        )}
      </div>
    </div>
  );
}
