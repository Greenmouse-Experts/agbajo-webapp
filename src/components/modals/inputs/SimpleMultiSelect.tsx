import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { RecordModel } from "pocketbase";
import { useForm, useFormContext } from "react-hook-form";
import apiClient, {
  type ApiResponse,
  type ApiResponseV2,
} from "@/api/simpleApi";
import QueryCompLayout from "@/components/layout/QueryCompLayout";

interface SimpleMultiSelectProps<T = any> extends PropsWithChildren {
  route: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  name?: string;
  render: (item: T, index: number) => React.ReactNode;
}

export default function SimpleMultiSelect<
  T extends ApiResponse | ApiResponse<T[]> | ApiResponse<T[]>,
>(props: SimpleMultiSelectProps<T>) {
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

  const query = useQuery<ApiResponse<T[] | ApiResponseV2<T[]>>>({
    queryKey: ["select", route],
    queryFn: async () => {
      let resp = await apiClient.get(route);
      return resp.data;
    },
  });
  const internalForm = useForm();

  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (internalValue !== value && onChange) {
      onChange(internalValue);
    }
  }, [internalValue, onChange, value]);
  // const items: T[] = query.data?.data ?? [];
  return (
    <QueryCompLayout query={query}>
      {(data) => {
        const items: T[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data.data)
            ? data?.data.data
            : [];
        return (
          <>
            <div className="w-full space-y-2">
              {label && (
                <div className="fieldset-label font-semibold">
                  <span className="text-sm">{label}</span>
                </div>
              )}
              {items.map((item, idx) => render(item, idx))}
              {error && (
                <p className="text-error text-sm mt-1">
                  {error.message as string}
                </p>
              )}
            </div>
          </>
        );
      }}
    </QueryCompLayout>
  );
}
