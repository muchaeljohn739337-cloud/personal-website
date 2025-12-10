/**
 * Prometheus Metrics Exporter
 * Exports metrics for agent jobs and checkpoints in Prometheus format
 */

import { AIJobStatus, CheckpointStatus } from '@prisma/client';

import { prisma } from '../prismaClient';

export interface Metrics {
  agentJobsTotal: Record<string, number>; // by status
  agentJobsDuration: Array<{ status: string; duration: number }>;
  agentCheckpointsTotal: Record<string, number>; // by status
  agentCheckpointsPending: number;
  agentWorkerActiveJobs: number;
}

/**
 * Collect metrics from database
 */
export async function collectMetrics(): Promise<Metrics> {
  // Get job counts by status
  const jobCounts = await prisma.aIJob.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const agentJobsTotal: Record<string, number> = {};
  for (const count of jobCounts) {
    agentJobsTotal[count.status] = count._count.id;
  }

  // Get checkpoint counts by status
  const checkpointCounts = await prisma.agentCheckpoint.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const agentCheckpointsTotal: Record<string, number> = {};
  for (const count of checkpointCounts) {
    agentCheckpointsTotal[count.status] = count._count.id;
  }

  // Get pending checkpoints count
  const agentCheckpointsPending = await prisma.agentCheckpoint.count({
    where: {
      status: CheckpointStatus.PENDING,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  // Get job durations (for completed jobs)
  const completedJobs = await prisma.aIJob.findMany({
    where: {
      status: AIJobStatus.COMPLETED,
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      status: true,
      startedAt: true,
      completedAt: true,
    },
    take: 1000, // Limit to prevent huge queries
  });

  const agentJobsDuration = completedJobs
    .filter((job) => job.startedAt && job.completedAt)
    .map((job) => ({
      status: job.status,
      duration: (job.completedAt!.getTime() - job.startedAt!.getTime()) / 1000, // seconds
    }));

  // Active jobs (RUNNING status)
  const agentWorkerActiveJobs = await prisma.aIJob.count({
    where: {
      status: AIJobStatus.RUNNING,
    },
  });

  return {
    agentJobsTotal,
    agentJobsDuration,
    agentCheckpointsTotal,
    agentCheckpointsPending,
    agentWorkerActiveJobs,
  };
}

/**
 * Format metrics in Prometheus format
 */
export function formatPrometheusMetrics(metrics: Metrics): string {
  const lines: string[] = [];

  // Agent jobs total (counter)
  lines.push('# HELP agent_jobs_total Total number of agent jobs by status');
  lines.push('# TYPE agent_jobs_total counter');
  for (const [status, count] of Object.entries(metrics.agentJobsTotal)) {
    lines.push(`agent_jobs_total{status="${status}"} ${count}`);
  }

  // Agent jobs duration (histogram)
  if (metrics.agentJobsDuration.length > 0) {
    lines.push('# HELP agent_jobs_duration_seconds Duration of agent jobs in seconds');
    lines.push('# TYPE agent_jobs_duration_seconds histogram');

    // Group by status and calculate buckets
    const byStatus = metrics.agentJobsDuration.reduce(
      (acc, item) => {
        if (!acc[item.status]) {
          acc[item.status] = [];
        }
        acc[item.status].push(item.duration);
        return acc;
      },
      {} as Record<string, number[]>
    );

    for (const [status, durations] of Object.entries(byStatus)) {
      const sorted = durations.sort((a, b) => a - b);
      const buckets = [1, 5, 10, 30, 60, 300, 600]; // seconds

      for (const bucket of buckets) {
        const count = sorted.filter((d) => d <= bucket).length;
        lines.push(
          `agent_jobs_duration_seconds_bucket{status="${status}",le="${bucket}"} ${count}`
        );
      }

      const count = sorted.length;
      lines.push(`agent_jobs_duration_seconds_bucket{status="${status}",le="+Inf"} ${count}`);
      lines.push(`agent_jobs_duration_seconds_count{status="${status}"} ${count}`);

      const sum = sorted.reduce((a, b) => a + b, 0);
      lines.push(`agent_jobs_duration_seconds_sum{status="${status}"} ${sum}`);
    }
  }

  // Agent checkpoints total (counter)
  lines.push('# HELP agent_checkpoints_total Total number of agent checkpoints by status');
  lines.push('# TYPE agent_checkpoints_total counter');
  for (const [status, count] of Object.entries(metrics.agentCheckpointsTotal)) {
    lines.push(`agent_checkpoints_total{status="${status}"} ${count}`);
  }

  // Agent checkpoints pending (gauge)
  lines.push('# HELP agent_checkpoints_pending Number of pending agent checkpoints');
  lines.push('# TYPE agent_checkpoints_pending gauge');
  lines.push(`agent_checkpoints_pending ${metrics.agentCheckpointsPending}`);

  // Agent worker active jobs (gauge)
  lines.push('# HELP agent_worker_active_jobs Number of currently active agent jobs');
  lines.push('# TYPE agent_worker_active_jobs gauge');
  lines.push(`agent_worker_active_jobs ${metrics.agentWorkerActiveJobs}`);

  return lines.join('\n') + '\n';
}

/**
 * Get formatted Prometheus metrics
 */
export async function getPrometheusMetrics(): Promise<string> {
  const metrics = await collectMetrics();
  return formatPrometheusMetrics(metrics);
}
