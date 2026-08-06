import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListOrdered,
  RefreshCw,
  Calendar,
  DollarSign,
  Layers,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import {
  getGroupSlotsApi,
  publishCycleApi,
  type GroupSlot,
  type GroupCycle,
  getAdminGroupSlotsApi,
  adminPublishCycleApi,
  createSlotApi,
} from "#/api/groups/groups-api.tsx";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import QueryCompLayout from "#/components/layout/QueryCompLayout";
import { extract_message } from "#/helpers/apihelpers";
import { formatCurrency, formatDate } from "#/helpers/helpers";
import ReorderSlotsModal from "#/components/groups/ReorderSlotsModal";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const columns: columnType<GroupSlot>[] = [
  {
    key: "slotOrder",
    label: "Slot",
    render: (val, slot) => (
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
          #{slot.slotOrder ?? val}
        </span>
      </div>
    ),
  },
  {
    key: "user",
    label: "Member",
    render: (_, slot) => {
      const name = slot.user
        ? `${slot.user.firstName ?? ""} ${slot.user.lastName ?? ""}`.trim()
        : slot.userId
          ? `User (${slot.userId.slice(0, 8)}...)`
          : "—";
      const initials = slot.user?.firstName
        ? slot.user.firstName[0].toUpperCase()
        : "?";
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold text-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-base-content truncate">
              {name}
            </p>
            {slot.user?.email && (
              <p className="text-xs text-base-content/50 truncate">
                {slot.user.email}
              </p>
            )}
          </div>
        </div>
      );
    },
  },

  {
    key: "payoutAmount",
    label: "Payout Amount",
    render: (val) => (
      <span className="font-semibold text-sm text-base-content">
        {val ? formatCurrency(Number(val)) : "—"}
      </span>
    ),
  },
  {
    key: "payoutDate",
    label: "Payout Date",
    render: (val) => (
      <span className="text-sm text-base-content/70">
        {val ? formatDate(val) : "—"}
      </span>
    ),
  },
  {
    key: "paidAt",
    label: "Paid At",
    render: (val) => (
      <span className="text-sm text-base-content/70">
        {val ? formatDate(val) : "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const statusStr = (val ?? "").toString().toLowerCase();
      const badgeClass =
        statusStr === "current"
          ? "badge-info"
          : statusStr === "completed" || statusStr === "paid"
            ? "badge-success"
            : statusStr === "pending"
              ? "badge-warning"
              : "badge-ghost";
      return (
        <span className={`badge ${badgeClass} badge-sm capitalize font-medium`}>
          {val ?? "—"}
        </span>
      );
    },
  },
];

interface Props {
  groupId: string;
  isAdmin?: boolean;
  viewOnly?: boolean;
  embedded?: boolean;
}

