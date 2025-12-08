'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPrefs = JSON.parse(consent);
      setPreferences(savedPrefs);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    savePreferences(onlyNecessary);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowSettings(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);

    // Emit event for analytics initialization
    if (prefs.analytics) {
      // Initialize analytics here
      window.dispatchEvent(new CustomEvent('analytics-consent', { detail: prefs }));
    }
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 p-4 shadow-2xl">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">We value your privacy</h3>
                  <p className="text-sm text-slate-400">
                    We use cookies to enhance your browsing experience, serve personalized content,
                    and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our
                    use of cookies.{' '}
                    <a
                      href="/privacy"
                      className="text-violet-400 hover:text-violet-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Cookie className="h-6 w-6 text-violet-500" />
                  <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-slate-400 mb-6">
                Manage your cookie preferences. You can enable or disable different types of cookies
                below. Learn more in our{' '}
                <a href="/privacy" className="text-violet-400 hover:text-violet-300 underline">
                  Privacy Policy
                </a>
                .
              </p>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Necessary Cookies</h3>
                      <p className="text-sm text-slate-400">
                        Required for the website to function properly
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">
                      Always Active
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    These cookies are essential for you to browse the website and use its features.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Analytics Cookies</h3>
                      <p className="text-sm text-slate-400">
                        Help us understand how visitors interact with our site
                      </p>
                    </div>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      htmlFor="analytics-cookies"
                    >
                      <span className="sr-only">Enable analytics cookies</span>
                      <input
                        id="analytics-cookies"
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    These cookies allow us to count visits and traffic sources so we can measure and
                    improve the performance of our site.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Marketing Cookies</h3>
                      <p className="text-sm text-slate-400">Used to deliver personalized ads</p>
                    </div>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      htmlFor="marketing-cookies"
                    >
                      <span className="sr-only">Enable marketing cookies</span>
                      <input
                        id="marketing-cookies"
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    These cookies may be set through our site by advertising partners to build a
                    profile of your interests.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Functional Cookies</h3>
                      <p className="text-sm text-slate-400">
                        Enable enhanced functionality and personalization
                      </p>
                    </div>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      htmlFor="functional-cookies"
                    >
                      <span className="sr-only">Enable functional cookies</span>
                      <input
                        id="functional-cookies"
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) =>
                          setPreferences({ ...preferences, functional: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    These cookies allow the website to provide enhanced functionality and
                    personalization.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
