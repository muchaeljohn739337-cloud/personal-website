'use client';

import {
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Code,
  FileSearch,
  Loader2,
  MessageSquare,
  Play,
  Search,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Agent definitions with icons
const agents = [
  {
    type: 'ORCHESTRATOR',
    name: 'Orchestrator',
    description: 'Central coordinator that manages task execution',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    status: 'active',
  },
  {
    type: 'CODE',
    name: 'Code Agent',
    description: 'Expert software developer for coding tasks',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    status: 'active',
  },
  {
    type: 'RESEARCH',
    name: 'Research Agent',
    description: 'Expert researcher for information gathering',
    icon: Search,
    color: 'from-green-500 to-emerald-500',
    status: 'active',
  },
  {
    type: 'SEO',
    name: 'SEO Agent',
    description: 'Expert in search engine optimization',
    icon: TrendingUp,
    color: 'from-orange-500 to-yellow-500',
    status: 'active',
  },
  {
    type: 'BLOG',
    name: 'Blog Writer',
    description: 'Expert content writer for blogs',
    icon: FileSearch,
    color: 'from-pink-500 to-rose-500',
    status: 'active',
  },
  {
    type: 'BUSINESS',
    name: 'Business Agent',
    description: 'Expert in business strategy and analysis',
    icon: Target,
    color: 'from-violet-500 to-purple-500',
    status: 'active',
  },
  {
    type: 'SECURITY',
    name: 'Security Agent',
    description: 'Expert in cybersecurity and auditing',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    status: 'active',
  },
];

// Sample task history
const taskHistory = [
  {
    id: 'task_001',
    task: 'Write a blog post about AI in healthcare',
    status: 'completed',
    agent: 'BLOG',
    duration: '2m 34s',
    tokens: 1250,
    createdAt: '2 hours ago',
  },
  {
    id: 'task_002',
    task: 'Research competitor pricing strategies',
    status: 'completed',
    agent: 'RESEARCH',
    duration: '1m 45s',
    tokens: 890,
    createdAt: '3 hours ago',
  },
  {
    id: 'task_003',
    task: 'Generate SEO keywords for landing page',
    status: 'completed',
    agent: 'SEO',
    duration: '45s',
    tokens: 420,
    createdAt: '5 hours ago',
  },
];

export default function AgentsPage() {
  const [taskInput, setTaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<{
    id: string;
    status: string;
    result?: string;
  } | null>(null);

  const handleSubmitTask = async () => {
    if (!taskInput.trim()) return;

    setIsSubmitting(true);
    setCurrentTask({ id: '', status: 'submitting' });

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentTask({ id: data.taskId, status: 'running' });

        // Poll for status
        const pollStatus = async () => {
          const statusRes = await fetch(`/api/agents?action=status&taskId=${data.taskId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'COMPLETED') {
            setCurrentTask({
              id: data.taskId,
              status: 'completed',
              result: statusData.result,
            });
          } else if (statusData.status === 'FAILED') {
            setCurrentTask({
              id: data.taskId,
              status: 'failed',
              result: statusData.error,
            });
          } else {
            // Continue polling
            setTimeout(pollStatus, 2000);
          }
        };

        setTimeout(pollStatus, 2000);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setCurrentTask({ id: '', status: 'failed', result: 'Failed to submit task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Bot className="h-8 w-8 text-purple-500" />
            AI Agents
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Multi-agent system for automated task execution
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-green-500">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
          <span className="font-medium">7 agents online</span>
        </div>
      </div>

      {/* Task Input */}
      <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Submit a Task
          </CardTitle>
          <CardDescription>
            Describe what you want the AI agents to do. The orchestrator will automatically delegate
            to the right agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="e.g., Write a blog post about AI trends in 2025..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitTask()}
              className="flex-1"
            />
            <Button
              onClick={handleSubmitTask}
              disabled={isSubmitting || !taskInput.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Submit</span>
            </Button>
          </div>

          {/* Current Task Status */}
          {currentTask && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                {currentTask.status === 'running' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Processing...</span>
                  </>
                )}
                {currentTask.status === 'completed' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Completed</span>
                  </>
                )}
                {currentTask.status === 'failed' && (
                  <>
                    <span className="text-sm font-medium text-red-500">Failed</span>
                  </>
                )}
              </div>
              {currentTask.result && (
                <div className="mt-3 max-h-64 overflow-auto rounded bg-white p-3 text-sm dark:bg-slate-900">
                  <pre className="whitespace-pre-wrap">{currentTask.result}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
          Available Agents
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <Card key={agent.type} className="group overflow-hidden transition-all hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${agent.color} transition-transform group-hover:scale-110`}
                  >
                    <agent.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                      <span className="flex h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Task History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            Recent Tasks
          </CardTitle>
          <CardDescription>History of executed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taskHistory.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{task.task}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      {task.agent}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {task.tokens} tokens
                    </span>
                  </div>
                </div>
                <span className="text-sm text-slate-400">{task.createdAt}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            System Architecture
          </CardTitle>
          <CardDescription>How the multi-agent system works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            {/* User Input */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800">
              <MessageSquare className="h-5 w-5 text-slate-500" />
              <span className="font-medium">User Request</span>
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-slate-300 to-purple-500" />

            {/* Orchestrator */}
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 text-white shadow-lg">
              <Brain className="h-6 w-6" />
              <span className="font-semibold">Orchestrator Agent</span>
            </div>

            <div className="flex items-center gap-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500" />
              <div className="h-8 w-px bg-gradient-to-b from-purple-500 to-blue-500" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-500" />
            </div>

            {/* Worker Agents */}
            <div className="flex flex-wrap justify-center gap-3">
              {['Code', 'Research', 'SEO', 'Blog', 'Security'].map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <Play className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{agent}</span>
                </div>
              ))}
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-blue-500 to-green-500" />

            {/* Result */}
            <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Aggregated Result</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
