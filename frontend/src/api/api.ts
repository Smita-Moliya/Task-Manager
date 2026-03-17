import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

//Axios instance (your API “client”)
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

//Request interceptor (attach access token)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem("access");
  config.headers = config.headers ?? ({} as any);

  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

//built a refresh queue
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

//gives the new access token to all waiting requests
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

    // ensure headers exists (important)
    original.headers = original.headers ?? {};

    //If refresh is already happening → wait in queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((newAccess) => {
          if (!newAccess) return reject(err);

          // ✅ set latest token and retry
          original.headers.Authorization = `Bearer ${newAccess}`;
          resolve(api(original));
        });
      });
    }

    //Start refresh flow (only one request does this)
    isRefreshing = true;

    try {
      // use same base host; plain axios is fine but ensure correct URL
      const r = await axios.post("http://127.0.0.1:8000/api/auth/refresh/", { refresh });

      const newAccess = r.data.access as string;
      localStorage.setItem("access", newAccess);

      //Release all queued requests
      runQueue(newAccess);

      //Retry the original failed request
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } 
    //If refresh fails → logout everything
    catch (e) {            
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