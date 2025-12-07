'use client';

import { useState } from 'react';
import {
  FiShield,
  FiMail,
  FiDatabase,
  FiGlobe,
  FiSave,
  FiAlertTriangle,
  FiCheck,
} from 'react-icons/fi';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  value: boolean | string | number;
  options?: { label: string; value: string }[];
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sections, setSections] = useState<SettingSection[]>([
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Configure security features and protections',
      icon: FiShield,
      settings: [
        {
          id: 'maintenance_mode',
          label: 'Maintenance Mode',
          description: 'Enable to show maintenance page to all users',
          type: 'toggle',
          value: false,
        },
        {
          id: 'security_shield',
          label: 'Security Shield',
          description: 'Enable advanced threat detection and blocking',
          type: 'toggle',
          value: true,
        },
        {
          id: 'rate_limiting',
          label: 'Rate Limiting',
          description: 'Limit API requests per IP address',
          type: 'toggle',
          value: true,
        },
        {
          id: 'max_login_attempts',
          label: 'Max Login Attempts',
          description: 'Number of failed attempts before lockout',
          type: 'number',
          value: 5,
        },
        {
          id: 'lockout_duration',
          label: 'Lockout Duration (minutes)',
          description: 'How long to lock out after failed attempts',
          type: 'number',
          value: 15,
        },
      ],
    },
    {
      id: 'email',
      title: 'Email Settings',
      description: 'Configure email notifications and templates',
      icon: FiMail,
      settings: [
        {
          id: 'email_notifications',
          label: 'Email Notifications',
          description: 'Send email notifications for important events',
          type: 'toggle',
          value: true,
        },
        {
          id: 'admin_email',
          label: 'Admin Email',
          description: 'Email address for admin notifications',
          type: 'text',
          value: 'admin@advanciapayledger.com',
        },
        {
          id: 'email_from',
          label: 'From Email',
          description: 'Email address used as sender',
          type: 'text',
          value: 'noreply@advanciapayledger.com',
        },
      ],
    },
    {
      id: 'site',
      title: 'Site Settings',
      description: 'General site configuration',
      icon: FiGlobe,
      settings: [
        {
          id: 'site_name',
          label: 'Site Name',
          description: 'Name displayed in browser title and emails',
          type: 'text',
          value: 'Advancia PayLedger',
        },
        {
          id: 'registration_enabled',
          label: 'User Registration',
          description: 'Allow new users to register',
          type: 'toggle',
          value: true,
        },
        {
          id: 'require_email_verification',
          label: 'Require Email Verification',
          description: 'Users must verify email before accessing dashboard',
          type: 'toggle',
          value: false,
        },
      ],
    },
    {
      id: 'database',
      title: 'Database & Storage',
      description: 'Database and file storage settings',
      icon: FiDatabase,
      settings: [
        {
          id: 'auto_backup',
          label: 'Automatic Backups',
          description: 'Enable automatic database backups',
          type: 'toggle',
          value: true,
        },
        {
          id: 'backup_frequency',
          label: 'Backup Frequency',
          description: 'How often to create backups',
          type: 'select',
          value: 'daily',
          options: [
            { label: 'Hourly', value: 'hourly' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
          ],
        },
      ],
    },
  ]);

  const updateSetting = (
    sectionId: string,
    settingId: string,
    value: boolean | string | number
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              settings: section.settings.map((setting) =>
                setting.id === settingId ? { ...setting, value } : setting
              ),
            }
          : section
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Collect all settings
      const allSettings: Record<string, boolean | string | number> = {};
      sections.forEach((section) => {
        section.settings.forEach((setting) => {
          allSettings[setting.id] = setting.value;
        });
      });

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allSettings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure system settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiSave className="h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : saved ? (
            <>
              <FiCheck className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <FiSave className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-400">
        <FiAlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          Changes to these settings may affect system behavior. Please review carefully before
          saving.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      {section.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {section.settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                      <label className="font-medium text-slate-900 dark:text-white">
                        {setting.label}
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {setting.type === 'toggle' && (
                        <button
                          onClick={() => updateSetting(section.id, setting.id, !setting.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            setting.value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              setting.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                      {setting.type === 'text' && (
                        <input
                          type="text"
                          value={setting.value as string}
                          onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
                          className="w-64 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      )}
                      {setting.type === 'number' && (
                        <input
                          type="number"
                          value={setting.value as number}
                          onChange={(e) =>
                            updateSetting(section.id, setting.id, parseInt(e.target.value))
                          }
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      )}
                      {setting.type === 'select' && (
                        <select
                          value={setting.value as string}
                          onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                          {setting.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
