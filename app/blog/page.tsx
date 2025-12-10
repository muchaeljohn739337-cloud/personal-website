import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Mock data - replace with database query
const featuredPost = {
  id: '0',
  title: 'The Ultimate Guide to Building AI-First SaaS Products in 2024',
  slug: 'ultimate-guide-ai-first-saas',
  excerpt:
    'Discover how leading companies are leveraging artificial intelligence to create next-generation software products that delight users and drive unprecedented growth.',
  featuredImage: '/blog/featured.jpg',
  category: { name: 'Featured', slug: 'featured', color: '#f59e0b' },
  author: { name: 'Alex Chen', image: '/avatars/alex.jpg', role: 'CEO & Founder' },
  publishedAt: 'January 20, 2024',
  readingTime: 15,
};

const posts = [
  {
    id: '1',
    title: 'Getting Started with AI-Powered Content Creation',
    slug: 'getting-started-ai-content',
    excerpt:
      'Learn how to leverage AI to create engaging content faster. This comprehensive guide covers everything from setup to advanced techniques.',
    featuredImage: '/blog/ai-content.jpg',
    category: { name: 'AI & Technology', slug: 'ai-technology', color: '#8b5cf6' },
    author: { name: 'Sarah Johnson', image: '/avatars/sarah.jpg' },
    publishedAt: 'Jan 15, 2024',
    readingTime: 8,
    tags: ['AI', 'Content', 'Marketing'],
    views: 2847,
  },
  {
    id: '2',
    title: 'The Future of SaaS Automation',
    slug: 'future-saas-automation',
    excerpt:
      'Discover the trends shaping the future of business automation and how to prepare your organization for the changes ahead.',
    featuredImage: '/blog/saas-automation.jpg',
    category: { name: 'Business', slug: 'business', color: '#3b82f6' },
    author: { name: 'Michael Park', image: '/avatars/michael.jpg' },
    publishedAt: 'Jan 10, 2024',
    readingTime: 12,
    tags: ['SaaS', 'Automation', 'Business'],
    views: 1923,
  },
  {
    id: '3',
    title: 'Building Scalable Payment Systems',
    slug: 'scalable-payment-systems',
    excerpt:
      'A comprehensive guide to building robust payment infrastructure that scales with your business needs.',
    featuredImage: '/blog/payments.jpg',
    category: { name: 'Engineering', slug: 'engineering', color: '#10b981' },
    author: { name: 'Emily Davis', image: '/avatars/emily.jpg' },
    publishedAt: 'Jan 5, 2024',
    readingTime: 15,
    tags: ['Payments', 'Engineering', 'Scale'],
    views: 3156,
  },
  {
    id: '4',
    title: 'Mastering Customer Retention with Data',
    slug: 'customer-retention-data',
    excerpt:
      'Use data-driven strategies to reduce churn and build lasting customer relationships that fuel sustainable growth.',
    featuredImage: '/blog/retention.jpg',
    category: { name: 'Growth', slug: 'growth', color: '#ec4899' },
    author: { name: 'David Kim', image: '/avatars/david.jpg' },
    publishedAt: 'Jan 2, 2024',
    readingTime: 10,
    tags: ['Growth', 'Analytics', 'Retention'],
    views: 1654,
  },
  {
    id: '5',
    title: 'Design Systems That Scale',
    slug: 'design-systems-scale',
    excerpt:
      'Learn how to create and maintain design systems that grow with your product and team.',
    featuredImage: '/blog/design.jpg',
    category: { name: 'Design', slug: 'design', color: '#06b6d4' },
    author: { name: 'Lisa Wang', image: '/avatars/lisa.jpg' },
    publishedAt: 'Dec 28, 2023',
    readingTime: 9,
    tags: ['Design', 'UI/UX', 'Systems'],
    views: 2341,
  },
  {
    id: '6',
    title: 'Security Best Practices for Modern Apps',
    slug: 'security-best-practices',
    excerpt:
      'Protect your users and data with these essential security practices every developer should know.',
    featuredImage: '/blog/security.jpg',
    category: { name: 'Security', slug: 'security', color: '#ef4444' },
    author: { name: 'James Wilson', image: '/avatars/james.jpg' },
    publishedAt: 'Dec 22, 2023',
    readingTime: 14,
    tags: ['Security', 'DevOps', 'Best Practices'],
    views: 4521,
  },
];

