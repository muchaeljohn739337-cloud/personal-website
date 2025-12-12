'use client';

import { CheckCircle2, Clock, XCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

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

interface CheckpointReviewCardProps {
  checkpoint: Checkpoint;
  logs?: AgentLog[];
  onApprove: (checkpointId: string) => Promise<void>;
  onReject: (checkpointId: string, reason: string) => Promise<void>;
}

export function CheckpointReviewCard({
  checkpoint,
  logs = [],
  onApprove,
  onReject,
}: CheckpointReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const getCheckpointIcon = () => {
    switch (checkpoint.checkpointType) {
      case 'APPROVAL_REQUIRED':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (checkpoint.status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-3 w-3" />
            Expired
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const handleApprove = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onApprove(checkpoint.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(checkpoint.id, rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getCheckpointIcon()}
            <div className="flex-1">
              <CardTitle className="text-lg">{checkpoint.job.jobType}</CardTitle>
              <CardDescription className="mt-1">
                Job ID: {checkpoint.job.id.substring(0, 8)}...
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Checkpoint Message
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{checkpoint.message}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Task</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {checkpoint.job.taskDescription}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Created: {formatDate(checkpoint.createdAt)}</span>
          {checkpoint.approvedAt && <span>Approved: {formatDate(checkpoint.approvedAt)}</span>}
        </div>

        {checkpoint.rejectionReason && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Rejection Reason</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {checkpoint.rejectionReason}
            </p>
          </div>
        )}

        {checkpoint.data ? (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
              type="button"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Hide' : 'Show'} Checkpoint Data
            </Button>
            {isExpanded && (
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">
                {JSON.stringify(checkpoint.data, null, 2)}
              </pre>
            )}
          </div>
        ) : null}

        {logs.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Job Logs ({logs.length})
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border-b border-slate-200 pb-2 last:border-0 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkpoint.status === 'PENDING' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
            {!showRejectForm ? (
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={isProcessing}
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Reject
              </Button>
            ) : (
              <div className="flex flex-1 flex-col gap-2">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="min-h-[80px] rounded-md border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    variant="outline"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
