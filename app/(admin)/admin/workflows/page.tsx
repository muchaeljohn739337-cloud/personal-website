'use client';

import { Bot, Calendar, CheckCircle2, Clock, Play, Settings, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  trigger: string;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
}

export default function WorkflowsAdminPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  void isLoading; // Used for loading state management

  useEffect(() => {
    // Fetch workflows from API
    fetch('/api/admin/workflows')
      .then((res) => res.json())
      .then((data) => {
        setWorkflows(data.workflows || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const activeWorkflows = workflows.filter((w) => w.status === 'active');
  const pausedWorkflows = workflows.filter((w) => w.status === 'paused');
  const errorWorkflows = workflows.filter((w) => w.status === 'error');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Workflow Automation Center
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage automated workflows, email rules, and scheduled tasks
          </p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Running automatically</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.runCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.length > 0
                ? Math.round(
                    (workflows.reduce((sum, w) => sum + w.successCount, 0) /
                      workflows.reduce((sum, w) => sum + w.runCount, 0)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Average success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.errorCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Workflows</CardTitle>
          <CardDescription>
            Manage email automation, agent tasks, and scheduled workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({workflows.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeWorkflows.length})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({pausedWorkflows.length})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({errorWorkflows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <WorkflowsTable workflows={workflows} />
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              <WorkflowsTable workflows={activeWorkflows} />
            </TabsContent>
            <TabsContent value="paused" className="mt-4">
              <WorkflowsTable workflows={pausedWorkflows} />
            </TabsContent>
            <TabsContent value="errors" className="mt-4">
              <WorkflowsTable workflows={errorWorkflows} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowsTable({ workflows }: { workflows: Workflow[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
      case 'paused':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-950';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500">
                No workflows found
              </TableCell>
            </TableRow>
          ) : (
            workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-sm text-slate-500">{workflow.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Bot className="h-4 w-4" />
                    {workflow.trigger}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(workflow.status)}`}
                  >
                    {workflow.status}
                  </span>
                </TableCell>
                <TableCell>
                  {workflow.lastRun ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {new Date(workflow.lastRun).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {workflow.nextRun ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(workflow.nextRun).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Runs: {workflow.runCount}</div>
                    <div className="text-emerald-600">✓ {workflow.successCount}</div>
                    <div className="text-red-600">✗ {workflow.errorCount}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
