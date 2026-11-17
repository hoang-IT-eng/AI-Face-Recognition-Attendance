import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function deriveWsLivenessUrl() {
  if (import.meta.env.VITE_WS_LIVENESS_URL) {
    return import.meta.env.VITE_WS_LIVENESS_URL;
  }
  const apiBase = import.meta.env.VITE_API_BASE;
  if (apiBase) {
    try {
      const u = new URL(apiBase);
      const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProto}//${u.host}/camera/ws/liveness`;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined" && window.location?.host) {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${window.location.host}/camera/ws/liveness`;
  }
  return "ws://localhost:8000/camera/ws/liveness";
}

export const WS_LIVENESS_URL = deriveWsLivenessUrl();

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A static host (or any misconfigured server) may answer API calls with the
// SPA's index.html (HTTP 200, text/html) instead of JSON. Treating that HTML
// string as data poisons page state — arrays become strings and the next
// render crashes to a white screen. Convert such responses into a normal
// request failure so pages keep their built-in fallbacks. The login call is
// the one exception: the console resolves it locally in demo mode, so it
// receives an empty object instead of a rejection.
api.interceptors.response.use((response) => {
  const data = response.data;
  const contentType = response.headers?.["content-type"] || "";
  const looksHtml =
    typeof data === "string" &&
    (contentType.includes("text/html") || data.trimStart().startsWith("<"));
  if (!looksHtml) return response;
  if ((response.config?.url || "").includes("/auth/login")) {
    response.data = {};
    return response;
  }
  const error = new Error("API did not return JSON (received HTML)");
  error.response = response;
  error.config = response.config;
  return Promise.reject(error);
});

// Auth
export const login = (email, password) =>
  api.post("/auth/login", { email, password });
export const getMe = () => api.get("/auth/me");

// Users
export const getUsers = () => api.get("/users/");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users/", data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const registerFace = (userId, file, { consent = false, source } = {}) => {
  const form = new FormData();
  form.append("file", file);
  form.append("consent", consent ? "true" : "false");
  if (source) form.append("source", source);
  return api.post(`/users/${userId}/faces`, form);
};
export const clearFaces = (userId) => api.delete(`/users/${userId}/faces`);
export const importExcel = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/users/import/excel", form);
};

// Schedules (Ca làm việc)
export const getSchedules = () => api.get("/schedules/");
export const createSchedule = (data) => api.post("/schedules/", data);
export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data);
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`);

// Attendance
export const getAttendance = (params) => api.get("/attendance/", { params });
export const getTodayAttendance = () => api.get("/attendance/today");
export const getAdjustments = (params) =>
  api.get("/attendance/adjustments", { params });
export const manualAttendance = (data) => api.post("/attendance/manual", data);
export const backupAttendance = (data) => api.post("/attendance/backup", data);
export const getBackupRecent = (params) =>
  api.get("/attendance/backup/recent", { params });
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);
export const getStatsSummary = (params) =>
  api.get("/attendance/stats/summary", { params });
export const exportExcel = (params) =>
  api.get("/attendance/export/excel", { params, responseType: "blob" });

// Alerts
export const getAlerts = (params) => api.get("/alerts/", { params });
export const getAlertStats = () => api.get("/alerts/stats");
export const resolveAlert = (id, resolved = true) =>
  api.patch(`/alerts/${id}`, { resolved });
export const resolveAllAlerts = () => api.post("/alerts/resolve-all");

// Privacy
export const getPrivacySettings = () => api.get("/privacy/settings");
export const updatePrivacySettings = (data) =>
  api.put("/privacy/settings", data);
export const getConsents = () => api.get("/privacy/consents");
export const createConsent = (params) =>
  api.post("/privacy/consents", null, { params });

// Reports
export const getPayrollReport = (params) =>
  api.get("/reports/payroll", { params });
export const getEmployeeReport = (code, params) =>
  api.get(`/reports/employees/${code}`, { params });

// Camera - recognize from image
export const recognizeImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/camera/recognize", form);
};

export default api;
