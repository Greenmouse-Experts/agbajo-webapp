import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { RecordModel } from "pocketbase";
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
}

export default function SimpleSelect<
  T extends ApiResponse | ApiResponse<T[]> | ApiResponse<T[]>,
>(props: SimpleSelectProps<T>) {
  const { route, value, onChange, label, name, render } = props;

  // ✅ SAFE: prevents crash when no FormProvider exists
  let formState: any = null;
  try {
    formState = useFormContext()?.formState;
  } catch {
    formState = null;
  }

  const error = name && formState ? formState.errors?.[name] : undefined;

  const [internalValue, setInternalValue] = useState<string | null>(
    value ?? null,
  );

  const query = useQuery<ApiResponse<T[]>>({
    queryKey: ["select", route],
    queryFn: async () => {
      let resp = await apiClient.get(route);
      return resp.data;
    },
  });

  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    console.log(internalValue);
    if (internalValue !== value && onChange) {
      onChange(internalValue);
    }
  }, [internalValue, onChange, value]);

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

  const data = query.data;
  const items: T[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data.data)
      ? data?.data.data
      : [];

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="fieldset-label font-semibold">
          <span className="text-sm">{label}</span>
        </div>
      )}
      <select
        value={internalValue === null ? "null" : internalValue}
        onChange={(e) => {
          const newValue = e.target.value === "null" ? null : e.target.value;
          setInternalValue(newValue);
        }}
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
