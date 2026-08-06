import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  RefreshCw,
  Plus,
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
];

export default function GroupMembersList({
  groupId,
  queryScope = "group",
  embedded = false,
  ownerId,
}: Props) {
  const [search, setSearch] = useState("");
  const [orderedMembers, setOrderedMembers] = useState<GroupMember[]>([]);
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
      queryClient.invalidateQueries({ queryKey: [queryScope, groupId] });
    },
  });

  const members = membersQuery.data?.data?.members ?? [];
  const total = membersQuery.data?.data?.total;

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
      const slots = Array.isArray(resData) ? resData : (Array.isArray(resData?.slots) ? resData.slots : []);
      
      const ordered = slots
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
        onClick={fetchPreview}
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
