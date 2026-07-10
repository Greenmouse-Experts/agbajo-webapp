import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";

export const Route = createFileRoute("/admin/groups/")({
  component: AdminGroups,
});

interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Group {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: string;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  managers: GroupManager[];
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const managerName = (m: GroupManager) =>
  `${m.firstName} ${m.lastName}`.trim();

const columns: columnType<Group>[] = [
  { key: "groupName", label: "Group Name" },
  {
    key: "managers",
    label: "Managers",
    render: (managers: GroupManager[]) =>
      managers.length === 0 ? (
        <span className="text-base-content/40">—</span>
      ) : (
        <div>
          <div className="text-sm text-base-content">{managerName(managers[0])}</div>
          {managers.length > 1 && (
            <div className="text-xs text-base-content/60">
              +{managers.length - 1} more
            </div>
          )}
        </div>
      ),
  },
  {
    key: "maxMembers",
    label: "Members",
    render: (value: number) => (
      <div className="flex items-center gap-1 text-base-content/60">
        <Users className="w-4 h-4" />
        {value}
      </div>
    ),
  },
  {
    key: "contributionAmount",
    label: "Amount",
    render: (value: number) => (
      <span className="font-medium text-base-content">
        {formatCurrency(value)}
      </span>
    ),
  },
  {
    key: "frequency",
    label: "Frequency",
    render: (value: string) => (
      <span className="capitalize text-base-content/60">{value}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (value: string) => (
      <span className="badge badge-outline capitalize">{value}</span>
    ),
  },
  {
    key: "startDate",
    label: "Start Date",
    render: (value: string) => (
      <span className="text-sm text-base-content/60">
        {new Date(value).toLocaleDateString()}
      </span>
    ),
  },
];

function AdminGroups() {
  const detailsModalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Group | null>(null);

  const groupsQuery = useQuery<ApiResponseV2<Group[]>>({
    queryKey: ["admin", "groups"],
    queryFn: async () => {
      const resp = await apiClient.get("groups");
      return resp.data;
    },
  });

  const openDetails = (group: Group) => {
    setSelected(group);
    detailsModalRef.current?.showModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Ajo Groups</h1>
          <p className="text-base-content/60 mt-1">
            View and manage all savings groups
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm p-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <PageLoader query={groupsQuery}>
        {(data) => {
          const groups = data.data.groups as Group[];
          const q = searchQuery.toLowerCase();
          const filtered = groups.filter(
            (g) =>
              g.groupName.toLowerCase().includes(q) ||
              g.type.toLowerCase().includes(q) ||
              g.frequency.toLowerCase().includes(q),
          );

          if (filtered.length === 0) {
            return (
              <div className="card bg-base-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-base-content/40" />
                </div>
                <h3 className="text-lg font-medium text-base-content mb-1">
                  No groups found
                </h3>
                <p className="text-base-content/60">
                  Try adjusting your search or create a new group
                </p>
              </div>
            );
          }

          return (
            <CustomTable
              data={filtered}
              columns={columns}
              onRowClick={openDetails}
            />
          );
        }}
      </PageLoader>

      {/* Details Modal */}
      <dialog ref={detailsModalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <h3 className="text-xl font-semibold text-base-content">
              {selected.groupName}
            </h3>
            <p className="text-sm text-base-content/60 mt-1">Group Details</p>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Contribution",
                    value: formatCurrency(selected.contributionAmount),
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Per Frequency",
                    value: formatCurrency(selected.frequencyAmount),
                  },
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Max Members",
                    value: String(selected.maxMembers),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: selected.frequency,
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Start Date",
                    value: new Date(selected.startDate).toLocaleDateString(),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Created",
                    value: new Date(selected.createdAt).toLocaleDateString(),
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="card bg-base-200 p-4">
                    <div className="flex items-center gap-2 text-base-content/60 mb-1">
                      {icon}
                      <span className="text-sm">{label}</span>
                    </div>
                    <p className="font-bold capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card bg-base-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-base-content">
                    Type
                  </h4>
                  <span className="badge badge-outline capitalize">
                    {selected.type}
                  </span>
                </div>
              </div>

              {selected.managers.length > 0 && (
                <div className="card bg-base-200 p-4">
                  <h4 className="text-sm font-medium text-base-content mb-3">
                    Assigned Managers
                  </h4>
                  <div className="space-y-3">
                    {selected.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-base-100"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-sm font-semibold shrink-0">
                          {m.firstName[0]?.toUpperCase() ?? "M"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-base-content">
                            {managerName(m)}
                          </p>
                          <p className="text-xs text-base-content/60">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
