import { Calendar, DollarSign, Users, UserPlus } from "lucide-react";
import { formatCurrency, formatDate } from "#/helpers/helpers";
import type { GroupDetail } from "#/types/groups";
import { useQuery } from "@tanstack/react-query";
import apiClient from "#/api/simpleApi";

interface Props {
  group: GroupDetail;
  isOwner?: boolean;
  onInvite?: () => void;
}

export default function MyGroupHeaderDetails({
  group,
  isOwner,
  onInvite,
}: Props) {
  const query = useQuery({
    queryKey: ["slots-cycles", group.id],
    queryFn: async () => {
      let resp = await apiClient.get(`/groups/${group.id}/cycles/current`);
      return resp.data;
    },
  });
  return (
    <div className="card bg-base-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge badge-primary capitalize">{group.type}</span>
            <span className="badge badge-outline capitalize">
              {group.frequency}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-base-content">
            {group.groupName}
          </h1>
          <p className="text-sm text-base-content/50 mt-1">
            Created {formatDate(group.createdAt)}
          </p>
        </div>
        {isOwner && onInvite && (
          <div className="flex gap-2 shrink-0">
            <button className="btn btn-primary" onClick={onInvite}>
              <UserPlus className="w-4 h-4" />
              Invite Members
            </button>
          </div>
        )}
      </div>

      <div className="divider my-4" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        {[
          {
            icon: <></>,
            label: "Contribution",
            value: formatCurrency(Number(group.contributionAmount)),
          },
          {
            icon: <></>,
            label: "Per Interval",
            value: formatCurrency(group.frequencyAmount),
          },
          {
            icon: <Users className="w-3.5 h-3.5" />,
            label: "Min Members",
            value: group.minMembers,
          },
          {
            icon: <Calendar className="w-3.5 h-3.5" />,
            label: "Start Date",
            value: formatDate(group.startDate),
          },
        ].map(({ icon, label, value }) => (
          <div key={label}>
            <div className="flex items-center gap-1 text-xs text-base-content/50 uppercase tracking-wide mb-1">
              {icon}
              {label}
            </div>
            <p className="font-semibold text-base-content capitalize">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
