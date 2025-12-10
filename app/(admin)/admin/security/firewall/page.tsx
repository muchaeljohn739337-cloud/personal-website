'use client';

import { Ban, Globe, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FirewallRule {
  id: string;
  type: 'IP' | 'COUNTRY' | 'USER_AGENT';
  value: string;
  action: 'BLOCK' | 'ALLOW';
  reason: string;
  createdAt: string;
  hits: number;
}

export default function FirewallManagementPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data
  const mockRules: FirewallRule[] = [
    {
      id: '1',
      type: 'IP',
      value: '192.168.1.100',
      action: 'BLOCK',
      reason: 'Suspicious activity',
      createdAt: '2024-12-01',
      hits: 47,
    },
    {
      id: '2',
      type: 'COUNTRY',
      value: 'CN',
      action: 'BLOCK',
      reason: 'High spam rate',
      createdAt: '2024-11-15',
      hits: 1234,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Firewall Management</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage IP blocks, country restrictions, and firewall rules
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Shield className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockRules.length}</p>
              <p className="text-sm text-slate-500">Active Rules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockRules.reduce((sum, r) => sum + r.hits, 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Total Blocks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockRules.filter((r) => r.type === 'COUNTRY').length}
              </p>
              <p className="text-sm text-slate-500">Country Rules</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Firewall Rule</CardTitle>
            <CardDescription>Create a new blocking or allowing rule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="mt-1 flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm">
                  <option>IP</option>
                  <option>COUNTRY</option>
                  <option>USER_AGENT</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Action</label>
                <select className="mt-1 flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm">
                  <option>BLOCK</option>
                  <option>ALLOW</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input placeholder="IP, country code, or user agent" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input placeholder="Reason for this rule" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Create Rule</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Firewall Rules</CardTitle>
          <CardDescription>Active blocking and allowing rules</CardDescription>
        </CardHeader>
        <CardContent>
          {mockRules.length > 0 ? (
            <div className="space-y-4">
              {mockRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.type}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-sm">{rule.value}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          rule.action === 'BLOCK'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{rule.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {rule.hits} hits • Created {new Date(rule.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Ban className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">No firewall rules</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

