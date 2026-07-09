import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface QueryCompLayoutProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}

export default function QueryCompLayout<T>({
  query,
  children,
}: QueryCompLayoutProps<T>) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="text-center py-8 text-error text-sm">
        Failed to load data.
      </div>
    );
  }
  if (!query.data) return null;
  return <>{children(query.data)}</>;
}
