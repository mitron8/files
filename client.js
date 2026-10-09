function isLoopback(host) {
  return !host || host === "localhost" || host === "127.0.0.1" || host === "::1";
}

// Use the host the browser actually opened. A saved localhost URL is only
// valid on this PC; from another device it is rewritten to that device's host.
function resolveApiBase() {
  const host = typeof window === "undefined" ? "" : window.location.hostname;
  const onLan = Boolean(host) && !isLoopback(host);
  const configured = String(import.meta.env.VITE_API_BASE ?? "").trim().replace(/\/$/, "");

  if (configured) {
    let cfgHost = "";
    let cfgPort = "8000";
    try {
      const url = new URL(configured);
      cfgHost = url.hostname;
      cfgPort = url.port || "8000";
    } catch {
      cfgHost = "";
    }
    if (onLan && isLoopback(cfgHost)) {
      return `${window.location.protocol}//${host}:${cfgPort}`;
    }
    return configured;
  }

  // Nothing configured. In dev the page origin proxies /api, so no host is required.
  if (import.meta.env.DEV || !onLan) return "";
  return `${window.location.protocol}//${host}:8000`;
}

const API_BASE = resolveApiBase();

function getToken() {
  return localStorage.getItem("qla_token");
}

async function request(path, { method = "GET", body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body !== undefined) finalHeaders["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    const dest = `${API_BASE || window.location.origin}${path}`;
    throw new Error(
      `Cannot reach qla-backend at ${dest}. Start all services with start_all.bat and open the app using this PC's network address.`
    );
  }

  if (res.status === 401) {
    localStorage.removeItem("qla_token");
    localStorage.removeItem("qla_user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const stamp = res.headers.get("X-QLA-DB");
  if (stamp) {
    const previous = sessionStorage.getItem("qla_db_stamp");
    sessionStorage.setItem("qla_db_stamp", stamp);
    if (
      previous &&
      previous !== stamp &&
      sessionStorage.getItem("qla_switching_db") !== "1"
    ) {
      window.location.reload();
      throw new Error("The database changed. Reloading the website.");
    }
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res;
}

export const api = {
  health: () => request("/api/health"),
  databaseSettings: () => request("/api/admin/databases"),
  addDatabase: (payload) => request("/api/admin/databases", { method: "POST", body: payload }),
  updateDatabase: (id, payload) =>
    request(`/api/admin/databases/${encodeURIComponent(id)}`, { method: "PATCH", body: payload }),
  deleteDatabase: (id) =>
    request(`/api/admin/databases/${encodeURIComponent(id)}`, { method: "DELETE" }),
  activateDatabase: (id) =>
    request(`/api/admin/databases/${encodeURIComponent(id)}/activate`, { method: "POST" }),
  testDatabase: (url) => request("/api/admin/databases/test", { method: "POST", body: { url } }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  changePassword: (payload) =>
    request("/api/auth/change-password", { method: "POST", body: payload }),
  presence: () => request("/api/auth/presence", { method: "POST" }),
  activityLogs: (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request(`/api/activity/logs${qs ? `?${qs}` : ""}`);
  },
  me: () => request("/api/auth/me"),
  caseCommunication: (caseId) => request(`/api/cases/${caseId}/communication`),
  reviewQueue: () => request("/api/review-queue"),
  reviewQueueCases: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/api/review-queue-cases${query ? `?${query}` : ""}`);
  },
  cases: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/api/cases${query ? `?${query}` : ""}`);
  },
  caseDetail: (id) => request(`/api/cases/${id}`),

  catalogues: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/api/catalogues${query ? `?${query}` : ""}`);
  },
  catalogueDetail: (family) => request(`/api/catalogues/${encodeURIComponent(family)}`),
  updateCatalogue: (family, payload) =>
    request(`/api/catalogues/${encodeURIComponent(family)}`, { method: "PUT", body: payload }),
  addCatalogue: (formData) =>
    request("/api/catalogues", { method: "POST", body: formData, isFormData: true }),

  listUsers: () => request("/api/users"),
  createUser: (payload) => request("/api/users", { method: "POST", body: payload }),
  updateUser: (userId, payload) => request(`/api/users/${userId}`, { method: "PATCH", body: payload }),
  deleteUser: (userId) => request(`/api/users/${userId}`, { method: "DELETE" }),
  changePassword: (payload) => request("/api/auth/change-password", { method: "POST", body: payload }),
  resetUserPassword: (userId, newPassword) => request(`/api/users/${userId}/reset-password`, { method: "POST", body: { new_password: newPassword } }),

  approve: (recId) => request(`/api/recommendations/${recId}/approve`, { method: "POST" }),
  reject: (recId) => request(`/api/recommendations/${recId}/reject`, { method: "POST" }),
  resetDecision: (recId) =>
  request(`/api/recommendations/${recId}/reset`, { method: "POST" }),
  edit: (recId, payload) =>
    request(`/api/recommendations/${recId}/edit`, { method: "POST", body: payload }),
  pickAlternative: (lineItemId, recId) =>
    request(`/api/line-items/${lineItemId}/pick/${recId}`, { method: "POST" }),
   approveAsNewItem: (recId) =>
    request(`/api/recommendations/${recId}/approve-as-new-item`, { method: "POST" }),
  submitFeedback: (caseId, payload) =>
    request(`/api/cases/${caseId}/feedback`, { method: "POST", body: payload }),
  quotationDetail: (caseId) => request(`/api/cases/${caseId}/quotation`),
  generateQuotation: (caseId) => request(`/api/cases/${caseId}/quotation/generate`, { method: "POST" }),
  updateQuotationLine: (caseId, lineItemId, payload) =>
    request(`/api/cases/${caseId}/quotation/lines/${lineItemId}`, { method: "PATCH", body: payload }),
  caseRevisions: (caseId) => request(`/api/cases/${caseId}/revisions`),
  updateDraftEmail: (caseId, payload) =>
    request(`/api/cases/${caseId}/quotation/email`, { method: "PATCH", body: payload }),
  markQuotationSent: (caseId) => request(`/api/cases/${caseId}/quotation/email/send`, { method: "POST" }),
  quotationDownloadUrl: (filename) => {
    const token = getToken();
    return `${API_BASE}/api/quotations/download/${encodeURIComponent(filename)}?_t=${token ? "1" : "0"}`;
  },

  getPricing: (caseId) => request(`/api/cases/${caseId}/pricing`),
  runAiMatch: (caseId) => request(`/api/cases/${caseId}/run-ai-match`, { method: "POST" }),
  bulkAiMatch: (caseIds) => request("/api/cases/bulk-ai-match", { method: "POST", body: { case_ids: caseIds } }),
  getInsights: (fy, quarter) => {
    const params = new URLSearchParams();
    if (fy && fy !== "ALL") params.set("fy", fy);
    if (quarter && quarter !== "ALL") params.set("quarter", quarter);
    const qs = params.toString();
    return request(`/api/insights${qs ? `?${qs}` : ""}`);
  },
  getInsightsTrends: (fy, quarter) => {
  const params = new URLSearchParams();
  if (fy) params.set("fy", fy);
  if (quarter) params.set("quarter", quarter);
  const qs = params.toString();
  return request(`/api/insights/trends${qs ? `?${qs}` : ""}`);
},
  savePricing: (caseId, payload) => request(`/api/cases/${caseId}/pricing`, { method: "PUT", body: payload }),

  caseDocuments: (caseId) => request(`/api/cases/${caseId}/documents`),
  enquiryEmail: (caseId) => request(`/api/cases/${caseId}/enquiry-email`),
  documentDownloadUrl: (documentId) => `${API_BASE}/api/documents/download/${documentId}`,

  // Fetches a file with the auth header and returns an in-memory blob URL,
  // for showing inside our own modal (instead of a new browser tab).
  getViewUrl: async (path) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
    const blob = await res.blob();
    return window.URL.createObjectURL(blob);
  },

  downloadBlob: async (path, suggestedFilename) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { getToken };