"use client";

import {
  deleteBlogPost,
  getBlogPosts,
  type BlogPost,
} from "@/services/blogService";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BlogAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  useEffect(() => {
    loadPosts();
  }, [filters]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getBlogPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteBlogPost(id);
      loadPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Blog Posts</h1>
            <p className="text-gray-400">Manage your blog content</p>
          </div>
          <button
            onClick={() => router.push("/admin/blog/new")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                    Views
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.featuredImage && (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="text-white font-medium">
                            {post.title}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {post.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          post.status === "PUBLISHED"
                            ? "bg-green-500/20 text-green-300"
                            : post.status === "SCHEDULED"
                              ? "bg-blue-500/20 text-blue-300"
                              : post.status === "DRAFT"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {post.category?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {post.viewCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            window.open(`/blog/${post.slug}`, "_blank")
                          }
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/admin/blog/${post.id}/edit`)
                          }
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No posts found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
