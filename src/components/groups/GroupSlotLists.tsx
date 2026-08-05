import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListOrdered,
  RefreshCw,
  Calendar,
  DollarSign,
  Layers,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  getGroupSlotsApi,
  publishCycleApi,
  getCycleDetailsApi,
  type GroupSlot,
  type GroupCycle,
} from "#/api/groups/groups-api.tsx";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import type { Actions } from "#/components/tables/pop-up";
import QueryCompLayout from "#/components/layout/QueryCompLayout";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { extract_message } from "#/helpers/apihelpers";
import { formatCurrency, formatDate } from "#/helpers/helpers";

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
    key: "userId",
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
}

export default function GroupSlotList({ groupId }: Props) {
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [viewingCycleId, setViewingCycleId] = useState<string | null>(null);
  const cycleDetailsModalRef = useRef<ModalHandle>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["group-slots", groupId],
    queryFn: () => getGroupSlotsApi({ groupId }),
  });

  const cycleDetailsQuery = useQuery({
    queryKey: ["cycle-details", groupId, viewingCycleId],
    queryFn: () =>
      viewingCycleId
        ? getCycleDetailsApi({ groupId, cycleId: viewingCycleId })
        : Promise.reject("No cycle selected"),
    enabled: !!viewingCycleId,
    staleTime: 0,
    gcTime: 0,
  });

  const publishMutation = useMutation({
    mutationFn: (cycleId: string) =>
      toast
        .promise(publishCycleApi({ groupId, cycleId }), {
          loading: "Publishing cycle...",
          success: "Cycle published successfully",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-slots", groupId] });
    },
  });

  const handleOpenCycleDetails = (cycleId: string) => {
    setViewingCycleId(cycleId);
    cycleDetailsModalRef.current?.open();
  };

  const handleCloseCycleDetails = () => {
    cycleDetailsModalRef.current?.close();
    setViewingCycleId(null);
  };

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base-content text-lg">
            Group Slots
          </h3>
        </div>
        {query.isFetching && !query.isLoading && (
          <RefreshCw className="w-4 h-4 text-base-content/40 animate-spin" />
        )}
      </div>

      {/* Content */}
      <QueryCompLayout query={query}>
        {(res) => {
          const cycles: GroupCycle[] = Array.isArray(res?.data) ? res.data : [];
          if (cycles.length === 0) {
            return (
              <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
                <Layers className="w-8 h-8" />
                <p className="text-sm">No slot cycles found</p>
              </div>
            );
          }

          const currentCycle = cycles[selectedCycleIndex] ?? cycles[0];
          const slots = currentCycle?.slots ?? [];

          const tableActions: Actions<GroupSlot>[] = [
            {
              key: "view-cycle-details",
              label: "View Cycle Details",
              render: () => (
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </div>
              ),
              action: (slot) => {
                handleOpenCycleDetails(slot.cycleId || currentCycle.id);
              },
            },
            {
              key: "publish-cycle",
              label: "Publish Cycle",
              disabled: () => currentCycle.status !== "pending",
              render: () => (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Cycle</span>
                </div>
              ),
              action: (slot) => {
                publishMutation.mutate(slot.cycleId || currentCycle.id);
              },
            },
          ];

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

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      className="btn btn-xs btn-outline gap-1"
                      onClick={() => handleOpenCycleDetails(currentCycle.id)}
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </button>
                    {currentCycle.status === "pending" && (
                      <button
                        className="btn btn-xs btn-primary gap-1"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate(currentCycle.id)}
                      >
                        {publishMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Publish Cycle
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Table */}
              {slots.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
                  <ListOrdered className="w-8 h-8" />
                  <p className="text-sm">No slots in this cycle</p>
                </div>
              ) : (
                <CustomTable
                  data={slots}
                  columns={columns}
                  actions={tableActions}
                  ring={false}
                />
              )}
            </div>
          );
        }}
      </QueryCompLayout>

      {/* Cycle Details Modal */}
      <Modal
        ref={cycleDetailsModalRef}
        title={
          cycleDetailsQuery.data?.data
            ? `Cycle Details (#${cycleDetailsQuery.data.data.cycleNumber})`
            : "Cycle Details"
        }
        actions={
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCloseCycleDetails}
          >
            Close
          </button>
        }
      >
        {cycleDetailsQuery.isFetching || cycleDetailsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-base-content/60">
            <span className="loading loading-spinner loading-md text-primary" />
            <p className="text-xs">Fetching cycle details...</p>
          </div>
        ) : (
          <QueryCompLayout query={cycleDetailsQuery}>
            {(res) => {
              const details = res?.data;
              if (!details) return null;
              return (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Cycle ID
                      </span>
                      <p className="font-mono text-xs text-base-content break-all mt-0.5">
                        {details.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Group ID
                      </span>
                      <p className="font-mono text-xs text-base-content break-all mt-0.5">
                        {details.groupId}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Cycle Number
                      </span>
                      <p className="font-semibold text-base-content mt-0.5">
                        Cycle #{details.cycleNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Status
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`badge badge-sm capitalize ${
                            details.status === "active"
                              ? "badge-info"
                              : details.status === "completed"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {details.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Total Pool Amount
                      </span>
                      <p className="font-semibold text-base-content mt-0.5">
                        {details.totalPoolAmount
                          ? formatCurrency(Number(details.totalPoolAmount))
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Start Date
                      </span>
                      <p className="font-medium text-base-content mt-0.5">
                        {details.startDate ? formatDate(details.startDate) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Created At
                      </span>
                      <p className="text-xs text-base-content/70 mt-0.5">
                        {details.createdAt ? formatDate(details.createdAt) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-base-content/50 uppercase font-semibold">
                        Updated At
                      </span>
                      <p className="text-xs text-base-content/70 mt-0.5">
                        {details.updatedAt ? formatDate(details.updatedAt) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Slots Summary */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-base-content">
                      Slots ({details.slots?.length ?? 0})
                    </h4>
                    <div className="divide-y divide-base-200 max-h-56 overflow-y-auto border border-base-200 rounded-lg">
                      {details.slots?.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              #{s.slotOrder}
                            </span>
                            <span className="text-base-content font-medium">
                              {s.user
                                ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim()
                                : `User (${s.userId.slice(0, 8)}...)`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.deductions && s.deductions.length > 0 && (
                              <span className="badge badge-warning badge-xs">
                                {s.deductions.length} deduction
                                {s.deductions.length > 1 ? "s" : ""}
                              </span>
                            )}
                            <span className="font-semibold text-base-content">
                              {formatCurrency(Number(s.payoutAmount))}
                            </span>
                            <span className="badge badge-ghost badge-xs capitalize">
                              {s.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }}
          </QueryCompLayout>
        )}
      </Modal>
    </div>
  );
}
