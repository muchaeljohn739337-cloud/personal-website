'use client';

import { FileText, Filter, Plus, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ContentItem {
  id: string;
  title: string;
  type: 'BLOG' | 'PAGE' | 'DOCUMENTATION';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
}

export default function ContentManagementPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data
  const mockContent: ContentItem[] = [
    {
      id: '1',
      title: 'Getting Started with AI',
      type: 'BLOG',
      status: 'PUBLISHED',
      author: 'Admin',
      createdAt: '2024-12-01',
      updatedAt: '2024-12-05',
      views: 1247,
    },
    {
      id: '2',
      title: 'API Documentation',
      type: 'DOCUMENTATION',
      status: 'PUBLISHED',
      author: 'Admin',
      createdAt: '2024-11-15',
      updatedAt: '2024-11-20',
      views: 892,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage blog posts, pages, and documentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/admin/content/moderation">
              <Filter className="mr-2 h-4 w-4" />
              Moderation
            </a>
          </Button>
          <Button asChild>
            <a href="/admin/blog/new">
              <Plus className="mr-2 h-4 w-4" />
              New Content
            </a>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex h-10 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-900"
            >
              <option value="all">All Types</option>
              <option value="BLOG">Blog</option>
              <option value="PAGE">Page</option>
              <option value="DOCUMENTATION">Documentation</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex h-10 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-900"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
          <CardDescription>{mockContent.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          {mockContent.length > 0 ? (
            <div className="space-y-4">
              {mockContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                        <span>{item.type}</span>
                        <span>•</span>
                        <span
                          className={
                            item.status === 'PUBLISHED'
                              ? 'text-emerald-600'
                              : item.status === 'DRAFT'
                                ? 'text-amber-600'
                                : 'text-slate-500'
                          }
                        >
                          {item.status}
                        </span>
                        <span>•</span>
                        <span>{item.views} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/blog/${item.id}`}>Edit</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">No content found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

