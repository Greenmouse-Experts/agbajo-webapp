import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Eye, UserCheck, UserX, Mail, Star, AlertCircle } from "lucide-react";
import apiClient from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";

export const Route = createFileRoute("/admin/contributors/")({
  component: AdminContributors,
});

type VerificationStatus = "pending" | "verified" | "rejected";

interface Contributor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface UsersPage {
  users: Contributor[];
  pagination: {
    limit: number;
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const StatusBadge = ({ status }: { status: VerificationStatus }) => {
  if (status === "verified")
    return <span className="badge badge-success">Verified</span>;
  if (status === "rejected")
    return <span className="badge badge-error">Rejected</span>;
  return <span className="badge badge-warning">Pending</span>;
};

const Avatar = ({
  name,
  size = "sm",
}: {
  name?: string;
  size?: "sm" | "lg";
}) => (
  <div
    className={`rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-medium shrink-0 ${size === "lg" ? "w-16 h-16 text-xl" : "w-8 h-8 text-base"}`}
  >
    {(name?.[0] ?? "C").toUpperCase()}
  </div>
);

function AdminContributors() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Contributor | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<VerificationStatus>("pending");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<UsersPage>({
      queryKey: ["admin", "contributors", searchQuery],
      queryFn: async ({ pageParam }) => {
        const params: Record<string, string | number> = { limit: 10 };
        if (searchQuery) params.search = searchQuery;
        if (pageParam) params.cursor = pageParam as string;
        const resp = await apiClient.get("/admins/users", { params });
        return resp.data.data as UsersPage;
      },
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore
          ? (lastPage.pagination.nextCursor ?? undefined)
          : undefined,
      initialPageParam: "",
    });

  const kycMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      apiClient.patch(`admin/contributors/${id}/kyc`, {
        verification_status: status,
      }),
    onSuccess: () => {
      modalRef.current?.close();
      queryClient.invalidateQueries({ queryKey: ["admin", "contributors"] });
    },
  });

  const contributors = data?.pages.flatMap((p) => p.users) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const openModal = (c: Contributor) => {
    setSelected(c);
    setSelectedStatus("pending");
    modalRef.current?.showModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Contributors</h1>
        <p className="text-base-content/60 mt-1">
          Monitor all platform contributors
          {total > 0 && (
            <span className="ml-2 badge badge-neutral">{total}</span>
          )}
        </p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : contributors.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No contributors found
          </h3>
          <p className="text-base-content/60">Try adjusting your search</p>
        </div>
      ) : (
        <>
          <div className="card bg-base-100 shadow overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((c) => (
                  <tr key={c.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.firstName} />
                        <span className="font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="text-base-content/70">{c.email}</td>
                    <td className="text-sm text-base-content/60">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => openModal(c)}
                        className="btn btn-ghost btn-sm btn-square"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <button
                className="btn btn-outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Load More
              </button>
            </div>
          )}
        </>
      )}

      <dialog ref={modalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-lg">
            <h3 className="text-xl font-semibold">Contributor Details</h3>

            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar name={selected.firstName} size="lg" />
                <div>
                  <h4 className="text-lg font-semibold">
                    {selected.firstName} {selected.lastName}
                  </h4>
                  <div className="flex items-center gap-2 text-base-content/60 mt-1">
                    <Mail className="w-4 h-4" />
                    {selected.email}
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">User ID</span>
                  <span className="font-mono text-xs text-base-content/70 truncate max-w-[60%]">
                    {selected.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Joined</span>
                  <span>{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content mb-3">
                  KYC Verification
                </h4>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-base-content/60">Status</span>
                  <StatusBadge status={selectedStatus} />
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn btn-success btn-sm flex-1"
                    disabled={kycMutation.isPending}
                    onClick={() =>
                      kycMutation.mutate({
                        id: selected.id,
                        status: "verified",
                      })
                    }
                  >
                    <UserCheck className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    className="btn btn-error btn-sm flex-1"
                    disabled={kycMutation.isPending}
                    onClick={() =>
                      kycMutation.mutate({
                        id: selected.id,
                        status: "rejected",
                      })
                    }
                  >
                    <UserX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content mb-3">
                  Performance
                </h4>
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Rating and contribution data not available</span>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost">Close</button>
              </form>
            </div>
          </div>
        )}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
