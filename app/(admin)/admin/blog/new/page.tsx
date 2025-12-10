/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Image as ImageIcon,
  Hash,
  Globe,
  Calendar,
  Loader2,
} from 'lucide-react';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    categoryId: '',
    tags: [] as string[],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'DRAFT',
    publishedAt: '',
  });

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    // Simulate save - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    if (publish) {
      router.push('/admin/blog');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">New Blog Post</h1>
            <p className="text-slate-400">Create a new article</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-900/50 p-1">
        {[
          { id: 'content', label: 'Content', icon: Settings },
          { id: 'seo', label: 'SEO', icon: Globe },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Title */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                placeholder="Post title..."
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <span>Slug:</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 bg-transparent text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your content here... (Markdown supported)"
                rows={20}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">
                Supports Markdown formatting. Use ## for headings, **bold**, *italic*, etc.
              </p>
            </div>

            {/* Excerpt */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the post..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                <ImageIcon className="h-4 w-4" />
                Featured Image
              </label>
              <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500">Click to upload</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select category</option>
                <option value="1">Technology</option>
                <option value="2">Business</option>
                <option value="3">Marketing</option>
                <option value="4">Engineering</option>
              </select>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Hash className="h-4 w-4" />
                Tags
              </label>
              <input
                type="text"
                placeholder="Add tags separated by comma..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Schedule */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Calendar className="h-4 w-4" />
                Schedule
              </label>
              <input
                type="datetime-local"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">SEO Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO title (60 characters recommended)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO description (160 characters recommended)"
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Focus Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Search Preview</h2>
            <div className="rounded-lg bg-white p-4">
              <p className="text-lg text-blue-600 hover:underline">
                {formData.metaTitle || formData.title || 'Post Title'}
              </p>
              <p className="text-sm text-green-700">
                https://yoursite.com/blog/{formData.slug || 'post-slug'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {formData.metaDescription ||
                  formData.excerpt ||
                  'Post description will appear here...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Post Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-700 p-4">
                <div>
                  <p className="font-medium text-white">Allow Comments</p>
                  <p className="text-sm text-slate-500">Enable comments on this post</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-700 p-4">
                <div>
                  <p className="font-medium text-white">Featured Post</p>
                  <p className="text-sm text-slate-500">Show this post in featured section</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
