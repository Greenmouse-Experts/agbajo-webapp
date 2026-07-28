import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, RefreshCw } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";
import QueryCompLayout from "#/components/layout/QueryCompLayout";

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
}

export default function GroupMembersList({
  groupId,
  queryScope = "group",
  embedded = false,
}: Props) {
  const [search, setSearch] = useState("");

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

  const inner = (
    <>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-base-200">
        <SearchBar value={search} onChange={setSearch} />
        {membersQuery.isFetching && !membersQuery.isLoading && (
          <RefreshCw className="w-4 h-4 text-base-content/40 animate-spin shrink-0" />
        )}
      </div>

      <QueryCompLayout query={membersQuery}>
        {(res) => {
          const members = res.data?.members ?? [];

          if (members.length === 0) {
            return (
              <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
                <Users className="w-8 h-8" />
                <p className="text-sm">
                  {search ? "No members match your search" : "No members yet"}
                </p>
              </div>
            );
          }
          return (
            <div className="divide-y divide-base-200">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-base-200/40 transition-colors"
                >
                  <div className="rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content font-semibold shrink-0 w-11 h-11 text-base">
                    {(m.firstName?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-base-content truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-sm text-base-content/50 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </QueryCompLayout>
    </>
  );

  if (embedded) return <>{inner}</>;

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <h3 className="font-semibold text-base-content">Members</h3>
      </div>
      {inner}
    </div>
  );
}
