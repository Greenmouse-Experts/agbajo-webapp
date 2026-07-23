import { useQuery } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";
import type { ApiResponse } from "@/api/simpleApi";
import apiClient from "@/api/simpleApi";

interface SimpleSelectProps<T = any> extends PropsWithChildren {
  route: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  name?: string;
  render: (item: T, index: number) => React.ReactNode;
  extractItems?: (data: any) => T[];
}

export default function SimpleSelect<
  T extends ApiResponse | ApiResponse<T[]> | ApiResponse<T[]>,
>(props: SimpleSelectProps<T>) {
  const { route, value, onChange, label, name, render, extractItems } = props;

  // ✅ SAFE: prevents crash when no FormProvider exists
  let formState: any = null;
  try {
    formState = useFormContext()?.formState;
  } catch {
    formState = null;
  }

  const error = name && formState ? formState.errors?.[name] : undefined;

  // Controlled when a `value` prop is supplied; otherwise fall back to local state.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | null>(null);
  const currentValue = isControlled ? (value ?? null) : internalValue;

  const query = useQuery<ApiResponse<T[]>>({
    queryKey: ["select", route],
    queryFn: async () => {
      let resp = await apiClient.get(route);
      return resp.data;
    },
  });

  const handleChange = (next: string | null) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  if (query.isLoading)
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={`select-${route}`}
            className="mb-2 fieldset-label font-semibold"
          >
            <span className="text-sm">{label}</span>
          </label>
        )}
        <select
          disabled
          name={name || `select-${route}`}
          className="select select-md w-full select-bordered"
          id={`select-${route}`}
        >
          <option value="">Loading...</option>
        </select>
      </div>
    );
  if (query.isError)
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={`select-${route}`}
            className="mb-2 fieldset-label font-semibold"
          >
            <span className="text-sm">{label}</span>
          </label>
        )}
        <select
          disabled
          name={name || `select-${route}`}
          className="select select-md w-full select-bordered border-error"
          id={`select-${route}`}
        >
          <option value="">Error loading options</option>
        </select>
      </div>
    );

  const raw = query.data?.data as any;
  const items: T[] = extractItems
    ? extractItems(raw)
    : Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="fieldset-label font-semibold">
          <span className="text-sm">{label}</span>
        </div>
      )}
      <select
        value={currentValue === null ? "null" : currentValue}
        onChange={(e) =>
          handleChange(e.target.value === "null" ? null : e.target.value)
        }
        className={`select select-md w-full select-bordered ${error ? "select-error" : ""}`}
        id={`select-${route}`}
        name={name || `select-${route}`}
      >
        <option value="null" disabled>
          None
        </option>
        {/*{JSON.stringify(items)}*/}
        {items.map((item, idx) => render(item, idx))}
      </select>
      {error && (
        <p className="text-error text-sm mt-1">{error.message as string}</p>
      )}
    </div>
  );
}
