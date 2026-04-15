import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

// Users
export const getUsers = () => api.get("/users/");
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

// Attendance
export const getAttendance = (params) => api.get("/attendance/", { params });
export const getTodayAttendance = () => api.get("/attendance/today");
export const manualAttendance = (data) => api.post("/attendance/manual", data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const exportExcel = (params) => api.get("/attendance/export/excel", { params, responseType: "blob" });

// Camera - recognize from image
export const recognizeImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/camera/recognize", form);
};
