'use client';

import {
  Copy,
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  Plus,
  Search,
  Shield,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordEntry {
  id: string;
  siteName: string;
  siteUrl: string;
  username: string;
  password: string;
  notes: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Simple encryption for password field (client-side)
const encryptPassword = (text: string, key: string): string => {
  return btoa(
    text
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('')
  );
};

const decryptPassword = (encoded: string, key: string): string => {
  try {
    const decoded = atob(encoded);
    return decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  } catch {
    return encoded; // Return as-is if decryption fails
  }
};

const generatePassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + symbols;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const categories = [
  { value: 'social', label: 'Social Media', icon: 'Users' },
  { value: 'finance', label: 'Finance & Banking', icon: 'DollarSign' },
  { value: 'work', label: 'Work & Business', icon: 'Briefcase' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingCart' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Film' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'cloud', label: 'Cloud Services', icon: 'Cloud' },
  { value: 'other', label: 'Other', icon: 'Folder' },
];

export default function PasswordManagerPage() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [masterKey, setMasterKey] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showMasterKeySetup, setShowMasterKeySetup] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
    username: '',
    password: '',
    notes: '',
    category: 'other',
  });

  // Load passwords from API
  const fetchPasswords = async () => {
    try {
      const res = await fetch('/api/passwords');
      const data = await res.json();
      if (data.passwords) {
        // Decrypt passwords with master key
        const decrypted = data.passwords.map((p: PasswordEntry) => ({
          ...p,
          password: masterKey ? decryptPassword(p.password, masterKey) : p.password,
        }));
        setPasswords(decrypted);
      }
    } catch (error) {
      console.error('Failed to fetch passwords:', error);
    }
  };

  useEffect(() => {
    if (isUnlocked && masterKey) {
      fetchPasswords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, masterKey]);

  // Check if master key exists in localStorage
  useEffect(() => {
    const hasKey = localStorage.getItem('apl_vault_key_check');
    if (!hasKey) {
      setShowMasterKeySetup(true);
    }
  }, []);

  const setupMasterKey = (key: string) => {
    if (key.length < 8) {
      alert('Master key must be at least 8 characters');
      return;
    }
    // Store a check value to verify the key later
    localStorage.setItem('apl_vault_key_check', encryptPassword('vault_ok', key));
    setMasterKey(key);
    setIsUnlocked(true);
    setShowMasterKeySetup(false);
  };

  const unlockVault = (key: string) => {
    const check = localStorage.getItem('apl_vault_key_check');
    if (check) {
      const decrypted = decryptPassword(check, key);
      if (decrypted === 'vault_ok') {
        setMasterKey(key);
        setIsUnlocked(true);
        return true;
      }
    }
    alert('Invalid master key');
    return false;
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPassword = async () => {
    if (!formData.siteName || !formData.password) {
      alert('Site name and password are required');
      return;
    }

    try {
      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          password: encryptPassword(formData.password, masterKey),
        }),
      });

      if (res.ok) {
        await fetchPasswords();
        setFormData({
          siteName: '',
          siteUrl: '',
          username: '',
          password: '',
          notes: '',
          category: 'other',
        });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add password:', error);
      alert('Failed to save password');
    }
  };

  const handleUpdatePassword = async (id: string) => {
    try {
      const res = await fetch('/api/passwords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...formData,
          password: encryptPassword(formData.password, masterKey),
        }),
      });

      if (res.ok) {
        await fetchPasswords();
        setEditingId(null);
        setFormData({
          siteName: '',
          siteUrl: '',
          username: '',
          password: '',
          notes: '',
          category: 'other',
        });
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      alert('Failed to update password');
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      try {
        const res = await fetch(`/api/passwords?id=${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          await fetchPasswords();
        }
      } catch (error) {
        console.error('Failed to delete password:', error);
        alert('Failed to delete password');
      }
    }
  };

  const startEditing = (entry: PasswordEntry) => {
    setEditingId(entry.id);
    setFormData({
      siteName: entry.siteName,
      siteUrl: entry.siteUrl,
      username: entry.username,
      password: entry.password,
      notes: entry.notes,
      category: entry.category,
    });
  };

  const filteredPasswords = passwords.filter((p) => {
    const matchesSearch =
      p.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siteUrl.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Master Key Setup Screen
  if (showMasterKeySetup) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Setup Password Vault</CardTitle>
            <CardDescription>
              Create a master key to encrypt your passwords. This key will be required to access
              your vault.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const key = (form.elements.namedItem('masterKey') as HTMLInputElement).value;
                const confirm = (form.elements.namedItem('confirmKey') as HTMLInputElement).value;
                if (key !== confirm) {
                  alert('Keys do not match');
                  return;
                }
                setupMasterKey(key);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="masterKey">Master Key</Label>
                <Input
                  id="masterKey"
                  name="masterKey"
                  type="password"
                  placeholder="Enter master key (min 8 characters)"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmKey">Confirm Master Key</Label>
                <Input
                  id="confirmKey"
                  name="confirmKey"
                  type="password"
                  placeholder="Confirm master key"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Create Vault
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unlock Screen
  if (!isUnlocked) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Unlock Password Vault</CardTitle>
            <CardDescription>Enter your master key to access your passwords</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const key = (form.elements.namedItem('unlockKey') as HTMLInputElement).value;
                unlockVault(key);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="unlockKey">Master Key</Label>
                <Input
                  id="unlockKey"
                  name="unlockKey"
                  type="password"
                  placeholder="Enter your master key"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Unlock Vault
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Password Manager</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Securely store and manage your passwords • {passwords.length} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsUnlocked(false);
              setMasterKey('');
            }}
          >
            <Lock className="mr-2 h-4 w-4" />
            Lock Vault
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Password
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Password List */}
      <div className="grid gap-4">
        {filteredPasswords.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
              No passwords saved
            </h3>
            <p className="mt-2 text-slate-500">Click &quot;Add Password&quot; to get started</p>
          </Card>
        ) : (
          filteredPasswords.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-2xl">
                  {categories.find((c) => c.value === entry.category)?.icon || '📁'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {entry.siteName}
                    </h3>
                    {entry.siteUrl && (
                      <a
                        href={entry.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-500"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{entry.username}</p>
                </div>

                {/* Password Field */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">
                    <span className="max-w-[120px] truncate">
                      {visiblePasswords.has(entry.id) ? entry.password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="ml-1 text-slate-400 hover:text-slate-600"
                    >
                      {visiblePasswords.has(entry.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(entry.password, entry.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    {copiedId === entry.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEditing(entry)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePassword(entry.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              {entry.notes && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                  {entry.notes}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Password' : 'Add New Password'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update your saved password' : 'Save a new password to your vault'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  placeholder="e.g., Google, Facebook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteUrl">Website URL</Label>
                <Input
                  id="siteUrl"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, password: generatePassword() })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    setFormData({
                      siteName: '',
                      siteUrl: '',
                      username: '',
                      password: '',
                      notes: '',
                      category: 'other',
                    });
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    editingId ? handleUpdatePassword(editingId) : handleAddPassword()
                  }
                >
                  <Check className="mr-2 h-4 w-4" />
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
