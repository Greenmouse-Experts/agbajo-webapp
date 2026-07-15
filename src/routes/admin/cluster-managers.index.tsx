import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  UserX,
  Eye,
  Mail,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/admin/cluster-managers/")({
  component: AdminClusterManagers,
});

type VerificationStatus = "pending" | "verified" | "rejected";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  verification_status?: VerificationStatus;
  rating?: number;
  total_groups_managed?: number;
  total_contributions_handled?: number;
  nin_number?: string;
  bvn_number?: string;
  face_image_url?: string;
  selfie_image_url?: string;
  address?: string;
}

const fullName = (m: Manager) => `${m.firstName} ${m.lastName}`.trim();
const getStatus = (m: Manager): VerificationStatus =>
  m.verification_status ?? "pending";

const defaultInviteForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
};

const StatusBadge = ({ status }: { status: VerificationStatus }) => {
  if (status === "verified")
    return <span className="badge badge-success">Verified</span>;
  if (status === "rejected")
    return <span className="badge badge-error">Rejected</span>;
  return <span className="badge badge-warning">Pending</span>;
};

const StatusIcon = ({ status }: { status: VerificationStatus }) => {
  if (status === "verified")
    return <CheckCircle className="w-5 h-5 text-success" />;
  if (status === "rejected") return <XCircle className="w-5 h-5 text-error" />;
  return <Clock className="w-5 h-5 text-warning" />;
};

const Avatar = ({
  name,
  size = "sm",
}: {
  name?: string;
  size?: "sm" | "lg";
}) => (
  <div
    className={`rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-semibold shrink-0 ${size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12"}`}
  >
    {(name?.[0] ?? "M").toUpperCase()}
  </div>
);

