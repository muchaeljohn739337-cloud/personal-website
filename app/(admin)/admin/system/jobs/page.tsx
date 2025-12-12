'use client';

import { CheckCircle, Clock, Play, RefreshCw, StopCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BackgroundJob {
  id: string;
  name: string;
  type: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export default function BackgroundJobsPage() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/system/jobs');
      // const data = await response.json();

      // Mock data
      setJobs([
        {
          id: '1',
          name: 'Email Queue Processor',
          type: 'EMAIL',
          status: 'RUNNING',
          progress: 65,
          startedAt: new Date(Date.now() - 300000).toISOString(),
          completedAt: null,
          error: null,
        },
        {
          id: '2',
          name: 'Database Backup',
          type: 'BACKUP',
          status: 'COMPLETED',
          progress: 100,
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3300000).toISOString(),
          error: null,
        },
        {
          id: '3',
          name: 'Analytics Aggregation',
          type: 'ANALYTICS',
          status: 'FAILED',
          progress: 45,
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          completedAt: null,
          error: 'Connection timeout',
        },
        {
          id: '4',
          name: 'Cleanup Task',
          type: 'CLEANUP',
          status: 'QUEUED',
          progress: 0,
          startedAt: null,
          completedAt: null,
          error: null,
        },
      ]);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    // TODO: Implement job actions
    console.log(`Job ${jobId} action: ${action}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === 'RUNNING').length,
    queued: jobs.filter((j) => j.status === 'QUEUED').length,
    failed: jobs.filter((j) => j.status === 'FAILED').length,
    completed: jobs.filter((j) => j.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Background Jobs</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Monitor and manage background job processing
          </p>
        </div>
        <Button onClick={fetchJobs} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              <p className="text-sm text-slate-500">Running</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.queued}</p>
              <p className="text-sm text-slate-500">Queued</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-slate-500">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{job.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                      {job.type}
                    </span>
                    {job.status === 'RUNNING' && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4 animate-spin" />
                        Running
                      </span>
                    )}
                    {job.status === 'COMPLETED' && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </span>
                    )}
                    {job.status === 'FAILED' && (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Failed
                      </span>
                    )}
                    {job.status === 'QUEUED' && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" />
                        Queued
                      </span>
                    )}
                  </div>
                  {job.status === 'RUNNING' && (
                    <div className="mt-2">
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{job.progress}% complete</p>
                    </div>
                  )}
                  {job.error && <p className="mt-2 text-sm text-red-600">Error: {job.error}</p>}
                  {job.startedAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Started: {new Date(job.startedAt).toLocaleString()}
                      {job.completedAt &&
                        ` • Completed: ${new Date(job.completedAt).toLocaleString()}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {job.status === 'QUEUED' && (
                    <Button size="sm" onClick={() => handleJobAction(job.id, 'start')}>
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  )}
                  {job.status === 'RUNNING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'stop')}
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  )}
                  {job.status === 'FAILED' && (
                    <Button size="sm" onClick={() => handleJobAction(job.id, 'retry')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
