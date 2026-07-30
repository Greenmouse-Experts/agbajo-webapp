import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Star, AlertCircle, Trash2 } from "lucide-react";
import apiClient from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import { type Actions } from "#/components/tables/pop-up";
import { usePagination } from "#/helpers/pagination";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/admin/contributors/")({
  component: AdminContributors,
});

interface Contributor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

const Avatar = ({ name }: { name?: string; size?: "sm" | "lg" }) => (
  <div className="rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-medium shrink-0 w-8 h-8 text-base">
    {(name?.[0] ?? "C").toUpperCase()}
  </div>
);

const columns: columnType<Contributor>[] = [
  {
    key: "firstName",
    label: "Name",
    render: (_, item) => (
      <div className="flex items-center gap-3">
        <Avatar name={item.firstName} />
        <span className="font-medium">
          {item.firstName} {item.lastName}
        </span>
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (val) => <span className="text-base-content/70">{val}</span>,
  },
  {
    key: "createdAt",
    label: "Joined",
    render: (val) => (
      <span className="text-sm text-base-content/60">
        {new Date(val).toLocaleDateString()}
      </span>
    ),
  },
];

function AdminContributors() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const deleteConfirmRef = useRef<ModalHandle>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Contributor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Contributor | null>(null);
  const pagination = usePagination();
  const { page, pageSize } = pagination;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contributors", searchQuery, page, pageSize],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        limit: pageSize,
      };
      if (searchQuery) params.search = searchQuery;
      const resp = await apiClient.get("/admins/users", { params });
      return resp.data.data as { users: Contributor[]; pagination: { total: number } };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.delete(`admins/users/${id}`), {
          loading: "Deleting user...",
          success: "User deleted",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      deleteConfirmRef.current?.close();
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "contributors"] });
    },
  });

  const contributors = data?.users ?? [];
  const total = data?.pagination.total ?? 0;

  const openModal = (c: Contributor) => {
    setSelected(c);
    modalRef.current?.showModal();
  };

  const actions: Actions<Contributor>[] = [
    {
      key: "view",
      label: "View Details",
      action: (item) => openModal(item),
    },
    {
      key: "delete",
      label: "Delete User",
      action: (item) => {
        setPendingDelete(item);
        deleteConfirmRef.current?.open();
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Contributors</h1>
        <p className="text-base-content/60 mt-1">
          Monitor all platform contributors
          {total > 0 && (
            <span className="ml-2 badge badge-neutral">{total}</span>
          )}
        </p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : contributors.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No contributors found
          </h3>
          <p className="text-base-content/60">Try adjusting your search</p>
        </div>
      ) : (
        <CustomTable
          data={contributors}
          columns={columns}
          actions={actions}
          totalCount={total}
          paginationProps={pagination}
        />
      )}

      <Modal
        ref={deleteConfirmRef}
        title="Delete User"
        actions={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => deleteConfirmRef.current?.close()}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </>
        }
      >
        <p className="text-base-content">
          Are you sure you want to delete{" "}
          <span className="font-semibold">
            {pendingDelete
              ? `${pendingDelete.firstName} ${pendingDelete.lastName}`
              : "this user"}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>

      <dialog ref={modalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-lg">
            <h3 className="text-xl font-semibold">Contributor Details</h3>

            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-medium shrink-0 w-16 h-16 text-xl">
                  {(selected.firstName?.[0] ?? "C").toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">
                    {selected.firstName} {selected.lastName}
                  </h4>
                  <div className="flex items-center gap-2 text-base-content/60 mt-1">
                    <Mail className="w-4 h-4" />
                    {selected.email}
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">User ID</span>
                  <span className="font-mono text-xs text-base-content/70 truncate max-w-[60%]">
                    {selected.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Joined</span>
                  <span>{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content mb-3">
                  Performance
                </h4>
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Rating and contribution data not available</span>
                </div>
              </div>
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
    </div>
  );
}
