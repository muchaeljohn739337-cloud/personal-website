import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================================
// BLOG POST OPERATIONS
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentMarkdown: string;
  contentHtml: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  categoryId?: string;
  tags?: string[];
  featuredImage?: string;
  authorId: string;
  publishedAt?: string;
  scheduledFor?: string;
  viewCount: number;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: any;
  category?: any;
}

export const createBlogPost = async (data: Partial<BlogPost>) => {
  const response = await axios.post(`${API_URL}/api/blog/posts`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getBlogPosts = async (filters?: { status?: string; categoryId?: string; limit?: number; offset?: number }) => {
  const params = new URLSearchParams(filters as any);
  const response = await axios.get(`${API_URL}/api/blog/posts?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getBlogPost = async (slugOrId: string) => {
  const response = await axios.get(`${API_URL}/api/blog/posts/${slugOrId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost>) => {
  const response = await axios.put(`${API_URL}/api/blog/posts/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteBlogPost = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/blog/posts/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export const createCategory = async (data: { name: string; description?: string }) => {
  const response = await axios.post(`${API_URL}/api/blog/categories`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getCategories = async () => {
  const response = await axios.get(`${API_URL}/api/blog/categories`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateCategory = async (id: string, data: { name?: string; description?: string }) => {
  const response = await axios.put(`${API_URL}/api/blog/categories/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/blog/categories/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// MEDIA OPERATIONS
// ============================================================================

export interface Media {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  alt?: string;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
}

export const uploadMedia = async (file: File, alt?: string, caption?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (alt) formData.append("alt", alt);
  if (caption) formData.append("caption", caption);

  const response = await axios.post(`${API_URL}/api/blog/media`, formData, {
    headers: {
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getMedia = async (limit?: number, offset?: number) => {
  const params = new URLSearchParams({ limit: String(limit || 50), offset: String(offset || 0) });
  const response = await axios.get(`${API_URL}/api/blog/media?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteMedia = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/blog/media/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// STATS
// ============================================================================

export const getBlogStats = async () => {
  const response = await axios.get(`${API_URL}/api/blog/stats`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
