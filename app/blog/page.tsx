import Link from 'next/link';
import { Search, Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

// Mock data - replace with database query
const posts = [
  {
    id: '1',
    title: 'Getting Started with AI-Powered Content Creation',
    slug: 'getting-started-ai-content',
    excerpt:
      'Learn how to leverage AI to create engaging content faster. This comprehensive guide covers everything from setup to advanced techniques.',
    featuredImage: '/blog/ai-content.jpg',
    category: { name: 'AI & Technology', slug: 'ai-technology', color: '#8b5cf6' },
    author: { name: 'Admin', image: '/avatars/admin.jpg' },
    publishedAt: '2024-01-15',
    readingTime: 8,
    tags: ['AI', 'Content', 'Marketing'],
  },
  {
    id: '2',
    title: 'The Future of SaaS Automation',
    slug: 'future-saas-automation',
    excerpt:
      'Discover the trends shaping the future of business automation and how to prepare your organization for the changes ahead.',
    featuredImage: '/blog/saas-automation.jpg',
    category: { name: 'Business', slug: 'business', color: '#3b82f6' },
    author: { name: 'Admin', image: '/avatars/admin.jpg' },
    publishedAt: '2024-01-10',
    readingTime: 12,
    tags: ['SaaS', 'Automation', 'Business'],
  },
  {
    id: '3',
    title: 'Building Scalable Payment Systems',
    slug: 'scalable-payment-systems',
    excerpt:
      'A comprehensive guide to building robust payment infrastructure that scales with your business needs.',
    featuredImage: '/blog/payments.jpg',
    category: { name: 'Engineering', slug: 'engineering', color: '#10b981' },
    author: { name: 'Admin', image: '/avatars/admin.jpg' },
    publishedAt: '2024-01-05',
    readingTime: 15,
    tags: ['Payments', 'Engineering', 'Scale'],
  },
];

const categories = [
  { name: 'All', slug: 'all', count: 24 },
  { name: 'AI & Technology', slug: 'ai-technology', count: 8 },
  { name: 'Business', slug: 'business', count: 6 },
  { name: 'Engineering', slug: 'engineering', count: 5 },
  { name: 'Marketing', slug: 'marketing', count: 5 },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Blog & Resources
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Insights, tutorials, and updates from our team. Learn about AI, automation, payments,
              and building modern SaaS products.
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/50 py-4 pl-12 pr-4 text-white placeholder-slate-500 backdrop-blur-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Categories */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                      >
                        <span>{category.name}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="mb-2 font-semibold text-white">Subscribe to Newsletter</h3>
                <p className="mb-4 text-sm text-slate-400">
                  Get the latest articles delivered to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
                <button className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="lg:col-span-3">
            <div className="grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all hover:border-violet-500/50"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-violet-600/20 to-blue-600/20">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    <Link
                      href={`/blog/category/${post.category.slug}`}
                      className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${post.category.color}20`,
                        color: post.category.color,
                      }}
                    >
                      {post.category.name}
                    </Link>

                    {/* Title */}
                    <h2 className="mt-3 text-xl font-semibold text-white group-hover:text-violet-400">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{post.excerpt}</p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.publishedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readingTime} min read
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Read More */}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300"
                    >
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
                Previous
              </button>
              <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">1</button>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
                2
              </button>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
                3
              </button>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
