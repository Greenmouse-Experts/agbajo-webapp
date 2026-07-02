import type { ApiResponse } from "@/api/simpleApi";
import type { AxiosError } from "axios";
import axios from "axios";

export const extract_message = (data: unknown): string => {
  // Axios error — pull from response body
  if (axios.isAxiosError(data)) {
    const msg = (data as AxiosError<ApiResponse>).response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    return msg ?? (data as AxiosError).message ?? "An error occurred";
  }

  // Plain API response shape: { message: string, ... }
  if (data !== null && typeof data === "object") {
    const msg = (data as Record<string, unknown>).message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
  }

  if (typeof data === "string") return data;

  return "";
};
