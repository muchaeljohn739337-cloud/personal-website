'use client';

import { FiShield, FiAlertTriangle, FiMail, FiLock } from 'react-icons/fi';

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Shield Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50">
              <FiShield className="w-12 h-12 text-red-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <FiLock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Blocked</h1>

          <div className="flex items-center justify-center gap-2 text-red-400 mb-6">
            <FiAlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Security Protection Active</span>
          </div>

          <p className="text-gray-300 mb-6">
            Your access has been temporarily restricted due to suspicious activity detected from
            your connection. This is a security measure to protect our platform and users.
          </p>

          {/* Possible Reasons */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-white mb-3">Possible Reasons:</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Multiple failed login attempts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Suspicious request patterns detected
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Automated scanning or testing tools detected
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Requests from flagged IP addresses
              </li>
            </ul>
          </div>

          {/* What to do */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">What You Can Do:</h3>
            <p className="text-sm text-gray-300">
              If you believe this is an error, please contact our security team with your IP address
              and the time of this incident. We will review your case promptly.
            </p>
          </div>

          {/* Contact */}
          <a
            href="mailto:security@advanciapayledger.com"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            <FiMail className="w-5 h-5" />
            Contact Security Team
          </a>

          {/* Warning */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              <strong className="text-red-400">Warning:</strong> Unauthorized security testing,
              penetration testing, or any attempt to exploit vulnerabilities without written
              authorization is strictly prohibited and may result in legal action.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">Protected by Advancia Security Shield™</p>
        </div>
      </div>
    </div>
  );
}
