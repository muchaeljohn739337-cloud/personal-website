'use client';

import { FiCheckCircle, FiShield, FiLock, FiAward, FiGlobe } from 'react-icons/fi';

/**
 * Trust Badges Component
 * Displays verification and trust indicators to build user confidence
 */
export default function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-4 py-6 border-t border-b border-white/5">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors">
        <FiCheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400 font-medium">ScamAdviser Verified</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
        <FiShield className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-blue-400 font-medium">Bank of America Optimized</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
        <FiLock className="w-4 h-4 text-violet-400" />
        <span className="text-sm text-violet-400 font-medium">PCI-DSS Compliant</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
        <FiAward className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-400 font-medium">99.9% Uptime SLA</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
        <FiGlobe className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-400 font-medium">GDPR & CCPA Compliant</span>
      </div>
    </div>
  );
}
