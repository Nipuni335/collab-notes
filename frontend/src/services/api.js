// src/services/api.js
// Single Axios instance — automatically sends cookies and handles 401 redirect.

import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,           // send HTTP-only cookies
  timeout: 15000,
});

// ── Request: attach Bearer token from localStorage as fallback ────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: redirect to login on 401 ───────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Let the AuthContext handle the redirect; don't hard-reload here
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)       => API.post("/auth/register", data),
  login:    (data)       => API.post("/auth/login",    data),
  logout:   ()           => API.post("/auth/logout"),
  getMe:    ()           => API.get("/auth/me"),
  updateProfile: (data)  => API.put("/auth/me", data),
};

// ── Notes endpoints ───────────────────────────────────────────────────────────
export const notesAPI = {
  getAll:   ()           => API.get("/notes"),
  search:   (q)          => API.get(`/notes/search?q=${encodeURIComponent(q)}`),
  getById:  (id)         => API.get(`/notes/${id}`),
  create:   (data)       => API.post("/notes", data),
  update:   (id, data)   => API.put(`/notes/${id}`, data),
  delete:   (id)         => API.delete(`/notes/${id}`),
  addCollaborator:    (id, email)  => API.post(`/notes/${id}/collaborators`, { email }),
  removeCollaborator: (id, userId) => API.delete(`/notes/${id}/collaborators/${userId}`),
};

export default API;
