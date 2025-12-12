"use client";

import SMSVerification from "@/components/SMSVerification";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

export default function VerifySMSPage() {
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  const handleSuccess = (code: string) => {
    console.log("✅ SMS Verification successful! Code:", code);
    setVerifiedCode(code);
    // Here you would typically:
    // 1. Submit the code to your backend
    // 2. Verify it matches expected format
    // 3. Complete the user registration/login flow
  };

  const handleError = (error: string) => {
    console.error("❌ SMS Verification failed:", error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheckIcon className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              SMS Verification
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Secure phone verification powered by SMS Pool API
          </p>
        </div>

        {/* SMS Verification Component */}
        <SMSVerification
          onSuccess={handleSuccess}
          onError={handleError}
          countryId="US"
          serviceId="any"
        />

        {/* Success State */}
        {verifiedCode && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
              ✅ Verification Complete!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Code <span className="font-mono font-bold">{verifiedCode}</span>{" "}
              has been successfully received and can now be used for
              authentication.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📱 How It Works
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Click "Order Verification Number"</li>
              <li>2. A temporary phone number is assigned to you</li>
              <li>3. Wait for SMS to arrive (usually 5-30 seconds)</li>
              <li>4. Code is automatically extracted and displayed</li>
              <li>5. Use the code to complete verification</li>
            </ol>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🔐 Use Cases
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Two-factor authentication (2FA)</li>
              <li>• Account registration verification</li>
              <li>• Password reset confirmation</li>
              <li>• Secure transaction approval</li>
              <li>• Identity verification</li>
            </ul>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📋 Technical Details
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-semibold">API Base:</span>
              <br />
              api.smspool.net
            </div>
            <div>
              <span className="font-semibold">Default Country:</span>
              <br />
              United States (US)
            </div>
            <div>
              <span className="font-semibold">Timeout:</span>
              <br />
              120 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
