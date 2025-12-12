"use client";

import { getBlogPosts, type BlogPost } from "@/services/blogService";
import {
  createSEOAudit,
  generateSitemap,
  getSEOAudits,
  type SEOAudit,
} from "@/services/seoService";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SEOAdminPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<SEOAudit[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [auditsData, postsData] = await Promise.all([
        getSEOAudits(),
        getBlogPosts({ status: "PUBLISHED" }),
      ]);
      setAudits(auditsData);
      setBlogPosts(postsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (blogPostId: string) => {
    try {
      setGenerating(true);
      await createSEOAudit(blogPostId);
      loadData();
    } catch (error) {
      console.error("Failed to create audit:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      setGenerating(true);
      await generateSitemap();
      alert("Sitemap generated successfully!");
    } catch (error) {
      console.error("Failed to generate sitemap:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              SEO Management
            </h1>
            <p className="text-gray-400">
              Optimize your content for search engines
            </p>
          </div>
          <button
            onClick={handleGenerateSitemap}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            {generating ? "Generating..." : "Generate Sitemap"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Audits</div>
            <div className="text-3xl font-bold text-white">{audits.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Average Score</div>
            <div className="text-3xl font-bold text-white">
              {audits.length > 0
                ? Math.round(
                    audits.reduce((sum, a) => sum + a.score, 0) / audits.length
                  )
                : 0}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Published Posts</div>
            <div className="text-3xl font-bold text-white">
              {blogPosts.length}
            </div>
          </div>
        </div>

        {/* Recent Audits */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Recent SEO Audits
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No audits found. Run an audit to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {audits.slice(0, 10).map((audit) => (
                <div
                  key={audit.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">
                        {audit.post?.title || "Unknown Post"}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(audit.executedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            audit.score >= 80
                              ? "text-green-400"
                              : audit.score >= 60
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {audit.score}
                        </div>
                        <div className="text-xs text-gray-400">SEO Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Run Audit for Posts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Run SEO Audit</h2>
          <div className="space-y-3">
            {blogPosts.slice(0, 10).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between bg-white/5 rounded-lg p-4"
              >
                <div>
                  <div className="text-white font-medium">{post.title}</div>
                  <div className="text-gray-400 text-sm">{post.slug}</div>
                </div>
                <button
                  onClick={() => handleCreateAudit(post.id)}
                  disabled={generating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 text-sm"
                >
                  Run Audit
                </button>
              </div>
            ))}
            {blogPosts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No published posts available for audits
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
