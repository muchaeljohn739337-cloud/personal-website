'use client';

import { CheckCircle, Globe, Plus, Shield, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface WhitelistEntry {
  id: string;
  ipAddress: string;
  description: string;
  addedBy: string;
  addedAt: string;
  lastUsed: string | null;
}

export default function IPWhitelistPage() {
  const [_entries, _setEntries] = useState<WhitelistEntry[]>([]);
  void _entries;
  void _setEntries;
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data
  const mockEntries: WhitelistEntry[] = [
    {
      id: '1',
      ipAddress: '192.168.1.1',
      description: 'Office network',
      addedBy: 'admin@example.com',
      addedAt: '2024-12-01',
      lastUsed: '2024-12-10',
    },
    {
      id: '2',
      ipAddress: '10.0.0.1',
      description: 'VPN endpoint',
      addedBy: 'admin@example.com',
      addedAt: '2024-11-15',
      lastUsed: '2024-12-09',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">IP Whitelist</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage IP addresses allowed to access admin functions
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add IP
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockEntries.length}</p>
              <p className="text-sm text-slate-500">Whitelisted IPs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockEntries.filter((e) => e.lastUsed).length}</p>
              <p className="text-sm text-slate-500">Active IPs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">Enabled</p>
              <p className="text-sm text-slate-500">Whitelist Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add IP Address</CardTitle>
            <CardDescription>Whitelist a new IP address for admin access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="ip-address" className="text-sm font-medium">
                IP Address
              </label>
              <Input id="ip-address" placeholder="192.168.1.1" className="mt-1" />
            </div>
            <div>
              <label htmlFor="ip-description" className="text-sm font-medium">
                Description
              </label>
              <Input id="ip-description" placeholder="Office network, VPN, etc." className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button>Add IP</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Whitelist Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Whitelisted IPs</CardTitle>
          <CardDescription>IP addresses with admin access</CardDescription>
        </CardHeader>
        <CardContent>
          {mockEntries.length > 0 ? (
            <div className="space-y-4">
              {mockEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{entry.ipAddress}</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Added by {entry.addedBy} on {new Date(entry.addedAt).toLocaleDateString()}
                      {entry.lastUsed &&
                        ` • Last used: ${new Date(entry.lastUsed).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">No whitelisted IPs</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