export default function GroupSlotList({
  groupId,
  isAdmin = false,
  viewOnly = false,
  embedded = false,
}: Props) {
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [showSlots, setShowSlots] = useState(embedded ? true : false);
  const reorderModalRef = useRef<ModalHandle>(null);
  const slotModalRef = useRef<ModalHandle>(null);
  const queryClient = useQueryClient();
  const [orderedMembers, setOrderedMembers] = useState<GroupMember[]>([]);

  const membersQuery = useQuery<
    ApiResponse<{ members: GroupMember[]; total: number }>
  >({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${groupId}/members`);
      return resp.data;
    },
    enabled: !viewOnly,
  });

  const members = membersQuery.data?.data?.members ?? [];

  const slotMutation = useMutation({
    mutationFn: () => {
      const memberIds = orderedMembers.map((m) => m.id);
      return toast
        .promise(createSlotApi({ groupId, memberId: memberIds }), {
          loading: "Creating slot...",
          success: "Slot created",
          error: extract_message,
        })
        .unwrap();
    },
    onSuccess: () => {
      slotModalRef.current?.close();
      setOrderedMembers([]);
      queryClient.invalidateQueries({ queryKey: ["group-slots", groupId] });
    },
  });

  const fetchPreview = async () => {
    try {
      const promise = apiClient.get(`/groups/${groupId}/cycles/preview-slots`);
      toast.promise(
        promise,
        {
          loading: "Fetching default slot arrangement...",
          success: "Default arrangement loaded",
          error: "Failed to fetch arrangement",
        }
      );
      const resp = await promise;
      const resData = resp.data?.data;
      const slotsData = Array.isArray(resData) ? resData : (Array.isArray(resData?.slots) ? resData.slots : []);
      
      const ordered = slotsData
        .map((s: any) => {
          const u = s.user || s;
          const memberId = u.id || s.userId || u.userId || s.memberId;
          return (
            members.find((m) => m.id === memberId) || {
              id: memberId,
              firstName: u.firstName || "",
              lastName: u.lastName || "",
              email: u.email || "",
            }
          );
        })
        .filter((x: any) => x && x.id);

      if (ordered.length === 0) {
        setOrderedMembers([...members]);
      } else {
        setOrderedMembers(ordered);
      }
      slotModalRef.current?.open();
    } catch (err) {
      setOrderedMembers([...members]);
      slotModalRef.current?.open();
    }
  };

  const moveSelectedUp = (index: number) => {
    if (index <= 0 || index >= orderedMembers.length) return;
    setOrderedMembers((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveSelectedDown = (index: number) => {
    if (index < 0 || index >= orderedMembers.length - 1) return;
    setOrderedMembers((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const query = useQuery({
    queryKey: ["group-slots", groupId],
    queryFn: () =>
      isAdmin
        ? getAdminGroupSlotsApi({ groupId })
        : getGroupSlotsApi({ groupId }),
  });

  const publishMutation = useMutation({
    mutationFn: (cycleId: string) =>
      toast
        .promise(
          isAdmin
            ? adminPublishCycleApi({ groupId, cycleId })
            : publishCycleApi({ groupId, cycleId }),
          {
            loading: "Publishing cycle...",
            success: "Cycle published successfully",
            error: extract_message,
          },
        )
        .unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-slots", groupId] });
    },
  });

  const slotModal = (
    <Modal
      ref={slotModalRef}
      title="Create & Order Slots"
      actions={
        <>
          <button
            className="btn btn-ghost"
            onClick={() => slotModalRef.current?.close()}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={orderedMembers.length === 0 || slotMutation.isPending}
            onClick={() => slotMutation.mutate()}
          >
            {slotMutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create ({orderedMembers.length})
          </button>
        </>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto">
        <h4 className="font-semibold text-sm mb-2 text-base-content">
          Payout Order
        </h4>
        <p className="text-xs text-base-content/60 mb-3">
          Below is the preview arrangement of slots. Use the arrows to adjust the sequence of slot payouts.
        </p>
        {orderedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-base-300 rounded-lg h-72 text-base-content/40 p-4 text-center">
            <p className="text-xs">No members in this group to arrange.</p>
          </div>
        ) : (
          <div className="divide-y divide-base-200 border border-base-200 rounded-lg p-2 max-h-96 overflow-y-auto">
            {orderedMembers.map((member, index) => {
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 hover:bg-base-200/40 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-primary w-6">
                      #{index + 1}
                    </span>
                    <div className="rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold shrink-0 w-8 h-8 text-xs">
                      {(member.firstName?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-base-content truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-base-content/50 truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
                      disabled={index === 0}
                      onClick={() => moveSelectedUp(index)}
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
                      disabled={index === orderedMembers.length - 1}
                      onClick={() => moveSelectedDown(index)}
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );

  const content = (
    <QueryCompLayout query={query}>
      {(res) => {
        const cycles: GroupCycle[] = Array.isArray(res?.data) ? res.data : [];
        if (cycles.length === 0) {
          return (
            <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
              <Layers className="w-8 h-8" />
              <p className="text-sm">No slot cycles found</p>
              {!viewOnly && (
                <button
                  className="btn btn-primary btn-sm mt-3 gap-1.5"
                  disabled={members.length < 10}
                  onClick={fetchPreview}
                >
                  <Plus className="w-4 h-4" />
                  Generate Slot
                </button>
              )}
              {slotModal}
            </div>
          );
        }

        const currentCycle = cycles[selectedCycleIndex] ?? cycles[0];
        const slots = currentCycle?.slots ?? [];

        return (
          <div className="space-y-4 py-2">
            {/* Cycle Tabs if multiple */}
            {cycles.length > 1 && (
              <div className="flex border-b border-base-200 px-5 gap-2 overflow-x-auto">
                {cycles.map((cycle, idx) => (
                  <button
                    key={cycle.id || idx}
                    onClick={() => setSelectedCycleIndex(idx)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      selectedCycleIndex === idx
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-base-content/60 hover:text-base-content"
                    }`}
                  >
                    Cycle #{cycle.cycleNumber ?? idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Cycle Overview Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-base-200/40 rounded-lg mx-5 border border-base-200">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base-content">
                  Cycle #{currentCycle.cycleNumber ?? 1}
                </span>
                <span
                  className={`badge badge-sm capitalize ${
                    currentCycle.status === "active"
                      ? "badge-info"
                      : currentCycle.status === "completed"
                        ? "badge-success"
                        : "badge-warning"
                  }`}
                >
                  {currentCycle.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                {currentCycle.totalPoolAmount && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-base-content/40" />
                    <span>Pool:</span>
                    <span className="font-semibold text-base-content">
                      {formatCurrency(Number(currentCycle.totalPoolAmount))}
                    </span>
                  </div>
                )}
                {currentCycle.startDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-base-content/40" />
                    <span>Start:</span>
                    <span className="font-medium text-base-content">
                      {formatDate(currentCycle.startDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span>Slots:</span>
                  <span className="badge badge-neutral badge-sm">
                    {slots.length}
                  </span>
                </div>

                {!viewOnly && (
                  <div className="flex items-center gap-2 ml-auto">
                    {currentCycle.status === "pending" ? (
                      <>
                        <button
                          className="btn btn-xs btn-outline gap-1"
                          onClick={() => reorderModalRef.current?.open()}
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          Reorder Slots
                        </button>
                        <button
                          className="btn btn-xs btn-primary gap-1"
                          disabled={publishMutation.isPending}
                          onClick={() =>
                            publishMutation.mutate(currentCycle.id)
                          }
                        >
                          {publishMutation.isPending ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Publish Cycle
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-xs btn-primary gap-1"
                        disabled={members.length < 10}
                        onClick={fetchPreview}
                      >
                        <Plus className="w-3 h-3" />
                        Generate Slot
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Table View */}
            {slots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
                <ListOrdered className="w-8 h-8" />
                <p className="text-sm">No slots in this cycle</p>
              </div>
            ) : (
              <div className="px-5">
                {showSlots && (
                  <CustomTable data={slots} columns={columns} ring={false} />
                )}
              </div>
            )}

            {/* Reorder Slots Modal */}
            <ReorderSlotsModal
              modalRef={reorderModalRef}
              groupId={groupId}
              cycle={currentCycle}
            />

            {/* Generate Slots Modal */}
            {slotModal}
          </div>
        );
      }}
    </QueryCompLayout>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <div className="flex items-center gap-2 w-full">
          <ListOrdered className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base-content text-lg">
            Group Slots
          </h3>
          {query.isFetching && !query.isLoading && (
            <RefreshCw className="w-4 h-4 text-base-content/40 animate-spin" />
          )}
          <button
            className="btn btn-sm btn-soft btn-primary ml-auto ring fade"
            onClick={() => setShowSlots((s) => !s)}
          >
            {showSlots ? "Hide" : "View"}
          </button>
        </div>
      </div>

      {content}
    </div>
  );
}
