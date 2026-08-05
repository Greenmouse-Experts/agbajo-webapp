import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  RefreshCw,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { useAuth, type AUTHRECORD } from "#/store/authStore";
import { createSlotApi, getGroupSlotsApi } from "#/api/groups/groups-api.tsx";
import { extract_message } from "#/helpers/apihelpers";
import ReorderSlotsModal from "#/components/groups/ReorderSlotsModal";

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  groupId: string;
  queryScope?: string;
  embedded?: boolean;
  ownerId?: string;
}

const columns: columnType<GroupMember>[] = [
  {
    key: "firstName",
    label: "Name",
    render: (_, m) => (
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold shrink-0 w-9 h-9 text-sm">
          {(m.firstName?.[0] ?? "?").toUpperCase()}
        </div>
        <span className="font-medium text-base-content">
          {m.firstName} {m.lastName}
        </span>
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (val) => (
      <span className="text-sm text-base-content/60">{val}</span>
    ),
  },
  {
    key: "slot",
    label: "Slot",
    render: (val) => (
      <span className="text-sm text-base-content/60">{val}</span>
    ),
  },
];

export default function GroupMembersList({
  groupId,
  queryScope = "group",
  embedded = false,
  ownerId,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const slotModalRef = useRef<ModalHandle>(null);
  const reorderModalRef = useRef<ModalHandle>(null);
  const queryClient = useQueryClient();
  const [rawUser] = useAuth();
  const authUser = rawUser as AUTHRECORD | null;
  const isOwner = !!ownerId && String(authUser?.user?.id) === String(ownerId);

  const membersQuery = useQuery<
    ApiResponse<{ members: GroupMember[]; total: number }>
  >({
    queryKey: [queryScope, groupId, "members", search],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${groupId}/members`, {
        params: search ? { search } : {},
      });
      return resp.data;
    },
  });

  const slotsQuery = useQuery({
    queryKey: ["group-slots", groupId],
    queryFn: () => getGroupSlotsApi({ groupId }),
  });

  const cycles = Array.isArray(slotsQuery.data?.data)
    ? slotsQuery.data.data
    : [];
  const currentCycle = cycles[0];

  const slotMutation = useMutation({
    mutationFn: () =>
      toast
        .promise(createSlotApi({ groupId, memberId: selectedIds }), {
          loading: "Creating slot...",
          success: "Slot created",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      slotModalRef.current?.close();
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: [queryScope, groupId] });
    },
  });

  const members = membersQuery.data?.data?.members ?? [];
  const total = membersQuery.data?.data?.total;

  const toggleMember = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const moveSelectedUp = (index: number) => {
    if (index <= 0 || index >= selectedIds.length) return;
    setSelectedIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveSelectedDown = (index: number) => {
    if (index < 0 || index >= selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const createSlotButton = isOwner ? (
    <div className="flex gap-2">
      {/*{currentCycle && currentCycle.status === "pending" && (
        <button
          className="btn btn-outline btn-primary"
          onClick={() => reorderModalRef.current?.open()}
        >
          <ArrowUpDown className="w-4 h-4" />
          Reorder Slots
        </button>
      )}*/}
      <button
        className="btn btn-primary"
        disabled={(membersQuery.data?.data?.members?.length ?? 0) < 10}
        onClick={() => {
          setSelectedIds([]);
          slotModalRef.current?.open();
        }}
      >
        <Plus className="w-4 h-4" />
        Generate Slot
      </button>
    </div>
  ) : null;

  const searchBar = (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-base-200">
      <SearchBar value={search} onChange={setSearch} />
      {membersQuery.isFetching && !membersQuery.isLoading && (
        <RefreshCw className="w-4 h-4 text-base-content/40 animate-spin shrink-0" />
      )}
      {embedded && createSlotButton}
    </div>
  );

  const tableContent = membersQuery.isLoading ? (
    <div className="flex justify-center py-10">
      <span className="loading loading-spinner loading-md" />
    </div>
  ) : members.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
      <Users className="w-8 h-8" />
      <p className="text-sm">
        {search ? "No members match your search" : "No members yet"}
      </p>
    </div>
  ) : (
    <CustomTable
      data={members}
      columns={columns}
      ring={false}
      totalCount={total}
    />
  );

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
            disabled={selectedIds.length === 0 || slotMutation.isPending}
            onClick={() => slotMutation.mutate()}
          >
            {slotMutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create ({selectedIds.length})
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
        {/* Left column: Selection list */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-base-content">
            Select Members
          </h4>
          <p className="text-xs text-base-content/60 mb-3">
            Check the members you want to include in this payout cycle.
          </p>
          <div className="divide-y divide-base-200 border border-base-200 rounded-lg p-2 max-h-72 overflow-y-auto">
            {members.map((m) => {
              const checked = selectedIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-3 py-2 cursor-pointer hover:bg-base-200/40 px-2 rounded-lg"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={checked}
                    onChange={() => toggleMember(m.id)}
                  />
                  <div className="rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold shrink-0 w-7 h-7 text-xs">
                    {(m.firstName?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-base-content text-xs truncate">
                      {m.firstName} {m.lastName}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right column: Ordering list */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-base-content">
            Payout Order
          </h4>
          <p className="text-xs text-base-content/60 mb-3">
            Use the arrows to set the sequence of slot payouts.
          </p>
          {selectedIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-base-300 rounded-lg h-72 text-base-content/40 p-4 text-center">
              <p className="text-xs">
                Select members on the left to set their payout order.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-base-200 border border-base-200 rounded-lg p-2 max-h-72 overflow-y-auto">
              {selectedIds.map((id, index) => {
                const member = members.find((m) => m.id === id);
                if (!member) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-base-200/40 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-primary w-5">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-base-content font-medium truncate">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        disabled={index === 0}
                        onClick={() => moveSelectedUp(index)}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        disabled={index === selectedIds.length - 1}
                        onClick={() => moveSelectedDown(index)}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );

  if (embedded) {
    return (
      <>
        {searchBar}
        {tableContent}
        {slotModal}
        {currentCycle && (
          <ReorderSlotsModal
            modalRef={reorderModalRef}
            groupId={groupId}
            cycle={currentCycle}
          />
        )}
      </>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base-content">Members</h3>
          {total !== undefined && (
            <span className="badge badge-neutral badge-sm">{total}</span>
          )}
        </div>
        {createSlotButton}
      </div>
      {searchBar}
      {tableContent}
      {slotModal}
      {currentCycle && (
        <ReorderSlotsModal
          modalRef={reorderModalRef}
          groupId={groupId}
          cycle={currentCycle}
        />
      )}
    </div>
  );
}
