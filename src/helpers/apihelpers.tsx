import type { ApiResponse } from "@/api/simpleApi";
import type { AxiosError } from "axios";
import axios from "axios";

interface ValidationError {
  field: string;
  message: string;
}

const format_errors = (body: Record<string, unknown>): string | null => {
  const errors = body.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  return (errors as ValidationError[])
    .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
    .join("\n");
};

export const extract_message = (data: unknown): string => {
  if (axios.isAxiosError(data)) {
    const body = (data as AxiosError<ApiResponse>).response?.data as
      | Record<string, unknown>
      | undefined;
    if (body) {
      const fromErrors = format_errors(body);
      if (fromErrors) return fromErrors;
      const msg = body.message;
      if (Array.isArray(msg)) return msg.join(", ");
      if (typeof msg === "string") return msg;
    }
    return (data as AxiosError).message ?? "An error occurred";
  }

  if (data !== null && typeof data === "object") {
    const body = data as Record<string, unknown>;
    const fromErrors = format_errors(body);
    if (fromErrors) return fromErrors;
    const msg = body.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
  }

  if (typeof data === "string") return data;

  return "";
};
