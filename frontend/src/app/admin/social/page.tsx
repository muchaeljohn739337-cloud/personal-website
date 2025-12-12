"use client";

import {
  createSocialMediaPost,
  getSocialMediaPlatforms,
  getSocialMediaPosts,
  type SocialMediaPlatform,
  type SocialMediaPost,
} from "@/services/socialMediaService";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SocialMediaAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, platformsData] = await Promise.all([
        getSocialMediaPosts(),
        getSocialMediaPlatforms(),
      ]);
      setPosts(postsData);
      setPlatforms(platformsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (data: any) => {
    try {
      await createSocialMediaPost(data);
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Social Media Manager
            </h1>
            <p className="text-gray-400">
              Schedule and manage your social media posts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Posts</div>
            <div className="text-3xl font-bold text-white">{posts.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Scheduled</div>
            <div className="text-3xl font-bold text-white">
              {posts.filter((p) => p.status === "SCHEDULED").length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Published</div>
            <div className="text-3xl font-bold text-white">
              {posts.filter((p) => p.status === "POSTED").length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Platforms</div>
            <div className="text-3xl font-bold text-white">
              {platforms.length}
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Connected Platforms
            </h2>
            <button
              onClick={() => router.push("/admin/social/platforms")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
            >
              Manage Platforms
            </button>
          </div>
          {platforms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No platforms connected. Connect your social media accounts to get
              started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        platform.type === "FACEBOOK"
                          ? "bg-blue-600"
                          : platform.type === "TWITTER"
                            ? "bg-sky-500"
                            : platform.type === "INSTAGRAM"
                              ? "bg-pink-600"
                              : platform.type === "LINKEDIN"
                                ? "bg-blue-700"
                                : "bg-gray-600"
                      }`}
                    >
                      {platform.type[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {platform.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {platform.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Posts</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No posts found. Create your first post to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 10).map((post) => (
                <div
                  key={post.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.status === "POSTED"
                              ? "bg-green-500/20 text-green-300"
                              : post.status === "SCHEDULED"
                                ? "bg-blue-500/20 text-blue-300"
                                : post.status === "FAILED"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {post.status}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {post.platform?.type}
                        </span>
                      </div>
                      <p className="text-white mb-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="text-gray-400 text-sm">
                        {post.scheduledFor
                          ? `Scheduled for ${new Date(post.scheduledFor).toLocaleString()}`
                          : post.publishedAt
                            ? `Published ${new Date(post.publishedAt).toLocaleString()}`
                            : "Draft"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          platforms={platforms}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePost}
        />
      )}
    </div>
  );
}

function CreatePostModal({
  platforms,
  onClose,
  onCreate,
}: {
  platforms: SocialMediaPlatform[];
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    platformId: "",
    content: "",
    scheduledFor: "",
    status: "DRAFT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      scheduledFor: formData.scheduledFor || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Create Social Post
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform *
            </label>
            <select
              required
              value={formData.platformId}
              onChange={(e) =>
                setFormData({ ...formData, platformId: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select platform</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name} ({platform.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={5}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
          {formData.status === "SCHEDULED" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledFor: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
