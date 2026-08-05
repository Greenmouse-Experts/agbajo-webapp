import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useReorderStore } from "#/store/reorderStore";
import { reorderSlotsApi, type GroupCycle } from "#/api/groups/groups-api.tsx";
import { extract_message } from "#/helpers/apihelpers";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";

interface Props {
  modalRef: React.RefObject<ModalHandle | null>;
  groupId: string;
  cycle: GroupCycle;
}

export default function ReorderSlotsModal({ modalRef, groupId, cycle }: Props) {
  const { slots, setSlots, moveSlotUp, moveSlotDown } = useReorderStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cycle?.slots) {
      setSlots(cycle.slots);
    }
  }, [cycle, setSlots]);

  const mutation = useMutation({
    mutationFn: () => {
      const slotOrder = slots.map((s) => s.userId);
      return toast.promise(
        reorderSlotsApi({
          groupId,
          cycleId: cycle.id,
          slotOrder,
        }),
        {
          loading: "Saving new slot order...",
          success: "Slots reordered successfully",
          error: extract_message,
        },
      ).unwrap();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-slots", groupId] });
      modalRef.current?.close();
    },
  });

  return (
    <Modal
      ref={modalRef}
      title={`Reorder Slots - Cycle #${cycle?.cycleNumber ?? 1}`}
      actions={
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => modalRef.current?.close()}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && (
              <span className="loading loading-spinner loading-xs" />
            )}
            Save Order
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-base-content/60">
          Use the up and down arrows to arrange the members in their preferred payout order.
        </p>

        <div className="divide-y divide-base-200 border border-base-200 rounded-lg max-h-96 overflow-y-auto">
          {slots.map((slot, index) => {
            const memberName = slot.user
              ? `${slot.user.firstName ?? ""} ${slot.user.lastName ?? ""}`.trim()
              : `User (${slot.userId.slice(0, 8)}...)`;
            const initials = slot.user?.firstName
              ? slot.user.firstName[0].toUpperCase()
              : "?";

            return (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 hover:bg-base-200/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs text-base-content/50 font-bold">
                    #{index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-base-content truncate">
                      {memberName}
                    </p>
                    {slot.user?.email && (
                      <p className="text-xs text-base-content/50 truncate">
                        {slot.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={index === 0}
                    onClick={() => moveSlotUp(index)}
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-base-content" />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={index === slots.length - 1}
                    onClick={() => moveSlotDown(index)}
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-base-content" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
