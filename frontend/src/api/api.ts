import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

const PUBLIC_ENDPOINTS = ["/auth/login/", "/auth/set-password/"];

api.interceptors.request.use((config) => {
  const url = config.url || "";

  // If calling a public endpoint, do not attach token
  if (PUBLIC_ENDPOINTS.some((p) => url.startsWith(p))) {
    if (config.headers?.Authorization) delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
