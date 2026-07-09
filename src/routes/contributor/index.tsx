import { createFileRoute } from "@tanstack/react-router";
import {
  Folder,
  DollarSign,
  Wallet,
  Star,
  TrendingUp,
  ArrowDownRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "./-components/PageHeader";
import { StatCard } from "./-components/StatCard";
import { formatCurrency } from "#/helpers/currency";

export const Route = createFileRoute("/contributor/")({
  component: ContributorDashboard,
});

const chartData = [
  { date: "Mon", amount: 12000 },
  { date: "Tue", amount: 8500 },
  { date: "Wed", amount: 15000 },
  { date: "Thu", amount: 9200 },
  { date: "Fri", amount: 18000 },
  { date: "Sat", amount: 6000 },
  { date: "Sun", amount: 11500 },
];

const recentActivity = [
  { id: 1, status: "completed", amount: 10000, date: "2026-07-01" },
  { id: 2, status: "pending", amount: 7500, date: "2026-06-28" },
  { id: 3, status: "completed", amount: 10000, date: "2026-06-21" },
  { id: 4, status: "completed", amount: 10000, date: "2026-06-14" },
  { id: 5, status: "pending", amount: 7500, date: "2026-06-07" },
];

function ContributorDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back"
        action={
          <div className="badge badge-warning gap-1.5 py-3 px-3">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold">4.8</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          iconClass="bg-secondary/10 text-secondary"
          value={formatCurrency(240000)}
          label="Total Contributions"
          trend={
            <span className="text-success flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
          }
        />
        <StatCard
          icon={Wallet}
          iconClass="bg-success/10 text-success"
          value={formatCurrency(85000)}
          label="Wallet Balance"
          link={{
            to: "/contributor/wallet",
            label: "Fund wallet",
            colorClass: "text-success",
          }}
        />
        <StatCard
          icon={Folder}
          iconClass="bg-warning/10 text-warning"
          value={3}
          label="Active Groups"
          link={{
            to: "/contributor/groups",
            label: "View groups",
            colorClass: "text-warning",
          }}
        />
        <StatCard
          icon={Clock}
          iconClass="bg-error/10 text-error"
          value={2}
          label="Pending Payouts"
          link={{
            to: "/contributor/payouts",
            label: "View payouts",
            colorClass: "text-error",
          }}
        />
      </div>

      <div role="alert" className="alert alert-warning">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="font-medium">Payment Performance Notice</p>
          <p className="text-sm opacity-80">
            You have 1 missed and 2 late payments. This affects your rating.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <div className="mb-2">
              <h3 className="font-semibold text-base-content">
                Contribution Activity
              </h3>
              <p className="text-xs text-base-content/60">Last 7 days</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(52% 0.154 150.069)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(52% 0.154 150.069)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(86% 0 0)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="oklch(86% 0 0)"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="oklch(86% 0 0)"
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(v as number)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid oklch(86% 0 0)",
                      borderRadius: "0.5rem",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="oklch(52% 0.154 150.069)"
                    strokeWidth={2}
                    fill="url(#grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body gap-4">
            <h3 className="font-semibold text-base-content">Performance</h3>
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-primary/5 gap-2">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-content text-2xl font-bold">
                  4.8
                </span>
              </div>
              <p className="font-medium text-base-content text-sm">
                Your Rating
              </p>
              <p className="text-xs text-base-content/60 text-center">
                Based on contribution consistency
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-base-200 p-3 text-center">
                <p className="text-xl font-bold text-success">98%</p>
                <p className="text-xs text-base-content/60 mt-0.5">
                  On-time rate
                </p>
              </div>
              <div className="rounded-xl bg-base-200 p-3 text-center">
                <p className="text-xl font-bold text-secondary">3</p>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Active groups
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body pb-0">
          <h3 className="font-semibold text-base-content">Recent Activity</h3>
        </div>
        <div className="divide-y divide-base-200">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  item.status === "completed"
                    ? "bg-success/10"
                    : "bg-warning/10"
                }`}
              >
                {item.status === "completed" ? (
                  <ArrowDownRight className="w-4 h-4 text-success" />
                ) : (
                  <Clock className="w-4 h-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content">
                  Contribution
                </p>
                <p className="text-xs text-base-content/60 capitalize">
                  {item.status}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    item.status === "completed"
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-base-content/40">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
