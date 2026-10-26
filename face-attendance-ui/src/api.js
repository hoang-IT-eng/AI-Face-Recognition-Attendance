import axios from "axios";

export const API_BASE = "http://localhost:8000";
export const WS_LIVENESS_URL = "ws://localhost:8000/camera/ws/liveness";

const api = axios.create({ baseURL: API_BASE });

// Users
export const getUsers = () => api.get("/users/");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users/", data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const registerFace = (userId, file) => {
  const form = new FormData();
  form.append("file", file);
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
export const manualAttendance = (data) => api.post("/attendance/manual", data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);
export const getStatsSummary = (params) => api.get("/attendance/stats/summary", { params });
export const exportExcel = (params) =>
  api.get("/attendance/export/excel", { params, responseType: "blob" });

// Camera - recognize from image
export const recognizeImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/camera/recognize", form);
};

export default api;
