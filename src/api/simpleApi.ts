import axios from "axios";
import { get_user_value, clear_user } from "#/store/authStore";
import { toast } from "sonner";

export interface ApiResponse<T = any> {
  message: string;
  data: T;
  // status: string;
  statusCode: number;
  path: string;
}
export interface ApiResponseV2<T = any> {
  message: string;
  data: { data: T; meta: any };
  // status: string;
  statusCode: number;
  path: string;
}
export const new_url = "https://agbajo-backend.onrender.com/";
const apiClient = axios.create({
  baseURL: new_url,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const user = get_user_value();
  if (user?.sessionId) {
    config.headers.key = user.sessionId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clear_user();
      toast.info("Session expired. Please log in again.", { duration: 1500 });
      // window.location.href = "/home/auth/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
