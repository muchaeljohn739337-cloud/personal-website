'use client';

import { AlertTriangle, CheckCircle, Eye, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FlaggedContent {
  id: string;
  title: string;
  type: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  flaggedBy: string;
  flaggedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function ContentModerationPage() {
  const [flagged, setFlagged] = useState<FlaggedContent[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data
  const mockFlagged: FlaggedContent[] = [
    {
      id: '1',
      title: 'Blog Post Title',
      type: 'BLOG',
      reason: 'Inappropriate language',
      severity: 'MEDIUM',
      flaggedBy: 'user@example.com',
      flaggedAt: '2024-12-10',
      status: 'PENDING',
    },
  ];

  const handleModeration = async (id: string, action: 'approve' | 'reject') => {
    // TODO: Implement moderation action
    console.log(`Moderation ${action} for ${id}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Moderation</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Review and moderate flagged content
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockFlagged.filter((f) => f.status === 'PENDING').length}
              </p>
              <p className="text-sm text-slate-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockFlagged.filter((f) => f.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-slate-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockFlagged.filter((f) => f.status === 'REJECTED').length}
              </p>
              <p className="text-sm text-slate-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Content */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Content</CardTitle>
          <CardDescription>Review items that have been reported</CardDescription>
        </CardHeader>
        <CardContent>
          {mockFlagged.length > 0 ? (
            <div className="space-y-4">
              {mockFlagged.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : item.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Reason: {item.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Flagged by {item.flaggedBy} on {new Date(item.flaggedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {item.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleModeration(item.id, 'approve')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleModeration(item.id, 'reject')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">No flagged content</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

