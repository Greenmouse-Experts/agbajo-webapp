import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Eye,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Star,
  AlertCircle,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/admin/contributors/")({
  component: AdminContributors,
});

type VerificationStatus = "pending" | "verified" | "rejected";

interface Contributor {
  id: string;
  created_at: string;
  verification_status: VerificationStatus;
  total_contributions: number;
  rating?: number;
  missed_payments: number;
  late_payments: number;
  nin_number?: string;
  bvn_number?: string;
  profile?: {
    full_name: string;
    email: string;
    phone_number?: string;
  };
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
    className={`rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-medium shrink-0 ${size === "lg" ? "w-16 h-16 text-xl" : "w-8 h-8 text-sm"}`}
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

  const { data: contributors = [], isLoading } = useQuery({
    queryKey: ["admin", "contributors"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Contributor[]>>("admin/contributors")
        .then((r) => r.data.data),
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

  const filtered = contributors.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.profile?.full_name?.toLowerCase().includes(q) ||
      c.profile?.email?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (contributor: Contributor) => {
    setSelected(contributor);
    modalRef.current?.showModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Contributors</h1>
        <p className="text-base-content/60 mt-1">
          Monitor all platform contributors
        </p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
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
            <AlertCircle className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No contributors found
          </h3>
          <p className="text-base-content/60">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
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
                      <Avatar name={c.profile?.full_name} />
                      <span className="font-medium">
                        {c.profile?.full_name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-base-content/70">
                    {c.profile?.email ?? "—"}
                  </td>
                  <td className="text-base-content/70">
                    {c.profile?.phone_number ?? "—"}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(c.total_contributions)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {c.rating?.toFixed(1) ?? "—"}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.verification_status} />
                  </td>
                  <td className="text-sm text-base-content/60">
                    {new Date(c.created_at).toLocaleDateString()}
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
      )}

      <dialog ref={modalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <h3 className="text-xl font-semibold">Contributor Details</h3>

            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar name={selected.profile?.full_name} size="lg" />
                <div>
                  <h4 className="text-lg font-semibold">
                    {selected.profile?.full_name ?? "—"}
                  </h4>
                  <p className="text-base-content/60">{selected.profile?.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={selected.verification_status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-base-200 p-4">
                  <h4 className="text-sm font-medium text-base-content/60 mb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-base-content/40" />
                      {selected.profile?.phone_number ?? "Not provided"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-base-content/40" />
                      {selected.profile?.email}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <h4 className="text-sm font-medium text-base-content/60 mb-2">
                    Performance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/60">
                        Total Contributions
                      </span>
                      <span className="font-medium">
                        {formatCurrency(selected.total_contributions)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/60">Rating</span>
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
                <h4 className="text-sm font-medium text-base-content/60 mb-3">
                  Payment Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-base-100">
                    <p className="text-base-content/60">Missed Payments</p>
                    <p className="font-medium">{selected.missed_payments}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-base-100">
                    <p className="text-base-content/60">Late Payments</p>
                    <p className="font-medium">{selected.late_payments}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content/60 mb-3">
                  KYC Documents
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "NIN", value: selected.nin_number },
                    { label: "BVN", value: selected.bvn_number },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-2 rounded-lg bg-base-100"
                    >
                      <span className="text-base-content/60">{label}</span>
                      <span
                        className={`font-medium ${value ? "text-success" : "text-base-content/40"}`}
                      >
                        {value ? "Provided" : "Not provided"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.verification_status === "pending" && (
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
