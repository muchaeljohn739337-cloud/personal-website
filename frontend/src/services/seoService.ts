import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAuthHeader = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================================
// SEO AUDIT OPERATIONS
// ============================================================================

export interface SEOAudit {
  id: string;
  blogPostId: string;
  score: number;
  findings: any;
  recommendations: any;
  executedAt: string;
  createdAt: string;
  post?: any;
}

export const createSEOAudit = async (blogPostId: string) => {
  const response = await axios.post(
    `${API_URL}/api/seo/audits`,
    { blogPostId },
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export const getSEOAudits = async (
  blogPostId?: string,
  limit?: number,
  offset?: number
) => {
  const params = new URLSearchParams();
  if (blogPostId) params.append("blogPostId", blogPostId);
  if (limit) params.append("limit", String(limit));
  if (offset) params.append("offset", String(offset));

  const response = await axios.get(`${API_URL}/api/seo/audits?${params}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSEOAudit = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/seo/audits/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// SITEMAP OPERATIONS
// ============================================================================

export interface Sitemap {
  id: string;
  url: string;
  changefreq: string;
  priority: number;
  lastmod: string;
  createdAt: string;
  updatedAt: string;
}

export const generateSitemap = async () => {
  const response = await axios.post(
    `${API_URL}/api/seo/sitemap/generate`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export const getSitemapEntries = async () => {
  const response = await axios.get(`${API_URL}/api/seo/sitemap`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
