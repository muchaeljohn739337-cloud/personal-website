'use client';

import {
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Pause,
  Play,
  Plus,
  Settings,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: Record<string, unknown>[];
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
}

const triggerTypes = [
  { value: 'SCHEDULE', label: 'Schedule', icon: Calendar, description: 'Run on a schedule (cron)' },
  { value: 'WEBHOOK', label: 'Webhook', icon: Webhook, description: 'Trigger via HTTP webhook' },
  { value: 'EVENT', label: 'Event', icon: Zap, description: 'Trigger on internal events' },
  { value: 'MANUAL', label: 'Manual', icon: Play, description: 'Run manually on demand' },
];

// Action types for future use
// const actionTypes = [
//   { value: 'ai_task', label: 'AI Task', description: 'Run an AI agent task' },
//   { value: 'http_request', label: 'HTTP Request', description: 'Make an API call' },
//   { value: 'email', label: 'Send Email', description: 'Send an email notification' },
//   { value: 'webhook', label: 'Call Webhook', description: 'Trigger external webhook' },
// ];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'MANUAL',
    triggerConfig: {},
    actions: [{ type: 'ai_task', config: { task: '' } }],
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.automations) {
        setAutomations(data.automations);
      }
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAutomations();
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          triggerType: 'MANUAL',
          triggerConfig: {},
          actions: [{ type: 'ai_task', config: { task: '' } }],
        });
      }
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      await fetchAutomations();
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      await fetch(`/api/automations?id=${id}`, { method: 'DELETE' });
      await fetchAutomations();
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  const handleRun = async (id: string) => {
    // TODO: Implement manual run
    alert('Running automation: ' + id);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Zap className="h-8 w-8 text-yellow-500" />
            Automations
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Create automated workflows and triggers
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {automations.length}
                </p>
                <p className="text-sm text-slate-500">Total Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {automations.filter((a) => a.is_active).length}
                </p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {automations.reduce((sum, a) => sum + a.run_count, 0)}
                </p>
                <p className="text-sm text-slate-500">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {automations.filter((a) => a.trigger_type === 'WEBHOOK').length}
                </p>
                <p className="text-sm text-slate-500">Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              No automations yet
            </h3>
            <p className="mt-2 text-center text-slate-500">
              Create your first automation to start automating tasks
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {automations.map((automation) => (
            <Card key={automation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        automation.is_active
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {automation.trigger_type === 'SCHEDULE' && (
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {automation.trigger_type === 'WEBHOOK' && (
                        <Webhook className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                      {automation.trigger_type === 'EVENT' && (
                        <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                      {automation.trigger_type === 'MANUAL' && (
                        <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      <CardDescription>
                        {automation.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      automation.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {automation.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {automation.run_count} runs
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    {automation.trigger_type}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRun(automation.id)}
                    disabled={!automation.is_active}
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(automation.id, automation.is_active)}
                  >
                    {automation.is_active ? (
                      <>
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-3 w-3" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(automation.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create Automation</CardTitle>
              <CardDescription>Set up a new automated workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Automation"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this automation do?"
                />
              </div>
              <div>
                <Label>Trigger Type</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {triggerTypes.map((trigger) => (
                    <button
                      key={trigger.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                        formData.triggerType === trigger.value
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <trigger.icon className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {trigger.label}
                        </p>
                        <p className="text-xs text-slate-500">{trigger.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>AI Task (Action)</Label>
                <Input
                  value={(formData.actions[0]?.config as { task?: string })?.task || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: [{ type: 'ai_task', config: { task: e.target.value } }],
                    })
                  }
                  placeholder="e.g., Generate daily report..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.name}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
