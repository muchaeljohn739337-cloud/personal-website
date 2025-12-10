'use client';

import { useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Zap,
  Clock,
  MessageSquare,
  Video,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

// Mock data
const stats = [
  { label: 'Total Contacts', value: '2,847', change: '+12%', trend: 'up', icon: Users },
  { label: 'Active Deals', value: '156', change: '+8%', trend: 'up', icon: DollarSign },
  { label: 'Pipeline Value', value: '$1.2M', change: '+23%', trend: 'up', icon: TrendingUp },
  { label: 'Meetings Today', value: '8', change: '-2', trend: 'down', icon: Calendar },
];

const pipelineStages = [
  { name: 'Lead', count: 45, value: 125000, color: 'bg-slate-500' },
  { name: 'Qualified', count: 32, value: 280000, color: 'bg-blue-500' },
  { name: 'Proposal', count: 18, value: 420000, color: 'bg-violet-500' },
  { name: 'Negotiation', count: 12, value: 350000, color: 'bg-amber-500' },
  { name: 'Closed Won', count: 8, value: 180000, color: 'bg-green-500' },
];

const recentContacts = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@techcorp.com',
    company: 'TechCorp Inc.',
    status: 'CUSTOMER',
    lastContact: '2 hours ago',
    dealValue: 45000,
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@startup.io',
    company: 'Startup.io',
    status: 'LEAD',
    lastContact: '1 day ago',
    dealValue: 12000,
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily@enterprise.com',
    company: 'Enterprise Solutions',
    status: 'PROSPECT',
    lastContact: '3 days ago',
    dealValue: 85000,
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'jwilson@global.net',
    company: 'Global Networks',
    status: 'CUSTOMER',
    lastContact: '1 week ago',
    dealValue: 32000,
  },
];

const upcomingActivities = [
  {
    id: '1',
    type: 'CALL',
    subject: 'Follow-up call with Sarah',
    time: '10:00 AM',
    contact: 'Sarah Johnson',
  },
  { id: '2', type: 'MEETING', subject: 'Product demo', time: '2:00 PM', contact: 'Michael Chen' },
  { id: '3', type: 'EMAIL', subject: 'Send proposal', time: '4:00 PM', contact: 'Emily Davis' },
  { id: '4', type: 'TASK', subject: 'Update CRM records', time: '5:00 PM', contact: null },
];

const statusColors: Record<string, string> = {
  LEAD: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  PROSPECT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CUSTOMER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CHURNED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const activityIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  MEETING: Video,
  EMAIL: Mail,
  TASK: CheckCircle2,
};

export default function CRMDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative space-y-8">
      {/* Background Effects */}
      <div className="pointer-events-none absolute -left-64 -top-32 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[80px]" />

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">AI-Powered CRM</span>
          </div>
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent">
            Customer Relationships
          </h1>
          <p className="mt-1 text-slate-400">Manage contacts, deals, and your sales pipeline</p>
        </div>
        <div className="flex gap-3">
          <button className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10">
            <Filter className="h-4 w-4 text-slate-400 transition-colors group-hover:text-white" />
            Filter
          </button>
          <button className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-violet-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <Plus className="relative h-4 w-4" />
            <span className="relative">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:bg-white/10"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-2xl transition-all group-hover:scale-150" />
            <div className="relative flex items-center justify-between">
              <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-3">
                <stat.icon className="h-5 w-5 text-violet-400" />
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stat.trend === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="relative mt-4 text-3xl font-bold text-white">{stat.value}</p>
            <p className="relative text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Sales Pipeline</h2>
            <p className="text-sm text-slate-400">Track deals through your sales process</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-slate-300">$1.35M Total</span>
          </div>
        </div>
        <div className="flex gap-3">
          {pipelineStages.map((stage, index) => (
            <div
              key={stage.name}
              className="group flex-1 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium text-white">{stage.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
                  {stage.count}
                </span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800/50">
                <div
                  className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                  style={{
                    width: `${(stage.value / 500000) * 100}%`,
                    transitionDelay: `${index * 100}ms`,
                  }}
                />
              </div>
              <p className="text-lg font-semibold text-white">
                ${(stage.value / 1000).toFixed(0)}K
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Contacts */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Contacts</h2>
                <p className="text-sm text-slate-400">Your latest customer interactions</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-violet-500/50 focus:bg-white/10 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {recentContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-violet-500/30 hover:bg-white/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-violet-500/20">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{contact.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          {contact.company}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusColors[contact.status]}`}
                      >
                        {contact.status}
                      </span>
                      <p className="mt-1.5 flex items-center justify-end gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {contact.lastContact}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ${contact.dealValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Deal Value</p>
                    </div>
                    <button className="rounded-lg border border-white/10 p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white">
              View All Contacts
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Today&apos;s Activities</h2>
              <p className="text-sm text-slate-400">4 tasks scheduled</p>
            </div>
            <div className="rounded-lg bg-violet-500/20 px-2.5 py-1">
              <span className="text-xs font-medium text-violet-300">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {upcomingActivities.map((activity, index) => {
              const IconComponent = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-2.5">
                    <IconComponent className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.subject}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </span>
                      {activity.contact && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>{activity.contact}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white">
            View Calendar
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'New Contact',
            icon: Users,
            color: 'from-violet-600 to-purple-600',
            shadow: 'shadow-violet-500/25',
          },
          {
            label: 'New Deal',
            icon: Target,
            color: 'from-blue-600 to-cyan-600',
            shadow: 'shadow-blue-500/25',
          },
          {
            label: 'Schedule Call',
            icon: Phone,
            color: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/25',
          },
          {
            label: 'Send Email',
            icon: MessageSquare,
            color: 'from-amber-600 to-orange-600',
            shadow: 'shadow-amber-500/25',
          },
        ].map((action) => (
          <button
            key={action.label}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r ${action.color} p-5 text-white transition-all hover:scale-[1.02] hover:shadow-xl ${action.shadow}`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative rounded-lg bg-white/20 p-2">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="relative text-left">
              <span className="font-semibold">{action.label}</span>
              <p className="text-xs text-white/70">Click to create</p>
            </div>
            <Zap className="relative ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
