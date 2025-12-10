'use client';

import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CheckpointReviewCard } from '@/components/admin/CheckpointReviewCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AgentLog {
  id: string;
  action: string;
  message: string;
  createdAt: string;
  metadata?: unknown;
}

interface Checkpoint {
  id: string;
  checkpointType: 'APPROVAL_REQUIRED' | 'INFO' | 'ERROR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  message: string;
  data?: unknown;
  metadata?: unknown;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  job: {
    id: string;
    jobType: string;
    status: string;
    taskDescription: string;
    userId?: string;
    createdAt: string;
  };
}

export default function AgentCheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logsCache, setLogsCache] = useState<Record<string, AgentLog[]>>({});

  const fetchCheckpoints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/agent-checkpoints');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch checkpoints');
      }
      const data = await response.json();
      setCheckpoints(data.checkpoints || []);

      // Fetch logs for each checkpoint's job
      const logsPromises = data.checkpoints.map(async (checkpoint: Checkpoint) => {
        try {
          const jobResponse = await fetch(`/api/agent-jobs/${checkpoint.job.id}`);
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            return {
              jobId: checkpoint.job.id,
              logs: jobData.job?.logs || [],
            };
          }
          return { jobId: checkpoint.job.id, logs: [] };
        } catch {
          return { jobId: checkpoint.job.id, logs: [] };
        }
      });

      const logsResults = await Promise.all(logsPromises);
      const newLogsCache: Record<string, AgentLog[]> = {};
      for (const result of logsResults) {
        newLogsCache[result.jobId] = result.logs;
      }
      setLogsCache(newLogsCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchCheckpoints, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (checkpointId: string) => {
    try {
      const response = await fetch(`/api/admin/agent-checkpoints/${checkpointId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve checkpoint');
      }

      // Refresh checkpoints
      await fetchCheckpoints();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve checkpoint');
    }
  };

  const handleReject = async (checkpointId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/agent-checkpoints/${checkpointId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject checkpoint');
      }

      // Refresh checkpoints
      await fetchCheckpoints();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject checkpoint');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-500">{error}</p>
        <Button variant="outline" onClick={fetchCheckpoints} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const pendingCheckpoints = checkpoints.filter((cp) => cp.status === 'PENDING');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agent Checkpoints</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Review and approve agent checkpoints before jobs continue
          </p>
        </div>
        <Button onClick={fetchCheckpoints} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {pendingCheckpoints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              No pending checkpoints. All caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Checkpoints ({pendingCheckpoints.length})</CardTitle>
              <CardDescription>
                These checkpoints require your approval before the agent can continue
              </CardDescription>
            </CardHeader>
          </Card>

          {pendingCheckpoints.map((checkpoint) => (
            <CheckpointReviewCard
              key={checkpoint.id}
              checkpoint={checkpoint}
              logs={logsCache[checkpoint.job.id] || []}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {checkpoints.length > pendingCheckpoints.length && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Recent Checkpoints ({checkpoints.length - pendingCheckpoints.length})
              </CardTitle>
              <CardDescription>Recently approved, rejected, or expired checkpoints</CardDescription>
            </CardHeader>
          </Card>

          {checkpoints
            .filter((cp) => cp.status !== 'PENDING')
            .slice(0, 10)
            .map((checkpoint) => (
              <CheckpointReviewCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                logs={logsCache[checkpoint.job.id] || []}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
        </div>
      )}
    </div>
  );
}
