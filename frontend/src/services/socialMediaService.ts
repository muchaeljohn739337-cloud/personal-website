import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAuthHeader = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================================
// SOCIAL MEDIA POST OPERATIONS
// ============================================================================

export interface SocialMediaPost {
  id: string;
  platformId: string;
  content: string;
  mediaUrls?: string[];
  scheduledFor?: string;
  status: "DRAFT" | "SCHEDULED" | "POSTED" | "FAILED";
  publishedAt?: string;
  externalPostId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  platform?: SocialMediaPlatform;
}

export interface SocialMediaPlatform {
  id: string;
  name: string;
  type:
    | "FACEBOOK"
    | "TWITTER"
    | "INSTAGRAM"
    | "LINKEDIN"
    | "TIKTOK"
    | "YOUTUBE";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  metadata?: any;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface SocialMediaAnalytics {
  id: string;
  postId: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagement: number;
  recordedAt: string;
  post?: SocialMediaPost;
}

// ============================================================================
// SOCIAL MEDIA POST FUNCTIONS
// ============================================================================

export const createSocialMediaPost = async (data: Partial<SocialMediaPost>) => {
  const response = await axios.post(`${API_URL}/api/social/posts`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSocialMediaPosts = async (filters?: {
  platformId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.platformId) params.append("platformId", filters.platformId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const response = await axios.get(`${API_URL}/api/social/posts?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSocialMediaPost = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/social/posts/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateSocialMediaPost = async (
  id: string,
  data: Partial<SocialMediaPost>
) => {
  const response = await axios.put(`${API_URL}/api/social/posts/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteSocialMediaPost = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/social/posts/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const publishSocialMediaPost = async (id: string) => {
  const response = await axios.post(
    `${API_URL}/api/social/posts/${id}/publish`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

// ============================================================================
// PLATFORM FUNCTIONS
// ============================================================================

export const createSocialMediaPlatform = async (
  data: Partial<SocialMediaPlatform>
) => {
  const response = await axios.post(`${API_URL}/api/social/platforms`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSocialMediaPlatforms = async () => {
  const response = await axios.get(`${API_URL}/api/social/platforms`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSocialMediaPlatform = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/social/platforms/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateSocialMediaPlatform = async (
  id: string,
  data: Partial<SocialMediaPlatform>
) => {
  const response = await axios.put(
    `${API_URL}/api/social/platforms/${id}`,
    data,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export const deleteSocialMediaPlatform = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/social/platforms/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

export const getSocialMediaAnalytics = async (
  postId?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams();
  if (postId) params.append("postId", postId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await axios.get(
    `${API_URL}/api/social/analytics?${params}`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export const getPostAnalytics = async (postId: string) => {
  const response = await axios.get(
    `${API_URL}/api/social/posts/${postId}/analytics`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export const getSocialMediaStats = async () => {
  const response = await axios.get(`${API_URL}/api/social/stats`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
