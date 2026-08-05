import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  DollarSign,
  Users,
  UserPlus,
  Edit2,
  Check,
  X,
  Mail,
} from "lucide-react";
import { formatCurrency, formatDate } from "#/helpers/helpers";
import type { GroupDetail } from "#/types/groups";
import apiClient from "#/api/simpleApi";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";

interface Props {
  group: GroupDetail;
  isOwner?: boolean;
  isAdmin?: boolean;
  onInvite?: () => void;
}

export default function MyGroupHeaderDetails({
  group,
  isOwner,
  isAdmin = false,
  onInvite,
}: Props) {
  const queryClient = useQueryClient();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newStartDate, setNewStartDate] = useState("");

  const inviteEmailModalRef = useRef<HTMLDialogElement>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const updateDateMutation = useMutation({
    mutationFn: async (dateVal: string) => {
      const payload = {
        groupName: group.groupName,
        contributionAmount: Number(group.contributionAmount),
        frequency: group.frequency,
        frequencyAmount: group.frequencyAmount,
        minMembers: group.minMembers,
        startDate: new Date(dateVal).toISOString(),
        type: group.type,
      };
      const req = apiClient.patch(`/groups/${group.id}`, payload);
      toast.promise(req, {
        loading: "Updating start date...",
        success: "Start date updated successfully",
        error: (err: any) =>
          err?.response?.data?.message || "Failed to update start date",
      });
      const resp = await req;
      return resp.data;
    },
    onSuccess: () => {
      setIsEditingDate(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "group", group.id] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (body: typeof inviteForm) =>
      apiClient.post(`groups/${group.id}/email-invitations`, body),
    onSuccess: () => {
      inviteEmailModalRef.current?.close();
      toast.success("Invitation sent successfully");
      setInviteForm({ email: "", firstName: "", lastName: "" });
    },
    onError: (error: any) => {
      console.log(error, "error");
      return toast.error(extract_message(error));
    },
  });

  const handleSaveDate = () => {
    if (!newStartDate) return;
    updateDateMutation.mutate(newStartDate);
  };

  const handleInviteByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  return (
    <div className="card bg-base-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge badge-primary capitalize">{group.type}</span>
            <span className="badge badge-outline capitalize">
              {group.frequency}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-base-content">
            {group.groupName}
          </h1>
          <p className="text-sm text-base-content/50 mt-1">
            Created {formatDate(group.createdAt)}
          </p>
        </div>
        {isOwner && onInvite && (
          <div className="flex gap-2 shrink-0">
            <button
              className="btn btn-outline btn-primary"
              onClick={() => inviteEmailModalRef.current?.showModal()}
            >
              <Mail className="w-4 h-4" />
              Email Invite
            </button>
            <button className="btn btn-primary" onClick={onInvite}>
              <UserPlus className="w-4 h-4" />
              Invite Members
            </button>
          </div>
        )}
      </div>

      <div className="divider my-4" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        {[
          {
            icon: <></>,
            label: "Contribution",
            value: (
              <p className="font-semibold text-base-content capitalize">
                {formatCurrency(Number(group.contributionAmount))}
              </p>
            ),
          },
          {
            icon: <></>,
            label: "Per Interval",
            value: (
              <p className="font-semibold text-base-content capitalize">
                {formatCurrency(group.frequencyAmount)}
              </p>
            ),
          },
          {
            icon: <Users className="w-3.5 h-3.5" />,
            label: "Min Members",
            value: (
              <p className="font-semibold text-base-content capitalize">
                {group.minMembers}
              </p>
            ),
          },
          {
            icon: <Calendar className="w-3.5 h-3.5" />,
            label: "Start Date",
            value: isEditingDate ? (
              <div
                className="flex items-center gap-1 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="input input-bordered input-xs max-w-[130px] bg-base-100 text-base-content"
                />
                <button
                  onClick={handleSaveDate}
                  className="btn btn-ghost btn-xs btn-square text-success"
                  disabled={updateDateMutation.isPending}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingDate(false)}
                  className="btn btn-ghost btn-xs btn-square text-error"
                  disabled={updateDateMutation.isPending}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 group">
                <span className="font-semibold text-base-content capitalize">
                  {formatDate(group.startDate)}
                </span>
                {isOwner && (
                  <button
                    onClick={() => {
                      setNewStartDate(
                        new Date(group.startDate).toISOString().split("T")[0],
                      );
                      setIsEditingDate(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-xs btn-square p-0 w-5 h-5 min-h-0"
                    title="Edit Start Date"
                  >
                    <Edit2 className="w-3 h-3 text-primary" />
                  </button>
                )}
              </div>
            ),
          },
        ].map(({ icon, label, value }) => (
          <div key={label}>
            <div className="flex items-center gap-1 text-xs text-base-content/50 uppercase tracking-wide mb-1">
              {icon}
              {label}
            </div>
            {value}
          </div>
        ))}
      </div>

      <dialog ref={inviteEmailModalRef} className="modal">
        <div className="modal-box bg-base-100 text-base-content">
          <h3 className="text-xl font-semibold">Invite Member</h3>
          <p className="text-base text-base-content/60 mt-1">
            Invite a contributor to this group by email
          </p>

          <form onSubmit={handleInviteByEmail} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">First Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Jane"
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
                placeholder="contributor@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => inviteEmailModalRef.current?.close()}
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
