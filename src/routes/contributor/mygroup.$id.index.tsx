import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Hash } from "lucide-react";
import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import GroupContributions from "#/components/groups/GroupContributions.tsx";
import GroupMembersList from "#/components/groups/GroupMembersList";
import TabSwitcher from "#/components/TabSwitcher";

type TabParam = "slots" | "members";

export const Route = createFileRoute("/contributor/mygroup/$id/")({
  validateSearch: (s): { tab?: TabParam } => ({
    tab: (s?.tab as TabParam) ?? "slots",
  }),
  component: GroupDetailPage,
});

import type { GroupDetail } from "#/types/groups";
import MyGroupHeaderDetails from "#/components/MyGroupHeaderDetails.tsx";
import GroupSlotList from "#/components/groups/GroupSlotLists.tsx";

interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

const Avatar = ({
  name,
  color = "bg-primary/10 text-primary",
}: {
  name: string;
  color?: string;
}) => (
  <div
    className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-semibold text-sm shrink-0`}
  >
    {(name?.[0] ?? "?").toUpperCase()}
  </div>
);

function GroupDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { tab = "slots" } = Route.useSearch();

  const groupQuery = useQuery({
    queryKey: ["contributor", "group", id],
    queryFn: () => apiClient.get(`groups/${id}`).then((r) => r.data),
  });

  const group = groupQuery.data?.data as GroupDetail | undefined;

  return (
    <div className="space-y-6 ">
      <Link
        to="/contributor/groups"
        search={{ tab: "my" }}
        className="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        My Groups
      </Link>

      <PageLoader query={groupQuery}>
        {() => (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              <MyGroupHeaderDetails group={group!} />

              {/* Managers */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  <h3 className="font-semibold text-base-content">Managers</h3>
                  <span className="badge badge-neutral badge-sm ml-auto">
                    {group!.managers.length}
                  </span>
                </div>

                {group!.managers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-base-content/30">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">No managers assigned</p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-200">
                    {group!.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-base-200/40 transition-colors"
                      >
                        <Avatar name={m.firstName} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base-content text-sm truncate">
                            {managerName(m)}
                          </p>
                          <p className="text-xs text-base-content/50 truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabbed Payout Slots & Members */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <TabSwitcher
                  tabs={[
                    { id: "slots", label: "Payout Slots" },
                    { id: "members", label: "Members" },
                  ]}
                  activeTab={tab}
                  onChange={(tabId) =>
                    navigate({
                      to: ".",
                      search: (prev) => ({ ...prev, tab: tabId }),
                    })
                  }
                />
                <div>
                  {tab === "slots" && <GroupSlotList groupId={id} viewOnly embedded />}
                  {tab === "members" && (
                    <GroupMembersList groupId={id} queryScope="contributor" embedded />
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <GroupContributions groupId={id} />
            </div>
          </section>
        )}
      </PageLoader>
    </div>
  );
}
