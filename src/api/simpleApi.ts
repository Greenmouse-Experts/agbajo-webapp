import axios from "axios";
import { get_user_value } from "#/store/authStore";
import { toast } from "sonner";

export interface ApiResponse<T = any> {
  message: string;
  data: T;
  // status: string;
  statusCode: number;
  path: string;
}
export interface Pagination {
  hasMore: boolean;
  limit: number;
  nextCursor: string | null;
  total: number;
}
export interface ApiResponseV2<T = any> {
  message?: string;
  data: { data: T; pagination: Pagination } & { [key: string]: any };
  // status: string;
  status: number;
  path: string;
}
export const new_url =
  import.meta.env.VITE_API_URL ?? "https://agbajo-backend.onrender.com/";

const apiClient = axios.create({
  baseURL: new_url,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const user = get_user_value();
  console.log("user_request", user);
  if (user?.sessionId) {
    config.headers.Authorization = `Bearer ${user.sessionId}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // clear_user();
      toast.info("Session expired. Please log in again.", { duration: 1500 });
      // window.location.href = "/home/auth/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
