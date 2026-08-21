import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
  withCredentials: true,
});
let refresh: Promise<unknown> | undefined;
export function refreshSession() {
  refresh ??= apiClient
    .post("/auth/refresh", undefined, { timeout: 10_000 })
    .finally(() => {
      refresh = undefined;
    });
  return refresh;
}
apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as
    | (InternalAxiosRequestConfig & { retried?: boolean })
    | undefined;
  if (
    error.response?.status !== 401 ||
    !request ||
    request.retried ||
    request.url?.startsWith("/auth/")
  )
    throw error;
  request.retried = true;
  await refreshSession();
  return apiClient(request);
});
