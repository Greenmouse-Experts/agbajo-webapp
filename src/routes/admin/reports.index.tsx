import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/reports/")({
  component: AdminReports,
});

const monthlyData = [
  { month: "Jan", contributions: 450000, payouts: 380000 },
  { month: "Feb", contributions: 520000, payouts: 420000 },
  { month: "Mar", contributions: 610000, payouts: 550000 },
  { month: "Apr", contributions: 480000, payouts: 400000 },
  { month: "May", contributions: 720000, payouts: 680000 },
  { month: "Jun", contributions: 850000, payouts: 750000 },
];

const groupDistribution = [
  { name: "Active Groups", value: 35, color: "#10B981" },
  { name: "Frozen", value: 5, color: "#F59E0B" },
  { name: "Completed", value: 15, color: "#3B82F6" },
  { name: "Closed", value: 3, color: "#EF4444" },
];

const userGrowth = [
  { month: "Jan", contributors: 120, managers: 8 },
  { month: "Feb", contributors: 145, managers: 10 },
  { month: "Mar", contributors: 180, managers: 12 },
  { month: "Apr", contributors: 210, managers: 15 },
  { month: "May", contributors: 250, managers: 18 },
  { month: "Jun", contributors: 320, managers: 22 },
];

const frequencyDistribution = [
  { name: "Daily", count: 12 },
  { name: "Weekly", count: 28 },
  { name: "Monthly", count: 18 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

function AdminReports() {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            Reports & Analytics
          </h1>
          <p className="text-base-content mt-1">
            Comprehensive platform insights
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            className="input"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <input
            type="date"
            className="input"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Contributions",
            value: "₦3.63M",
            change: "+15% from last month",
          },
          {
            label: "Total Payouts",
            value: "₦3.18M",
            change: "+12% from last month",
          },
          {
            label: "Active Users",
            value: "342",
            change: "+28% from last month",
          },
          {
            label: "Avg. Collection Rate",
            value: "94.5%",
            change: "+2% from last month",
          },
        ].map(({ label, value, change }) => (
          <div key={label} className="stat bg-base-100 rounded-box shadow">
            <div className="stat-title">{label}</div>
            <div className="stat-value text-2xl">{value}</div>
            <div className="stat-desc text-success">{change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Contributions vs Payouts</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="contributions"
                    fill="#1e4b24"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="payouts" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Group Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {groupDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${v} groups`}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">User Growth</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="contributors"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: "#F59E0B", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="managers"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Contribution Frequency</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    width={80}
                  />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Bar dataKey="count" fill="#045137" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            <div className="text-center p-6 rounded-xl bg-blue-50">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">A+</span>
              </div>
              <h4 className="font-semibold text-base-content">
                Collection Rate
              </h4>
              <p className="text-3xl font-bold text-blue-600 mt-2">94.5%</p>
              <p className="text-base text-base-content mt-1">Target: 95%</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-green-50">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">₦</span>
              </div>
              <h4 className="font-semibold text-base-content">
                Avg. Transaction
              </h4>
              <p className="text-3xl font-bold text-green-600 mt-2">₦45K</p>
              <p className="text-base text-base-content mt-1">
                Per contribution
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-amber-50">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">4.8</span>
              </div>
              <h4 className="font-semibold text-base-content">Avg. Rating</h4>
              <p className="text-3xl font-bold text-amber-600 mt-2">4.8/5</p>
              <p className="text-base text-base-content mt-1">
                Platform satisfaction
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
