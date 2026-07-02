import { usePagination } from "@/store/pagination";
import { useQuery } from "@tanstack/react-query";
import SimplePaginator from "../SimplePaginator";
import type { ApiResponse } from "@/api/simpleApi";
import apiClient from "@/api/simpleApi";
import EmptyList from "../EmptyList";
import useSelect from "@/helpers/selectors";

interface ModalSelectorProps {
  route: string;
  render: (data: any) => any;
  render_props?: {
    onchange: (item: any) => any;
  };
}

export default function ModalSelector(props: ModalSelectorProps) {
  const pages = usePagination();
  const query = useQuery<ApiResponse<any[]>>({
    queryKey: ["modal-selector", props.route, pages.page],
    queryFn: async () => {
      let resp = await apiClient.get(props.route, {
        params: {
          page: pages.page,
        },
      });
      return resp.data;
    },
    enabled: !!props.route,
  });
  if (query.isLoading) return <div>Loading...</div>;
  if (query.isError) return <div>Error...</div>;
  return (
    <div className="py-4 space-y-6 mt-3">
      <div className="rounded-md bg-base-300">
        <ul className="space-y-2 p-2">
          {query.data?.data?.map((item) => (
            <li>{props.render(item)}</li>
          ))}
          <EmptyList list={query?.data?.data as any} />
        </ul>
      </div>
      {/*<SimplePaginator {...pages} />*/}
    </div>
  );
}
