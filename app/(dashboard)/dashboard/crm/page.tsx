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
  LEAD: 'bg-slate-500/20 text-slate-400',
  PROSPECT: 'bg-blue-500/20 text-blue-400',
  CUSTOMER: 'bg-green-500/20 text-green-400',
  CHURNED: 'bg-red-500/20 text-red-400',
};

const activityIcons: Record<string, string> = {
  CALL: '📞',
  MEETING: '📅',
  EMAIL: '✉️',
  TASK: '✅',
};

export default function CRMDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM Dashboard</h1>
          <p className="text-slate-400">Manage your contacts, deals, and pipeline</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700">
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <stat.icon className="h-5 w-5 text-violet-400" />
              </div>
              <span
                className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Sales Pipeline</h2>
        <div className="flex gap-4">
          {pipelineStages.map((stage) => (
            <div key={stage.name} className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">{stage.name}</span>
                <span className="text-xs text-slate-500">{stage.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${stage.color}`}
                  style={{ width: `${(stage.value / 500000) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">${(stage.value / 1000).toFixed(0)}K</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Contacts */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Contacts</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="rounded-lg border border-slate-700 bg-slate-950/50 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 p-4 transition-colors hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {contact.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[contact.status]}`}
                      >
                        {contact.status}
                      </span>
                      <p className="mt-1 text-sm text-slate-500">{contact.lastContact}</p>
                    </div>
                    <p className="font-semibold text-white">
                      ${contact.dealValue.toLocaleString()}
                    </p>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              View All Contacts
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Today&apos;s Activities</h2>
          <div className="space-y-3">
            {upcomingActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-slate-800 p-3"
              >
                <span className="text-xl">{activityIcons[activity.type]}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{activity.subject}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <span>{activity.time}</span>
                    {activity.contact && (
                      <>
                        <span>•</span>
                        <span>{activity.contact}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
            View Calendar
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'New Contact', icon: Users, color: 'from-violet-600 to-purple-600' },
          { label: 'New Deal', icon: DollarSign, color: 'from-blue-600 to-cyan-600' },
          { label: 'Schedule Call', icon: Phone, color: 'from-green-600 to-emerald-600' },
          { label: 'Send Email', icon: Mail, color: 'from-amber-600 to-orange-600' },
        ].map((action) => (
          <button
            key={action.label}
            className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${action.color} p-4 text-white transition-transform hover:scale-[1.02]`}
          >
            <action.icon className="h-5 w-5" />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
