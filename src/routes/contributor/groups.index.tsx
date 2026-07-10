import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  Calendar,
  Star,
  AlertCircle,
  Plus,
  Search,
  LogIn,
} from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import { formatCurrency } from "#/helpers/currency";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { toast } from "sonner";

export const Route = createFileRoute("/contributor/groups/")({
  component: ContributorGroups,
});

type MemberStatus = "active" | "pending" | "suspended" | "removed";
type ContributionFrequency = "daily" | "weekly" | "monthly";

interface MyGroup {
  id: string;
  group_name: string;
  manager: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  current_cycle: number;
  member_status: MemberStatus;
}

interface PublicGroup {
  id: string;
  group_name: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  member_count: number;
  manager?: string;
}

const statusBadge: Record<MemberStatus, string> = {
  active: "badge-success",
  pending: "badge-warning",
  suspended: "badge-error",
  removed: "badge-neutral",
};

function ContributorGroups() {
  const discoverModalRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const { data: myGroups = [], isLoading } = useQuery({
    queryKey: ["contributor", "groups"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<MyGroup[]>>("contributor/groups")
        .then((r) => r.data.data),
  });

  const { data: publicGroups = [], isLoading: discoverLoading } = useQuery({
    queryKey: ["groups", "public", search],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PublicGroup[]>>("groups", {
          params: { type: "public", search: search || undefined },
        })
        .then((r) => r.data.data),
    enabled: true,
  });

  const requestJoinMutation = useMutation({
    mutationFn: (groupId: string) =>
      toast
        .promise(apiClient.post(`groups/${groupId}/request-join`), {
          loading: "Sending request...",
          success: "Join request sent",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: (_, groupId) => {
      setRequestedIds((prev) => new Set(prev).add(groupId));
    },
  });

  const myGroupIds = new Set(myGroups.map((g) => g.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Groups"
        subtitle="Groups you are participating in"
        action={
          <button
            className="btn btn-primary"
            onClick={() => discoverModalRef.current?.showModal()}
          >
            <Plus className="w-4 h-4" />
            Join a Group
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : myGroups.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No groups yet"
          description="Join a group or wait to be added by your cluster manager."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {myGroups.map((group) => (
            <div
              key={group.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <span className="text-primary-content font-bold text-xl">
                      {group.group_name.charAt(0)}
                    </span>
                  </div>
                  <span
                    className={`badge ${statusBadge[group.member_status]} capitalize`}
                  >
                    {group.member_status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-base-content">
                    {group.group_name}
                  </h3>
                  <p className="text-base text-base-content mt-0.5">
                    Managed by {group.manager}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-base-200 p-3">
                    <div className="flex items-center gap-1.5 text-base-content mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-sm">Amount</span>
                    </div>
                    <p className="font-semibold text-base-content text-base">
                      {formatCurrency(group.contribution_amount)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-base-200 p-3">
                    <div className="flex items-center gap-1.5 text-base-content mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-sm">Frequency</span>
                    </div>
                    <p className="font-semibold text-base-content text-base capitalize">
                      {group.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-base-200">
                  <div className="flex items-center gap-1.5 text-base-content">
                    <Users className="w-4 h-4" />
                    <span className="text-base">{group.max_members} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-base font-medium text-base-content">
                      Cycle {group.current_cycle}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog ref={discoverModalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="text-xl font-semibold text-base-content">
            Discover Groups
          </h3>
          <p className="text-base text-base-content mt-1">
            Browse public groups and request to join
          </p>

          <label className="input w-full mt-4">
            <Search className="w-4 h-4 text-base-content" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {discoverLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : publicGroups.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                No public groups found
              </div>
            ) : (
              publicGroups.map((group) => {
                const alreadyMember = myGroupIds.has(group.id);
                const requested = requestedIds.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-base-200 hover:bg-base-200/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <span className="text-primary-content font-bold">
                        {group.group_name.charAt(0)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-base-content truncate">
                        {group.group_name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-base-content/70">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(group.contribution_amount)}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Calendar className="w-3 h-3" />
                          {group.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.member_count}/{group.max_members}
                        </span>
                      </div>
                    </div>

                    {alreadyMember ? (
                      <span className="badge badge-success shrink-0">
                        Member
                      </span>
                    ) : requested ? (
                      <span className="badge badge-warning shrink-0">
                        Requested
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm shrink-0"
                        disabled={requestJoinMutation.isPending}
                        onClick={() => requestJoinMutation.mutate(group.id)}
                      >
                        <LogIn className="w-4 h-4" />
                        Join
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
