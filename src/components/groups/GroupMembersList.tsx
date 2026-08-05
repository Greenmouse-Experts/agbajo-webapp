import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { useAuth, type AUTHRECORD } from "#/store/authStore";
import { createSlotApi } from "#/api/groups/groups-api.tsx";
import { extract_message } from "#/helpers/apihelpers";

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
  // const get_cycles = useQuery<ApiResponse<{ cycles: [] }>>({
  //   queryKey: [queryScope, groupId, "cycles"],
  //   queryFn: async () => {
  //     const resp = await apiClient.get(`groups/${groupId}/cycles/current`);
  //     return resp.data;
  //   },
  // });

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

  const createSlotButton = isOwner ? (
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
      title="Create Slot"
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
      <p className="text-sm text-base-content/60 mb-4">
        Select members to include in this slot.
      </p>
      <div className="divide-y divide-base-200 max-h-72 overflow-y-auto -mx-1 px-1">
        {members.map((m) => {
          const checked = selectedIds.includes(m.id);
          return (
            <label
              key={m.id}
              className="flex items-center gap-3 py-3 cursor-pointer hover:bg-base-200/40 px-2 rounded-lg"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={checked}
                onChange={() => toggleMember(m.id)}
              />
              <div className="rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold shrink-0 w-8 h-8 text-sm">
                {(m.firstName?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-base-content text-sm truncate">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-base-content/50 truncate">
                  {m.email}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </Modal>
  );

  if (embedded) {
    return (
      <>
        {searchBar}
        {tableContent}
        {slotModal}
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
    </div>
  );
}
