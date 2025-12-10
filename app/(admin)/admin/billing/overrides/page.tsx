'use client';

import { Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface BillingOverride {
  id: string;
  userId: string;
  userEmail: string;
  type: 'DISCOUNT' | 'CREDIT' | 'WAIVE';
  amount: number;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function BillingOverridesPage() {
  const [overrides, setOverrides] = useState<BillingOverride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data - replace with actual API call
  const mockOverrides: BillingOverride[] = [
    {
      id: '1',
      userId: 'user1',
      userEmail: 'user@example.com',
      type: 'DISCOUNT',
      amount: 50,
      reason: 'Customer support issue',
      expiresAt: '2024-12-31',
      createdAt: '2024-12-01',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Billing Overrides</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage custom billing adjustments and discounts
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Override
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Billing Override</CardTitle>
            <CardDescription>Create a custom billing adjustment for a user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">User Email</label>
                <Input placeholder="user@example.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="mt-1 flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm">
                  <option>DISCOUNT</option>
                  <option>CREDIT</option>
                  <option>WAIVE</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount ($)</label>
                <Input type="number" placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Expires At (optional)</label>
                <Input type="date" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                className="mt-1 flex min-h-[80px] w-full rounded-lg border bg-white px-4 py-2 text-sm"
                placeholder="Reason for this override..."
              />
            </div>
            <div className="flex gap-2">
              <Button>Create Override</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Overrides</CardTitle>
          <CardDescription>Current billing adjustments in effect</CardDescription>
        </CardHeader>
        <CardContent>
          {mockOverrides.length > 0 ? (
            <div className="space-y-4">
              {mockOverrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{override.userEmail}</p>
                    <p className="text-sm text-slate-500">{override.reason}</p>
                    <p className="text-xs text-slate-400">
                      Created: {new Date(override.createdAt).toLocaleDateString()}
                      {override.expiresAt &&
                        ` • Expires: ${new Date(override.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {override.type === 'DISCOUNT' && '-'}
                        ${override.amount}
                      </p>
                      <p className="text-xs text-slate-500">{override.type}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">No active overrides</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

