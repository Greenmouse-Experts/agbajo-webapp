import { useNavigate, useSearch } from "@tanstack/react-router";

export const usePagination = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  const page = Number((search as any).page) || 1;
  const pageSize = Number((search as any).pageSize) || 10;

  const setPagination = (newPage: number, newPageSize?: number) => {
    navigate({
      //@ts-ignore
      search: (prev: any) => ({
        ...prev,
        page: newPage,
        pageSize: newPageSize ?? prev.pageSize,
      }),
    });
  };

  return {
    page,
    pageSize,
    setPagination,
  };
};
