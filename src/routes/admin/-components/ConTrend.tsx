import apiClient from "#/api/simpleApi.ts";
import { formatCurrency } from "#/helpers/currency.ts";
import type { ContributionTrendResponse } from "#/types/admin";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ConTrend() {
  const query = useQuery<ContributionTrendResponse>({
    queryKey: ["contributions-trend"],
    queryFn: async () => {
      const resp = await apiClient.get("admin/contributions-trend");
      return resp.data;
    },
  });

  const chartData = (query.data?.data ?? []).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    }),
    total: Number(item.total),
  }));

  return (
    <div className="card bg-base-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-base-content">
            Contributions Trend
          </h3>
          <p className="text-sm text-base-content/60">Last 7 days</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-base-content/60">Contributions</span>
        </div>
      </div>

      {query.isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="colorContributions"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="oklch(52% 0.154 150.069)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(52% 0.154 150.069)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(86% 0 0)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="oklch(66% 0 0)"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="oklch(66% 0 0)"
                tickFormatter={(v) =>
                  v === 0 ? "₦0" : `₦${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Total"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid oklch(86% 0 0)",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="oklch(52% 0.154 150.069)"
                fillOpacity={1}
                fill="url(#colorContributions)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
