import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListOrdered,
  RefreshCw,
  Calendar,
  DollarSign,
  Layers,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  getGroupSlotsApi,
  publishCycleApi,
  type GroupSlot,
  type GroupCycle,
} from "#/api/groups/groups-api.tsx";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import QueryCompLayout from "#/components/layout/QueryCompLayout";
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["group-slots", groupId],
    queryFn: () => getGroupSlotsApi({ groupId }),
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
                  ring={false}
                />
              )}
            </div>
          );
        }}
      </QueryCompLayout>
    </div>
  );
}
