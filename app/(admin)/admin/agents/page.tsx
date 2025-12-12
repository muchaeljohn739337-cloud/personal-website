'use client';

import {
  Bot,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  Settings,
  StopCircle,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  tasksCompleted: number;
  tasksFailed: number;
  lastRun: string | null;
  nextRun: string | null;
}

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/agents');
      // const data = await response.json();

      // Mock data
      setAgents([
        {
          id: '1',
          name: 'Code Agent',
          type: 'CODE',
          status: 'ACTIVE',
          tasksCompleted: 1247,
          tasksFailed: 12,
          lastRun: new Date().toISOString(),
          nextRun: new Date(Date.now() + 3600000).toISOString(),
        },
        {
          id: '2',
          name: 'Research Agent',
          type: 'RESEARCH',
          status: 'ACTIVE',
          tasksCompleted: 892,
          tasksFailed: 5,
          lastRun: new Date().toISOString(),
          nextRun: new Date(Date.now() + 1800000).toISOString(),
        },
        {
          id: '3',
          name: 'SEO Agent',
          type: 'SEO',
          status: 'PAUSED',
          tasksCompleted: 456,
          tasksFailed: 8,
          lastRun: new Date(Date.now() - 86400000).toISOString(),
          nextRun: null,
        },
      ]);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentAction = async (agentId: string, action: string) => {
    // TODO: Implement agent actions
    console.log(`Agent ${agentId} action: ${action}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Agents Control</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Monitor and manage all AI agents
          </p>
        </div>
        <Button onClick={fetchAgents} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-sm text-slate-500">Total Agents</p>
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
                {agents.filter((a) => a.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
              <XCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {agents.filter((a) => a.status === 'ERROR').length}
              </p>
              <p className="text-sm text-slate-500">Errors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-slate-500">{agent.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {agent.status === 'ACTIVE' && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      )}
                      {agent.status === 'PAUSED' && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-4 w-4" />
                          Paused
                        </span>
                      )}
                      {agent.status === 'ERROR' && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {agent.tasksCompleted} completed • {agent.tasksFailed} failed
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {agent.status === 'PAUSED' ? (
                      <Button size="sm" onClick={() => handleAgentAction(agent.id, 'start')}>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAgentAction(agent.id, 'pause')}
                      >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/admin/agent-checkpoints?agentId=${agent.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              {agent.lastRun && (
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                  <span>Last run: {new Date(agent.lastRun).toLocaleString()}</span>
                  {agent.nextRun && (
                    <span>Next run: {new Date(agent.nextRun).toLocaleString()}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
