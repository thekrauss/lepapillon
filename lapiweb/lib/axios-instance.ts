"use client";

import axios, {
  AxiosError,
  type AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

interface SessionRefreshResponse {
  access_token: string;
  refresh_token?: string | null;
  user_id: string;
  role: "client" | "admin" | null;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function getUserFacingHttpError(error: unknown): {
  message: string;
  description?: string;
} {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    const status = error.response?.status;
    const msg =
      data?.message || data?.error || error.message || "Erreur inconnue";

    if (!error.response) {
      return {
        message: "Connexion impossible",
        description: "Vérifiez votre connexion internet ou réessayez.",
      };
    }

    return {
      message: `Erreur ${status ?? ""}`.trim(),
      description: msg,
    };
  }

  return { message: "Erreur inattendue" };
}

const defaultApiBaseUrl =
  process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:8080/api/v1"
    : "/api/v1";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || defaultApiBaseUrl
).replace(/\/+$/, "");

export const authClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }
    if (token) {
      request.resolve(token);
    }
  });
  failedQueue = [];
};

authClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authState = useAuthStore.getState();
    const accessToken = authState.accessToken;

    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }

    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

authClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!error.response) {
      const userFacingError = getUserFacingHttpError(error);
      toast.error(userFacingError.message, {
        description: userFacingError.description,
      });
      return Promise.reject(error);
    }

    if (
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      const userFacingError = getUserFacingHttpError(error);
      toast.error(userFacingError.message, {
        description: userFacingError.description,
      });
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        (originalRequest.headers as AxiosHeaders).set(
          "Authorization",
          `Bearer ${token}`
        );
        return authClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();

      const response = await axios.post<SessionRefreshResponse>(
        `${apiBaseUrl}/identity/refresh`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token, user_id, role } = response.data;

      useAuthStore.getState().setSession({
        accessToken: access_token,
        refreshToken: refresh_token ?? useAuthStore.getState().refreshToken,
        userId: user_id,
        role,
      });

      processQueue(null, access_token);
      (originalRequest.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${access_token}`
      );

      return authClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clear();
      const userFacingError = getUserFacingHttpError(refreshError);
      toast.error(userFacingError.message, {
        description: userFacingError.description,
      });

      if (typeof window !== "undefined") {
        window.location.assign("/connexion");
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
