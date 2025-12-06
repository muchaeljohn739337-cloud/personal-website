'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';

// Mock data - replace with real API calls
const mockPosts = [
  {
    id: '1',
    title: 'Getting Started with AI-Powered Content Creation',
    slug: 'getting-started-ai-content',
    excerpt: 'Learn how to leverage AI to create engaging content faster...',
    status: 'PUBLISHED',
    category: 'AI & Technology',
    author: 'Admin',
    publishedAt: '2024-01-15',
    viewCount: 1234,
    isAiGenerated: true,
  },
  {
    id: '2',
    title: 'The Future of SaaS Automation',
    slug: 'future-saas-automation',
    excerpt: 'Discover the trends shaping the future of business automation...',
    status: 'DRAFT',
    category: 'Business',
    author: 'Admin',
    publishedAt: null,
    viewCount: 0,
    isAiGenerated: false,
  },
  {
    id: '3',
    title: 'Building Scalable Payment Systems',
    slug: 'scalable-payment-systems',
    excerpt: 'A comprehensive guide to building robust payment infrastructure...',
    status: 'SCHEDULED',
    category: 'Engineering',
    author: 'Admin',
    publishedAt: '2024-02-01',
    viewCount: 0,
    isAiGenerated: true,
  },
];

const statusColors = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  PUBLISHED: 'bg-green-500/20 text-green-400',
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  ARCHIVED: 'bg-amber-500/20 text-amber-400',
};

export default function AdminBlogPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPosts = mockPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-slate-400">Manage your blog content and SEO</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/blog/ai-generate"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: '24', icon: FileText },
          { label: 'Published', value: '18', icon: Eye },
          { label: 'Drafts', value: '4', icon: Edit },
          { label: 'Scheduled', value: '2', icon: Calendar },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <stat.icon className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Views
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-900/30">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{post.title}</p>
                        {post.isAiGenerated && (
                          <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-400">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{post.excerpt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[post.status as keyof typeof statusColors]}`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-400">{post.category}</td>
                <td className="px-4 py-4 text-sm text-slate-400">
                  {post.viewCount.toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    {post.status === 'SCHEDULED' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                    {post.publishedAt || 'Not set'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
