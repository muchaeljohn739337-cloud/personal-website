'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Wand2,
  FileText,
  Target,
  Hash,
  Globe,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
];

const lengthOptions = [
  { value: 'short', label: 'Short (~500 words)' },
  { value: 'medium', label: 'Medium (~1000 words)' },
  { value: 'long', label: 'Long (~2000 words)' },
  { value: 'comprehensive', label: 'Comprehensive (~3000+ words)' },
];

export default function AIGeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    length: 'medium',
    targetAudience: '',
    includeImages: true,
    includeSeo: true,
  });
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
    excerpt: string;
    metaDescription: string;
    suggestedTags: string[];
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Simulate AI generation - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setGeneratedContent({
      title: `The Complete Guide to ${formData.topic}`,
      content: `# Introduction\n\nIn today's rapidly evolving digital landscape, understanding ${formData.topic} has become essential for businesses and individuals alike.\n\n## Why ${formData.topic} Matters\n\nThe importance of ${formData.topic} cannot be overstated. Here are the key reasons:\n\n1. **Increased Efficiency** - Streamline your workflows and save valuable time\n2. **Better Results** - Achieve superior outcomes with proven strategies\n3. **Competitive Advantage** - Stay ahead of the competition\n\n## Getting Started\n\nTo begin your journey with ${formData.topic}, follow these steps:\n\n### Step 1: Understanding the Basics\n\nBefore diving deep, it's crucial to grasp the fundamental concepts...\n\n### Step 2: Implementation\n\nOnce you understand the basics, you can start implementing...\n\n### Step 3: Optimization\n\nContinuous improvement is key to success...\n\n## Best Practices\n\nHere are some best practices to keep in mind:\n\n- Always start with clear objectives\n- Measure your progress regularly\n- Adapt and iterate based on results\n- Stay updated with the latest trends\n\n## Conclusion\n\nMastering ${formData.topic} is a journey, not a destination. By following the strategies outlined in this guide, you'll be well on your way to success.\n\n---\n\n*Ready to take the next step? Contact us to learn more about how we can help you succeed with ${formData.topic}.*`,
      excerpt: `Discover everything you need to know about ${formData.topic}. This comprehensive guide covers the fundamentals, best practices, and advanced strategies to help you succeed.`,
      metaDescription: `Learn about ${formData.topic} with our complete guide. Discover best practices, implementation strategies, and expert tips to achieve your goals.`,
      suggestedTags: [
        'guide',
        formData.topic.toLowerCase().replace(/\s+/g, '-'),
        'tutorial',
        'best-practices',
      ],
    });

    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsDraft = () => {
    // Save to database and redirect to editor
    router.push('/admin/blog/new?draft=true');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Article Generator</h1>
          <p className="text-slate-400">Generate SEO-optimized blog posts with AI</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Wand2 className="h-5 w-5 text-violet-400" />
              Generation Settings
            </h2>

            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Topic / Title Idea *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., AI-Powered Content Marketing Strategies"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Target Keywords
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="e.g., AI marketing, content automation, SEO"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Target Audience
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="e.g., Marketing professionals, SaaS founders"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tone & Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    {toneOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Length</label>
                  <select
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    {lengthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeSeo}
                    onChange={(e) => setFormData({ ...formData, includeSeo: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300">Generate SEO metadata</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeImages}
                    onChange={(e) => setFormData({ ...formData, includeImages: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300">Suggest images</span>
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!formData.topic || isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-medium text-white hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Article
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SEO Preview */}
          {generatedContent && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Globe className="h-5 w-5 text-violet-400" />
                SEO Preview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Meta Title</p>
                  <p className="text-blue-400">{generatedContent.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Meta Description</p>
                  <p className="text-sm text-slate-300">{generatedContent.metaDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Suggested Tags</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {generatedContent.suggestedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs text-violet-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Content Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Generated Content</h2>
            {generatedContent && (
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {generatedContent ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">{generatedContent.title}</h3>
              <p className="text-slate-400">{generatedContent.excerpt}</p>
              <div className="prose prose-invert max-h-[500px] overflow-y-auto rounded-lg bg-slate-950/50 p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-300">
                  {generatedContent.content}
                </pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveAsDraft}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save as Draft
                </button>
                <button className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700">
                  Publish Now
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-slate-800 p-4">
                <Sparkles className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-slate-500">
                Enter a topic and click &quot;Generate Article&quot; to create AI-powered content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