const categories = [
  { name: 'All Posts', slug: 'all', count: 48, icon: BookOpen },
  { name: 'AI & Technology', slug: 'ai-technology', count: 12, icon: Sparkles },
  { name: 'Business', slug: 'business', count: 8, icon: TrendingUp },
  { name: 'Engineering', slug: 'engineering', count: 10, icon: Zap },
  { name: 'Growth', slug: 'growth', count: 6, icon: Users },
];

const stats = [
  { label: 'Articles Published', value: '120+' },
  { label: 'Monthly Readers', value: '50K+' },
  { label: 'Expert Authors', value: '15+' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#030014]">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[100px]" />
        <div className="absolute -bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[80px]" />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">
                Insights & Resources for Modern Builders
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Blog & Resources
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Expert insights on AI, automation, payments, and building world-class SaaS products.
              Stay ahead with actionable strategies from industry leaders.
            </p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 flex max-w-2xl items-center justify-center gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600/50 via-purple-600/50 to-blue-600/50 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center">
                <Search className="absolute left-5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search articles, topics, or authors..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-14 pr-6 text-white placeholder-slate-500 backdrop-blur-xl transition-all focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <button className="absolute right-3 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-blue-600/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/30 via-purple-600/20 to-blue-600/30 lg:aspect-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                    <Sparkles className="h-16 w-16 text-violet-400" />
                  </div>
                  <p className="text-sm text-white/60">Featured Article</p>
                </div>
              </div>
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black backdrop-blur-sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Featured
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
                  {featuredPost.category.name}
                </span>
                <span className="text-sm text-slate-500">{featuredPost.readingTime} min read</span>
              </div>

              <h2 className="text-3xl font-bold leading-tight text-white transition-colors group-hover:text-violet-300 lg:text-4xl">
                <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>

              <p className="mt-4 text-lg leading-relaxed text-slate-400">{featuredPost.excerpt}</p>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
                    {featuredPost.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{featuredPost.author.name}</p>
                    <p className="text-sm text-slate-500">{featuredPost.author.role}</p>
                  </div>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group/btn inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Read Article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Categories */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Categories
                </h3>
                <ul className="space-y-1">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="group/cat flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <category.icon className="h-4 w-4 text-violet-400" />
                          <span>{category.name}</span>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-purple-600/10 p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
                <div className="relative">
                  <div className="mb-3 inline-flex rounded-xl bg-violet-500/20 p-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Stay Updated</h3>
                  <p className="mb-4 text-sm text-slate-400">
                    Get weekly insights delivered straight to your inbox.
                  </p>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                  <button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500">
                    Subscribe Now
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Join 5,000+ subscribers. No spam.
                  </p>
                </div>
              </div>

              {/* Trending Tags */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Trending Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'AI',
                    'SaaS',
                    'Automation',
                    'Growth',
                    'Design',
                    'Security',
                    'Payments',
                    'API',
                  ].map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag.toLowerCase()}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="lg:col-span-3">
            {/* Section Header */}
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Latest Articles</h2>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/10 p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="rounded-lg border border-white/10 p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/50 hover:bg-white/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image - Optimized with next/image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-blue-600/20">
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <BookOpen className="h-8 w-8 text-white/60" />
                        </div>
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {post.views.toLocaleString()} views
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category & Time */}
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${post.category.color}20`,
                          color: post.category.color,
                        }}
                      >
                        {post.category.name}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-violet-300">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="mb-4 line-clamp-2 text-sm text-slate-400">{post.excerpt}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
                          {post.author.name.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-400">{post.author.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt}
                      </span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-5 right-5 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                    <div className="rounded-full bg-violet-600 p-2">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                <button className="h-10 w-10 rounded-xl bg-violet-600 text-sm font-medium text-white">
                  1
                </button>
                <button className="h-10 w-10 rounded-xl border border-white/10 text-sm text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  2
                </button>
                <button className="h-10 w-10 rounded-xl border border-white/10 text-sm text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  3
                </button>
                <span className="px-2 text-slate-500">...</span>
                <button className="h-10 w-10 rounded-xl border border-white/10 text-sm text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                  12
                </button>
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white">
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
