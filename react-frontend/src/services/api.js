// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Add Bearer token if available in localStorage
  const token = localStorage.getItem("token");
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: "include", // send cookies
  };

  const response = await fetch(url, config);

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (identifier, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  logout: () =>
    apiFetch("/auth/logout", {
      method: "POST",
    }),
  getMe: () => apiFetch("/auth/me"),
};

export const courseApi = {
  // Public/Student course catalog or Teacher courses
  getCourses: (params = {}) => {
    const query = new URLSearchParams();
    if (params.mine) query.set("mine", "true");
    if (params.enrolled) query.set("enrolled", "true");
    if (params.q) query.set("q", params.q);
    if (params.search) query.set("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/course${queryString}`);
  },

  getCourse: (courseId) => apiFetch(`/course/${courseId}`),

  createCourse: (data) =>
    apiFetch("/course", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCourse: (courseId, data) =>
    apiFetch(`/course/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCourse: (courseId) =>
    apiFetch(`/course/${courseId}`, {
      method: "DELETE",
    }),

  enrollCourse: (courseId) =>
    apiFetch(`/course/${courseId}/enroll`, {
      method: "POST",
    }),

  getEnrolledCourses: () => apiFetch("/course/enrolled"),
};
