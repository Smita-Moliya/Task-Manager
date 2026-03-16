import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem("access");
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function runQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const original = err.config as any;
    const status = err.response?.status;

    if (status !== 401 || original?._retry) {
      return Promise.reject(err);
    }

    original._retry = true;

    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      window.location.href = "/";
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((newAccess) => {
          if (!newAccess) return reject(err);
          original.headers.Authorization = `Bearer ${newAccess}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const r = await axios.post("http://127.0.0.1:8000/api/auth/refresh/", { refresh });

      const newAccess = r.data.access as string;   // ✅ only access
      localStorage.setItem("access", newAccess);

      runQueue(newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      runQueue(null);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      window.location.href = "/";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
