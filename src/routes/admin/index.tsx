import { formatCurrency } from "#/helpers/currency.ts";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Folder,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import AdminStats from "./-components/AdminStats";
import ConTrend from "./-components/ConTrend";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

interface RecentActivity {
  id: string;
  type: "contribution" | "payout";
  title: string;
  description: string;
  amount?: number;
  created_at: string;
}

const contributionsData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString("en-US", { weekday: "short" }),
    amount: Math.floor(Math.random() * 100000) + 50000,
  };
});

const groupsData = [
  { name: "Group A", contributions: 450000 },
  { name: "Group B", contributions: 320000 },
  { name: "Group C", contributions: 580000 },
  { name: "Group D", contributions: 240000 },
  { name: "Group E", contributions: 380000 },
];

const recentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "contribution",
    title: "Adewale Okafor made a contribution",
    description: "₦50,000 contribution received",
    amount: 50000,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    type: "payout",
    title: "Funmi Adeyemi received payout",
    description: "₦200,000 payout processed",
    amount: 200000,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    type: "contribution",
    title: "Chidi Eze made a contribution",
    description: "₦75,000 contribution received",
    amount: 75000,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "4",
    type: "payout",
    title: "Ngozi Obi received payout",
    description: "₦150,000 payout processed",
    amount: 150000,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

function RouteComponent() {
  const [stats] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base-content/60 mt-1">
            Overview of platform performance and activities
          </p>
        </div>
        <div className="badge badge-primary">Live Data</div>
      </div>
      <AdminStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConTrend />

        <div className="card bg-base-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-base-content">
                Groups Performance
              </h3>
              <p className="text-sm text-base-content/60">
                Top 5 groups by contributions
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(86% 0 0)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  stroke="oklch(66% 0 0)"
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  stroke="oklch(66% 0 0)"
                  width={60}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid oklch(86% 0 0)",
                  }}
                />
                <Bar
                  dataKey="contributions"
                  fill="oklch(52% 0.154 150.069)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm">
          <div className="p-6 border-b border-base-200">
            <h3 className="text-lg font-semibold text-base-content">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-base-200">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-base-content/50 text-sm">
                No recent activity
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 hover:bg-base-200/40"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      activity.type === "contribution"
                        ? "bg-success/10"
                        : "bg-secondary/10"
                    }`}
                  >
                    {activity.type === "contribution" ? (
                      <ArrowDownRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-medium ${
                        activity.type === "contribution"
                          ? "text-success"
                          : "text-secondary"
                      }`}
                    >
                      {activity.amount ? formatCurrency(activity.amount) : "-"}
                    </p>
                    <p className="text-xs text-base-content/40">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="p-6 border-b border-base-200">
            <h3 className="text-lg font-semibold text-base-content">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-3 p-4">
            <Link
              to="/admin/cluster-managers"
              className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-secondary/40 hover:bg-secondary/5 transition-all group"
            >
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <UserCheck className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">
                  Review KYC
                </p>
                <p className="text-xs text-base-content/50">
                  {stats?.pendingVerifications || 0} pending
                </p>
              </div>
            </Link>

            <Link
              to="/admin/groups"
              search={{ createdBy: "admin", search: "" }}
              className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">
                  Create Group
                </p>
                <p className="text-xs text-base-content/50">
                  Setup new Ajo group
                </p>
              </div>
            </Link>

            <Link
              to="/admin/payouts"
              className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-accent/40 hover:bg-accent/5 transition-all group"
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">
                  Manual Payout
                </p>
                <p className="text-xs text-base-content/50">
                  Process emergency payout
                </p>
              </div>
            </Link>

            <Link
              to="/admin/complaints"
              className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-error/40 hover:bg-error/5 transition-all group"
            >
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center group-hover:bg-error/20 transition-colors">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">
                  Handle Complaints
                </p>
                <p className="text-xs text-base-content/50">
                  Resolve escalated issues
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
