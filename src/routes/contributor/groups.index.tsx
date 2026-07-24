import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "./-components/PageHeader";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import type { MyGroup } from "#/types/groups.js";
import PublicGroupsList from "#/components/groups/PublicGroupsList";
import MyGroupsList from "#/components/groups/MyGroupsList";

type GroupTab = "public" | "my";

export const Route = createFileRoute("/contributor/groups/")({
  validateSearch: (s): { tab: GroupTab } => ({
    tab: (s?.tab as GroupTab) === "my" ? "my" : "public",
  }),
  component: ContributorGroups,
});

const TABS: { label: string; value: GroupTab }[] = [
  { label: "Public Groups", value: "public" },
  { label: "My Groups", value: "my" },
];

function ContributorGroups() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: myGroups = [] } = useQuery({
    queryKey: ["contributor", "groups"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<MyGroup[]>>("contributor/groups")
        .then((r) => r.data.data),
  });

  const myGroupIds = new Set(myGroups.map((g) => g.id));

  const setTab = (t: GroupTab) =>
    navigate({ search: (prev) => ({ ...prev, tab: t }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        subtitle="Browse public groups or manage your memberships"
      />

      <div className="tabs tabs-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${tab === t.value ? "tab-active" : ""}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "public" ? (
        <PublicGroupsList myGroupIds={myGroupIds} />
      ) : (
        <MyGroupsList />
      )}
    </div>
  );
}
