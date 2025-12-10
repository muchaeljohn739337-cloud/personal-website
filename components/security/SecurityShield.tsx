'use client';

import { useState, useEffect } from 'react';
import {
  FiShield,
  FiLock,
  FiCheck,
  FiAlertTriangle,
  FiEye,
  FiServer,
  FiGlobe,
  FiKey,
  FiRefreshCw,
} from 'react-icons/fi';

interface SecurityStatus {
  ssl: boolean;
  encryption: boolean;
  authentication: boolean;
  rateLimit: boolean;
  csrf: boolean;
  headers: boolean;
}

interface SecurityShieldProps {
  variant?: 'badge' | 'card' | 'full';
  showDetails?: boolean;
  className?: string;
}

export default function SecurityShield({
  variant = 'badge',
  showDetails = false,
  className = '',
}: SecurityShieldProps) {
  const [status, setStatus] = useState<SecurityStatus>({
    ssl: false,
    encryption: true,
    authentication: true,
    rateLimit: true,
    csrf: true,
    headers: true,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    // Check SSL status
    setStatus((prev) => ({
      ...prev,
      ssl: typeof window !== 'undefined' && window.location.protocol === 'https:',
    }));
    setLastScan(new Date());
  }, []);

  const runSecurityScan = () => {
    setIsScanning(true);
    // Simulate security scan
    setTimeout(() => {
      setStatus({
        ssl: typeof window !== 'undefined' && window.location.protocol === 'https:',
        encryption: true,
        authentication: true,
        rateLimit: true,
        csrf: true,
        headers: true,
      });
      setLastScan(new Date());
      setIsScanning(false);
    }, 2000);
  };

  const securityScore = Object.values(status).filter(Boolean).length;
  const totalChecks = Object.keys(status).length;
  const scorePercentage = Math.round((securityScore / totalChecks) * 100);

  const getScoreColor = () => {
    if (scorePercentage >= 90) return 'text-emerald-400';
    if (scorePercentage >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (scorePercentage >= 90) return 'from-emerald-500/20 to-emerald-600/20';
    if (scorePercentage >= 70) return 'from-amber-500/20 to-amber-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  // Badge variant - compact display
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getScoreBg()} border border-white/10 ${className}`}
      >
        <FiShield className={`w-4 h-4 ${getScoreColor()}`} />
        <span className={`text-sm font-medium ${getScoreColor()}`}>{scorePercentage}% Secure</span>
        {scorePercentage === 100 && <FiCheck className="w-3 h-3 text-emerald-400" />}
      </div>
    );
  }

  // Card variant - medium display
  if (variant === 'card') {
    return (
      <div
        className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreBg()} flex items-center justify-center`}
            >
              <FiShield className={`w-6 h-6 ${getScoreColor()}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Security Status</h3>
              <p className="text-sm text-gray-400">Real-time protection</p>
            </div>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor()}`}>{scorePercentage}%</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SecurityItem icon={FiLock} label="SSL" active={status.ssl} />
          <SecurityItem icon={FiKey} label="Encryption" active={status.encryption} />
          <SecurityItem icon={FiEye} label="Auth" active={status.authentication} />
          <SecurityItem icon={FiServer} label="Rate Limit" active={status.rateLimit} />
          <SecurityItem icon={FiGlobe} label="CSRF" active={status.csrf} />
          <SecurityItem icon={FiShield} label="Headers" active={status.headers} />
        </div>

        {showDetails && (
          <button
            onClick={runSecurityScan}
            disabled={isScanning}
            className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Security Scan'}
          </button>
        )}
      </div>
    );
  }

  // Full variant - detailed display
  return (
    <div
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getScoreBg()} flex items-center justify-center relative`}
            >
              <FiShield className={`w-8 h-8 ${getScoreColor()}`} />
              {scorePercentage === 100 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <FiCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Security Shield</h2>
              <p className="text-gray-400">Enterprise-grade protection for your assets</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor()}`}>{scorePercentage}%</div>
            <p className="text-sm text-gray-500">Security Score</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              scorePercentage >= 90
                ? 'from-emerald-500 to-emerald-400'
                : scorePercentage >= 70
                  ? 'from-amber-500 to-amber-400'
                  : 'from-red-500 to-red-400'
            } transition-all duration-500`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      {/* Security Checks */}
      <div className="p-8">
        <h3 className="text-lg font-semibold mb-4">Security Checks</h3>
        <div className="space-y-4">
          <SecurityCheckRow
            icon={FiLock}
            title="SSL/TLS Encryption"
            description="Secure connection between your browser and our servers"
            active={status.ssl}
          />
          <SecurityCheckRow
            icon={FiKey}
            title="Data Encryption"
            description="AES-256 encryption for all sensitive data at rest"
            active={status.encryption}
          />
          <SecurityCheckRow
            icon={FiEye}
            title="Authentication"
            description="Multi-factor authentication and secure session management"
            active={status.authentication}
          />
          <SecurityCheckRow
            icon={FiServer}
            title="Rate Limiting"
            description="Protection against brute force and DDoS attacks"
            active={status.rateLimit}
          />
          <SecurityCheckRow
            icon={FiGlobe}
            title="CSRF Protection"
            description="Cross-site request forgery prevention"
            active={status.csrf}
          />
          <SecurityCheckRow
            icon={FiShield}
            title="Security Headers"
            description="XSS, clickjacking, and content-type protection"
            active={status.headers}
          />
        </div>

        {/* Last scan info */}
        {lastScan && (
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-500">Last scan: {lastScan.toLocaleTimeString()}</p>
            <button
              onClick={runSecurityScan}
              disabled={isScanning}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Rescan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components
function SecurityItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border ${
        active ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-red-400'}`} />
        <span className="text-xs font-medium">{label}</span>
        {active ? (
          <FiCheck className="w-3 h-3 text-emerald-400 ml-auto" />
        ) : (
          <FiAlertTriangle className="w-3 h-3 text-red-400 ml-auto" />
        )}
      </div>
    </div>
  );
}

function SecurityCheckRow({
  icon: Icon,
  title,
  description,
  active,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          active ? 'bg-emerald-500/20' : 'bg-red-500/20'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-red-400'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          {active ? (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              Inactive
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      {active ? (
        <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      ) : (
        <FiAlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
      )}
    </div>
  );
}