function AdminClusterManagers() {
  const queryClient = useQueryClient();
  const detailsModalRef = useRef<HTMLDialogElement>(null);
  const inviteModalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Manager | null>(null);
  const [inviteForm, setInviteForm] = useState(defaultInviteForm);

  const managersQuery = useQuery<ApiResponseV2<Manager[]>>({
    queryKey: ["admin", "cluster-managers"],
    queryFn: async () => {
      let resp = await apiClient.get("users/cluster-managers");
      return resp.data;
    },
  });

  const kycMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      apiClient.patch(`admin/cluster-managers/${id}/kyc`, {
        verification_status: status,
      }),
    onSuccess: () => {
      detailsModalRef.current?.close();
      queryClient.invalidateQueries({
        queryKey: ["admin", "cluster-managers"],
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (body: typeof defaultInviteForm) =>
      toast
        .promise(
          apiClient.post("auth/invitations", {
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phoneNumber: body.phoneNumber,
            roleId: 3,
          }),
          {
            loading: "Sending invitation...",
            success: "Invitation sent",
            error: extract_message,
          },
        )
        .unwrap(),
    onSuccess: () => {
      inviteModalRef.current?.close();
      setInviteForm(defaultInviteForm);
    },
  });

  // const filtered = managers.filter((m) => {
  //   const q = searchQuery.toLowerCase();
  //   const matchesSearch =
  //     fullName(m).toLowerCase().includes(q) ||
  //     m.email.toLowerCase().includes(q);
  //   const matchesStatus =
  //     statusFilter === "all" || getStatus(m) === statusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  const openDetails = (manager: Manager) => {
    setSelected(manager);
    detailsModalRef.current?.showModal();
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            Cluster Managers
          </h1>
          <p className="text-base-content/60 mt-1">
            Manage and verify cluster managers
          </p>
        </div>
        <button
          onClick={() => inviteModalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <Mail className="w-4 h-4" />
          Invite Manager
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm p-4">
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

      <PageLoader query={managersQuery}>
        {(data) => {
          const users = data.data.users as Manager[];
          return (
            <>
              {users.length === 0 ? (
                <div className="card bg-base-100 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-base-content/40" />
                  </div>
                  <h3 className="text-lg font-medium text-base-content mb-1">
                    No cluster managers found
                  </h3>
                  <p className="text-base-content/60">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((manager) => (
                    <div
                      key={manager.id}
                      className="card bg-base-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={manager.firstName} />
                          <div>
                            <h3 className="font-semibold text-base-content">
                              {fullName(manager)}
                            </h3>
                            <p className="text-sm text-base-content/60">
                              {manager.email}
                            </p>
                          </div>
                        </div>
                        <StatusIcon status={getStatus(manager)} />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-base-content/60">
                          <Calendar className="w-4 h-4" />
                          Joined{" "}
                          {new Date(manager.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-base-content/60">
                          <Star className="w-4 h-4 text-warning" />
                          Rating: {manager.rating?.toFixed(1) ?? "—"}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-base-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <p className="text-base-content/60">Groups</p>
                              <p className="font-semibold text-base-content">
                                {manager.total_groups_managed ?? 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-base-content/60">Handled</p>
                              <p className="font-semibold text-base-content">
                                ₦
                                {manager.total_contributions_handled?.toLocaleString() ??
                                  "0"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={getStatus(manager)} />
                        </div>
                      </div>

                      {getStatus(manager) === "pending" ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            className="btn btn-success btn-sm flex-1"
                            disabled={kycMutation.isPending}
                            onClick={() =>
                              kycMutation.mutate({
                                id: manager.id,
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
                                id: manager.id,
                                status: "rejected",
                              })
                            }
                          >
                            <UserX className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            className="btn btn-outline btn-sm btn-square"
                            onClick={() => openDetails(manager)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm w-full mt-4"
                          onClick={() => openDetails(manager)}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </PageLoader>

      {/* Details Modal */}
      <dialog ref={detailsModalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <h3 className="text-xl font-semibold">Manager Details</h3>

            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar name={selected.firstName} size="lg" />
                <div>
                  <h4 className="text-lg font-semibold text-base-content">
                    {fullName(selected)}
                  </h4>
                  <p className="text-base-content/60">{selected.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={getStatus(selected)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-base-200 p-4">
                  <h4 className="text-sm font-medium text-base-content mb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-base-content/60">
                      <Mail className="w-4 h-4" />
                      {selected.email}
                    </div>
                    <div className="flex items-center gap-2 text-base-content/60">
                      <Calendar className="w-4 h-4" />
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <h4 className="text-sm font-medium text-base-content mb-2">
                    Performance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/60">
                        Groups Managed
                      </span>
                      <span className="font-medium text-base-content">
                        {selected.total_groups_managed ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/60">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="font-medium text-base-content">
                          {selected.rating?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content mb-3">
                  KYC Documents
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    {
                      label: "NIN",
                      value: selected.nin_number,
                      text: (v: string | undefined) =>
                        v ? "Provided" : "Not provided",
                    },
                    {
                      label: "BVN",
                      value: selected.bvn_number,
                      text: (v: string | undefined) =>
                        v ? "Provided" : "Not provided",
                    },
                    {
                      label: "Face Image",
                      value: selected.face_image_url,
                      text: (v: string | undefined) =>
                        v ? "Uploaded" : "Missing",
                    },
                    {
                      label: "Selfie",
                      value: selected.selfie_image_url,
                      text: (v: string | undefined) =>
                        v ? "Uploaded" : "Missing",
                    },
                  ].map(({ label, value, text }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-2 rounded-lg bg-base-100"
                    >
                      <span className="text-base-content/60">{label}</span>
                      <span
                        className={`font-medium ${value ? "text-success" : "text-base-content/40"}`}
                      >
                        {text(value)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-base-100 col-span-2">
                    <span className="text-base-content/60">Address</span>
                    <span
                      className={`font-medium ${selected.address ? "text-success" : "text-base-content/40"}`}
                    >
                      {selected.address ?? "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {getStatus(selected) === "pending" && (
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

      {/* Invite Modal */}
      <dialog ref={inviteModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-xl font-semibold">Invite Cluster Manager</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Send an invitation to onboard a new manager
          </p>

          <form onSubmit={handleInvite} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">First Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="John"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                  required
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Last Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                  required
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email Address</legend>
              <input
                type="email"
                className="input w-full"
                placeholder="john@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Phone Number</legend>
              <input
                type="tel"
                className="input w-full"
                placeholder="+2348012345678"
                value={inviteForm.phoneNumber}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, phoneNumber: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => inviteModalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Send Invitation
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
