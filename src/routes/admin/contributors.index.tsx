import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Star,
  AlertCircle,
} from "lucide-react";
import apiClient from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";

export const Route = createFileRoute("/admin/contributors/")({
  component: AdminContributors,
});

type VerificationStatus = "pending" | "verified" | "rejected";

interface Contributor {
  id: string;
  createdAt: string;
  verificationStatus: VerificationStatus;
  totalContributions: number;
  rating?: number;
  missedPayments: number;
  latePayments: number;
  ninNumber?: string;
  bvnNumber?: string;
  profile?: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}

interface UsersPage {
  users: Contributor[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const StatusBadge = ({ status }: { status: VerificationStatus }) => {
  if (status === "verified")
    return <span className="badge badge-success">Verified</span>;
  if (status === "rejected")
    return <span className="badge badge-error">Rejected</span>;
  return <span className="badge badge-warning">Pending</span>;
};

const Avatar = ({ name, size = "sm" }: { name?: string; size?: "sm" | "lg" }) => (
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Contributor | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<UsersPage>({
    queryKey: ["admin", "contributors", searchQuery],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 10 };
      if (searchQuery) params.search = searchQuery;
      if (pageParam) params.cursor = pageParam as string;
      const resp = await apiClient.get("/users", { params });
      return resp.data.data as UsersPage;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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

  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];

  const filtered = allUsers.filter((c) => {
    if (statusFilter === "all") return true;
    return c.verificationStatus === statusFilter;
  });

  const openModal = (contributor: Contributor) => {
    setSelected(contributor);
    modalRef.current?.showModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Contributors</h1>
        <p className="text-base-content mt-1">
          Monitor all platform contributors
        </p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <select
            className="select w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No contributors found
          </h3>
          <p className="text-base-content">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <>
          <div className="card bg-base-100 shadow overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Contributions</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.profile?.fullName} />
                        <span className="font-medium">
                          {c.profile?.fullName ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="text-base-content">
                      {c.profile?.email ?? "—"}
                    </td>
                    <td className="text-base-content">
                      {c.profile?.phoneNumber ?? "—"}
                    </td>
                    <td className="font-medium">
                      {formatCurrency(c.totalContributions)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {c.rating?.toFixed(1) ?? "—"}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.verificationStatus} />
                    </td>
                    <td className="text-base text-base-content">
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
          <div className="modal-box max-w-2xl">
            <h3 className="text-xl font-semibold">Contributor Details</h3>

            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar name={selected.profile?.fullName} size="lg" />
                <div>
                  <h4 className="text-lg font-semibold">
                    {selected.profile?.fullName ?? "—"}
                  </h4>
                  <p className="text-base-content">{selected.profile?.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={selected.verificationStatus} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-base-200 p-4">
                  <h4 className="text-base font-medium text-base-content mb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-base-content" />
                      {selected.profile?.phoneNumber ?? "Not provided"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-base-content" />
                      {selected.profile?.email}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <h4 className="text-base font-medium text-base-content mb-2">
                    Performance
                  </h4>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content">
                        Total Contributions
                      </span>
                      <span className="font-medium">
                        {formatCurrency(selected.totalContributions)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">
                          {selected.rating?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-base font-medium text-base-content mb-3">
                  Payment Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3 text-base">
                  <div className="p-2 rounded-lg bg-base-100">
                    <p className="text-base-content">Missed Payments</p>
                    <p className="font-medium">{selected.missedPayments}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-base-100">
                    <p className="text-base-content">Late Payments</p>
                    <p className="font-medium">{selected.latePayments}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-base font-medium text-base-content mb-3">
                  KYC Documents
                </h4>
                <div className="grid grid-cols-2 gap-3 text-base">
                  {[
                    { label: "NIN", value: selected.ninNumber },
                    { label: "BVN", value: selected.bvnNumber },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-2 rounded-lg bg-base-100"
                    >
                      <span className="text-base-content">{label}</span>
                      <span
                        className={`font-medium ${value ? "text-success" : "text-base-content"}`}
                      >
                        {value ? "Provided" : "Not provided"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.verificationStatus === "pending" && (
                <div className="flex gap-3">
                  <button
                    className="btn btn-success flex-1"
                    disabled={kycMutation.isPending}
                    onClick={() =>
                      kycMutation.mutate({
                        id: selected.id,
                        status: "verified",
                      })
                    }
                  >
                    <UserCheck className="w-4 h-4" />
                    Approve KYC
                  </button>
                  <button
                    className="btn btn-error flex-1"
                    disabled={kycMutation.isPending}
                    onClick={() =>
                      kycMutation.mutate({
                        id: selected.id,
                        status: "rejected",
                      })
                    }
                  >
                    <UserX className="w-4 h-4" />
                    Reject KYC
                  </button>
                </div>
              )}
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
