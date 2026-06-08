import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const ACCESS_TOKEN_KEY = "klinikos_access_token";
export const REFRESH_TOKEN_KEY = "klinikos_refresh_token";

export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (token && original.headers) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/v1/auth/refresh`, {
        refreshToken,
      });
      const newAccess = data.accessToken;
      const newRefresh = data.refreshToken;
      Cookies.set(ACCESS_TOKEN_KEY, newAccess, { sameSite: "lax" });
      Cookies.set(REFRESH_TOKEN_KEY, newRefresh, { sameSite: "lax" });
      flushQueue(newAccess);
      if (original.headers) {
        original.headers.Authorization = `Bearer ${newAccess}`;
      }
      return api(original);
    } catch (refreshErr) {
      flushQueue(null);
      Cookies.remove(ACCESS_TOKEN_KEY);
      Cookies.remove(REFRESH_TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
