import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import { formatCurrency } from "@/shared/lib/format";
import { Button } from "@/shared/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
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

const COLORS = [
  "#397ed6",
  "#e9be51",
  "#49ad86",
  "#a77bcf",
  "#e88c7b",
  "#65b8c3",
];
const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #dfe4ea",
  boxShadow: "0 8px 24px -16px rgba(32,57,84,.4)",
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="chat-main-panel overflow-hidden">
        <header className="chat-header flex items-center justify-between border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-zinc-100 animate-pulse" />
            <div>
              <div className="h-5 bg-zinc-200 rounded w-28 animate-pulse" />
              <div className="h-3 bg-zinc-100 rounded w-44 mt-1 animate-pulse" />
            </div>
          </div>
        </header>

        <div className="p-6 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
          {/* Stats overview row skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="app-card p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-zinc-100 rounded w-1/3" />
                <div className="h-8 bg-zinc-200 rounded w-2/3" />
              </div>
            ))}
          </div>

          {/* Charts grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="app-card p-5 h-[350px] flex flex-col justify-between animate-pulse">
              <div className="h-6 bg-zinc-200 rounded w-1/3" />
              <div className="h-[250px] bg-zinc-50 rounded-2xl w-full" />
            </div>
            <div className="app-card p-5 h-[350px] flex flex-col justify-between animate-pulse">
              <div className="h-6 bg-zinc-200 rounded w-1/3" />
              <div className="h-[250px] bg-zinc-50 rounded-2xl w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="chat-main-panel flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-xl font-bold text-destructive mb-2">
          Failed to load analytics
        </h2>
        <p className="text-muted-foreground mb-4">
          We couldn't fetch your spending data right now.
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to overview</Button>
      </div>
    );
  }

  const { overview, categoryBreakdown, monthlyTrend, topGroups } = analytics;

  return (
    <div className="chat-main-panel bg-background">
      {/* Header */}
      <header className="chat-header sticky top-0 z-10 bg-card backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("/dashboard")}
            className="md:hidden"
            aria-label="Back to overview"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
              <PieChartIcon size={19} className="text-[var(--insight)]" />
              Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Insights across all your groups
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="app-card-elevated p-5 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Total spent
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCurrency(overview.totalSpent)}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {overview.totalExpenses}{" "}
              {overview.totalExpenses === 1 ? "expense" : "expenses"}
            </span>
          </div>
          <div className="app-card-elevated p-5 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Total paid
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCurrency(overview.totalPaid)}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Money out of pocket
            </span>
          </div>
          <div className="app-card-elevated p-5 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Net balance
            </span>
            <span
              className={`flex items-center gap-1 text-2xl font-semibold tracking-tight tabular-nums ${overview.netBalance > 0 ? "text-emerald" : overview.netBalance < 0 ? "text-rose" : "text-foreground"}`}
            >
              {overview.netBalance > 0 ? (
                <TrendingUp size={20} />
              ) : overview.netBalance < 0 ? (
                <TrendingDown size={20} />
              ) : null}
              {formatCurrency(Math.abs(overview.netBalance))}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {overview.netBalance > 0
                ? "You are owed"
                : overview.netBalance < 0
                  ? "You owe"
                  : "All settled"}
            </span>
          </div>
          <div className="app-card-elevated p-5 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Total settled
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCurrency(overview.totalSettled)}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Payments confirmed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Chart */}
          <div className="app-card-elevated p-5 lg:col-span-2 flex flex-col h-[360px]">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Spending trend · 6 months
            </h3>
            <div className="flex-1 min-h-0">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorAmount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#397ed6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#397ed6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94A3B8" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94A3B8" }}
                      tickFormatter={(value) =>
                        `₹${value.toLocaleString("en-IN")}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Spent",
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#397ed6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="app-card-elevated p-5 flex flex-col h-[360px]">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              By category
            </h3>
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              {categoryBreakdown.length > 0 ? (
                <>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="amount"
                          stroke="none"
                        >
                          {categoryBreakdown.map((_entry, index) => (
                            <Cell
                              key={`cell-\${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2 max-h-[100px] overflow-y-auto pr-1">
                    {categoryBreakdown.map((cat, index) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2.5 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-muted-foreground capitalize">
                            {cat.category.toLowerCase()}
                          </span>
                        </div>
                        <span className="font-medium tabular-nums text-foreground">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  No category data
                </div>
              )}
            </div>
          </div>

          {/* Top Groups */}
          <div className="app-card-elevated p-5 lg:col-span-3 flex flex-col h-[320px]">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Groups by spending
            </h3>
            <div className="flex-1 min-h-0">
              {topGroups.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topGroups}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#F8FAFC" }}
                    />
                    <Bar
                      dataKey="totalSpent"
                      name="Total Spent"
                      fill="#397ed6"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No group data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
