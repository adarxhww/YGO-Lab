"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Trade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  realizedPnL: number;
  openedAt: string;
  closedAt: string | null;
};

type SymbolPerformance = {
  symbol: string;
  realizedPnL: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
};

type PerformanceHistory = {
  id: string;
  totalValue: number;
  cashBalance: number;
  holdingsValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  timestamp: string;
};

type Analytics = {
  accountId: string;
  currency: string;

  overview: {
    totalTrades: number;
    openTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakevenTrades: number;
    winRate: number;
    totalRealizedPnL: number;
    grossProfit: number;
    grossLoss: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number | null;
    largestWin: number;
    largestLoss: number;
  };

  portfolio: {
    currentValue: number;
    firstSnapshotValue: number;
    returnPercentage: number;
    maximumDrawdown: number;
  };

  symbolPerformance: SymbolPerformance[];
  tradePerformance: {
    tradeId: string;
    symbol: string;
    realizedPnL: number;
    closedAt: string | null;
  }[];
  performanceHistory: PerformanceHistory[];
  trades: Trade[];
};

type AnalyticsResponse = {
  success: boolean;
  error?: string;
  analytics?: Analytics;
};

function formatCurrency(
  value: number,
  maximumFractionDigits = 2
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function PnlValue({
  value,
  showPlus = true,
}: {
  value: number;
  showPlus?: boolean;
}) {
  const positive = value > 0;
  const negative = value < 0;

  return (
    <span
      className={
        positive
          ? "text-emerald-600"
          : negative
            ? "text-rose-600"
            : "text-slate-600"
      }
    >
      {positive && showPlus ? "+" : ""}
      {formatCurrency(value)}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </div>

          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {description}
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 items-center justify-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg text-slate-500">
          —
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-900">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function PerformanceChart({
  history,
}: {
  history: PerformanceHistory[];
}) {
  const chart = useMemo(() => {
    if (history.length === 0) {
      return null;
    }

    const values = history.map(
      (item) => item.totalValue
    );

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = maxValue - minValue;

    const padding =
      range === 0
        ? Math.max(maxValue * 0.002, 10)
        : range * 0.15;

    const min = minValue - padding;
    const max = maxValue + padding;

    const width = 900;
    const height = 320;

    const leftPadding = 70;
    const rightPadding = 25;
    const topPadding = 30;
    const bottomPadding = 50;

    const chartWidth =
      width -
      leftPadding -
      rightPadding;

    const chartHeight =
      height -
      topPadding -
      bottomPadding;

    const points = history.map(
      (item, index) => {
        const x =
          history.length === 1
            ? leftPadding +
              chartWidth / 2
            : leftPadding +
              (index /
                (history.length - 1)) *
                chartWidth;

        const y =
          topPadding +
          ((max - item.totalValue) /
            (max - min)) *
            chartHeight;

        return {
          x,
          y,
          value: item.totalValue,
          timestamp: item.timestamp,
        };
      }
    );

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

    const areaPath =
      points.length > 0
        ? `${linePath} L ${
            points[points.length - 1].x
          } ${
            height - bottomPadding
          } L ${points[0].x} ${
            height - bottomPadding
          } Z`
        : "";

    const labels = [
      max,
      min + (max - min) * 0.75,
      min + (max - min) * 0.5,
      min + (max - min) * 0.25,
      min,
    ];

    return {
      width,
      height,
      leftPadding,
      rightPadding,
      topPadding,
      bottomPadding,
      chartHeight,
      points,
      linePath,
      areaPath,
      labels,
    };
  }, [history]);

  if (!chart) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold">
            Portfolio Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical portfolio value over time.
          </p>
        </div>

        <EmptyState
          title="No performance history yet"
          description="Create portfolio snapshots while trading to build a historical performance curve."
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Equity Curve
          </div>

          <h2 className="mt-2 text-lg font-bold tracking-tight">
            Portfolio Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical portfolio value based on saved snapshots.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
            Snapshots
          </div>

          <div className="mt-1 text-lg font-black text-slate-900">
            {history.length}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[720px]">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            role="img"
            aria-label="Portfolio performance chart"
          >
            {chart.labels.map(
              (label, index) => {
                const y =
                  chart.topPadding +
                  (index / 4) *
                    chart.chartHeight;

                return (
                  <g key={index}>
                    <line
                      x1={chart.leftPadding}
                      x2={
                        chart.width -
                        chart.rightPadding
                      }
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100"
                    />

                    <text
                      x={
                        chart.leftPadding -
                        12
                      }
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[11px]"
                    >
                      {formatCurrency(
                        label,
                        0
                      )}
                    </text>
                  </g>
                );
              }
            )}

            <path
              d={chart.areaPath}
              fill="currentColor"
              className="text-slate-100"
              opacity="0.9"
            />

            <path
              d={chart.linePath}
              fill="none"
              stroke="currentColor"
              className="text-slate-900"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chart.points.map(
              (point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="white"
                    stroke="currentColor"
                    className="text-slate-900"
                    strokeWidth="3"
                  />

                  {(index === 0 ||
                    index ===
                      chart.points.length -
                        1) && (
                    <text
                      x={point.x}
                      y={
                        chart.height -
                        16
                      }
                      textAnchor={
                        index === 0
                          ? "start"
                          : "end"
                      }
                      className="fill-slate-400 text-[11px]"
                    >
                      {formatShortDate(
                        point.timestamp
                      )}
                    </text>
                  )}
                </g>
              )
            )}
          </svg>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            First Snapshot
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCurrency(
              history[0].totalValue
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Latest Snapshot
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCurrency(
              history[
                history.length - 1
              ].totalValue
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Observation Period
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatDate(
              history[0].timestamp
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [tradeFilter, setTradeFilter] =
    useState<
      "ALL" | "OPEN" | "CLOSED"
    >("ALL");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/v1/analytics",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as AnalyticsResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.analytics
        ) {
          throw new Error(
            data.error ??
              "Failed to load analytics"
          );
        }

        setAnalytics(data.analytics);
      } catch (loadError) {
        console.error(
          "Analytics page error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const filteredTrades = useMemo(() => {
    if (!analytics) {
      return [];
    }

    if (tradeFilter === "OPEN") {
      return analytics.trades.filter(
        (trade) => trade.closedAt === null
      );
    }

    if (tradeFilter === "CLOSED") {
      return analytics.trades.filter(
        (trade) => trade.closedAt !== null
      );
    }

    return analytics.trades;
  }, [analytics, tradeFilter]);

  const tradeStats = useMemo(() => {
    if (!analytics) {
      return {
        buyCount: 0,
        sellCount: 0,
        totalVolume: 0,
      };
    }

    return analytics.trades.reduce(
      (stats, trade) => {
        if (trade.side === "BUY") {
          stats.buyCount += 1;
        } else {
          stats.sellCount += 1;
        }

        stats.totalVolume +=
          trade.entryPrice *
          trade.quantity;

        return stats;
      },
      {
        buyCount: 0,
        sellCount: 0,
        totalVolume: 0,
      }
    );
  }, [analytics]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                TC
              </div>

              <div>
                <div className="text-sm font-black">
                  TradeCraft
                </div>

                <div className="text-xs text-slate-400">
                  Sim
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <div className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Workspace
            </div>

            <div className="mt-2 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>⌂</span>
                Dashboard
              </Link>

              <Link
                href="/markets"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>◌</span>
                Markets
              </Link>

              <Link
                href="/portfolio"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>▣</span>
                Portfolio
              </Link>

              <Link
                href="/journal"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>▤</span>
                Journal
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white"
              >
                <span>↗</span>
                Analytics
              </Link>

              <Link
                href="/learn"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>◇</span>
                Learn
              </Link>
            </div>

            <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Account
            </div>

            <div className="mt-2 space-y-1">
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span>○</span>
                Profile
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-bold text-slate-900">
                Demo account
              </div>

              <div className="mt-1 text-[11px] leading-5 text-slate-500">
                Simulated trading environment
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f9]/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Trading Analytics
                </div>

                <h1 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                  Performance
                </h1>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/portfolio"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Portfolio
                </Link>

                <Link
                  href="/journal"
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Trading Journal
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
            {loading ? (
              <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-3xl bg-white" />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-3xl bg-white"
                    />
                  ))}
                </div>

                <div className="h-96 animate-pulse rounded-3xl bg-white" />
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
                <div className="text-sm font-bold text-rose-800">
                  Unable to load analytics
                </div>

                <div className="mt-1 text-sm text-rose-700">
                  {error}
                </div>
              </div>
            ) : analytics ? (
              <>
                {/* Hero */}
                <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Analytics Overview
                      </div>

                      <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                        Understand your trading
                        performance.
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                        Review trade outcomes, portfolio
                        performance, risk-adjusted metrics,
                        and symbol-level results from your
                        simulated account.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Current Portfolio
                      </div>

                      <div className="mt-2 text-2xl font-black">
                        {formatCurrency(
                          analytics.portfolio
                            .currentValue
                        )}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {analytics.overview.openTrades}{" "}
                        open trade
                        {analytics.overview.openTrades ===
                        1
                          ? ""
                          : "s"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Primary Stats */}
                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Realized P&L"
                    value={formatCurrency(
                      analytics.overview
                        .totalRealizedPnL
                    )}
                    description={`${analytics.overview.totalTrades} closed trades`}
                    icon="₹"
                  />

                  <StatCard
                    label="Win Rate"
                    value={`${formatNumber(
                      analytics.overview.winRate
                    )}%`}
                    description={`${analytics.overview.winningTrades} wins · ${analytics.overview.losingTrades} losses`}
                    icon="%"
                  />

                  <StatCard
                    label="Portfolio Return"
                    value={`${analytics.portfolio.returnPercentage >= 0 ? "+" : ""}${formatNumber(
                      analytics.portfolio
                        .returnPercentage
                    )}%`}
                    description="Based on saved snapshots"
                    icon="↗"
                  />

                  <StatCard
                    label="Max Drawdown"
                    value={`${formatNumber(
                      analytics.portfolio
                        .maximumDrawdown
                    )}%`}
                    description="Historical peak-to-trough"
                    icon="↓"
                  />
                </section>

                {/* Performance */}
                <section className="mt-6">
                  <PerformanceChart
                    history={
                      analytics.performanceHistory
                    }
                  />
                </section>

                {/* Trade Metrics */}
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Trade Quality
                      </div>

                      <h2 className="mt-2 text-lg font-bold">
                        Trading Metrics
                      </h2>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Average Win
                        </div>

                        <div className="mt-2 text-lg font-black text-emerald-600">
                          {formatCurrency(
                            analytics.overview
                              .averageWin
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Average Loss
                        </div>

                        <div className="mt-2 text-lg font-black text-rose-600">
                          {formatCurrency(
                            analytics.overview
                              .averageLoss
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Profit Factor
                        </div>

                        <div className="mt-2 text-lg font-black text-slate-950">
                          {analytics.overview
                            .profitFactor ===
                          null
                            ? "—"
                            : formatNumber(
                                analytics.overview
                                  .profitFactor
                              )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Gross Profit
                        </div>

                        <div className="mt-2 text-lg font-black text-emerald-600">
                          {formatCurrency(
                            analytics.overview
                              .grossProfit
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Largest win
                        </span>

                        <span className="font-bold">
                          <PnlValue
                            value={
                              analytics.overview
                                .largestWin
                            }
                          />
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Largest loss
                        </span>

                        <span className="font-bold">
                          <PnlValue
                            value={
                              analytics.overview
                                .largestLoss
                            }
                            showPlus={false}
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Trade Mix
                      </div>

                      <h2 className="mt-2 text-lg font-bold">
                        Activity
                      </h2>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Closed trades
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Completed positions
                          </div>
                        </div>

                        <div className="text-xl font-black">
                          {
                            analytics.overview
                              .totalTrades
                          }
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Open trades
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Currently active positions
                          </div>
                        </div>

                        <div className="text-xl font-black">
                          {
                            analytics.overview
                              .openTrades
                          }
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Buy trades
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Recorded BUY activity
                          </div>
                        </div>

                        <div className="text-xl font-black">
                          {tradeStats.buyCount}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Sell trades
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Recorded SELL activity
                          </div>
                        </div>

                        <div className="text-xl font-black">
                          {tradeStats.sellCount}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">
                        Recorded trade volume
                      </div>

                      <div className="mt-1 text-lg font-black">
                        {formatCurrency(
                          tradeStats.totalVolume
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Symbol Performance */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Instrument Analysis
                      </div>

                      <h2 className="mt-2 text-lg font-bold">
                        Symbol Performance
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Realized results grouped by instrument.
                      </p>
                    </div>
                  </div>

                  {analytics.symbolPerformance
                    .length === 0 ? (
                    <EmptyState
                      title="No closed symbol results"
                      description="Symbol-level performance will appear after trades are closed and realized P&L is recorded."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            <th className="px-6 py-4">
                              Symbol
                            </th>

                            <th className="px-6 py-4">
                              Trades
                            </th>

                            <th className="px-6 py-4">
                              Wins
                            </th>

                            <th className="px-6 py-4">
                              Losses
                            </th>

                            <th className="px-6 py-4">
                              Win Rate
                            </th>

                            <th className="px-6 py-4 text-right">
                              Realized P&L
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {analytics.symbolPerformance.map(
                            (item) => (
                              <tr
                                key={item.symbol}
                                className="border-b border-slate-50 last:border-0"
                              >
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-900">
                                    {item.symbol}
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {item.trades}
                                </td>

                                <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                                  {item.wins}
                                </td>

                                <td className="px-6 py-4 text-sm font-semibold text-rose-600">
                                  {item.losses}
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-slate-900"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              item.winRate
                                            )
                                          )}%`,
                                        }}
                                      />
                                    </div>

                                    <span className="text-sm font-semibold text-slate-700">
                                      {formatNumber(
                                        item.winRate
                                      )}
                                      %
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-right text-sm font-bold">
                                  <PnlValue
                                    value={
                                      item.realizedPnL
                                    }
                                  />
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Trade History */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Execution History
                      </div>

                      <h2 className="mt-2 text-lg font-bold">
                        Trade History
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Review every recorded trade in this account.
                      </p>
                    </div>

                    <div className="flex rounded-xl bg-slate-100 p-1">
                      {(
                        [
                          "ALL",
                          "OPEN",
                          "CLOSED",
                        ] as const
                      ).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() =>
                            setTradeFilter(
                              filter
                            )
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                            tradeFilter ===
                            filter
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTrades.length ===
                  0 ? (
                    <EmptyState
                      title={
                        tradeFilter ===
                        "OPEN"
                          ? "No open trades"
                          : tradeFilter ===
                              "CLOSED"
                            ? "No closed trades"
                            : "No trades recorded"
                      }
                      description="Trade activity will appear here as orders are executed."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            <th className="px-6 py-4">
                              Instrument
                            </th>

                            <th className="px-6 py-4">
                              Side
                            </th>

                            <th className="px-6 py-4">
                              Quantity
                            </th>

                            <th className="px-6 py-4">
                              Entry
                            </th>

                            <th className="px-6 py-4">
                              Exit
                            </th>

                            <th className="px-6 py-4">
                              Status
                            </th>

                            <th className="px-6 py-4">
                              Opened
                            </th>

                            <th className="px-6 py-4 text-right">
                              Realized P&L
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredTrades.map(
                            (trade) => {
                              const isOpen =
                                trade.closedAt ===
                                null;

                              return (
                                <tr
                                  key={trade.id}
                                  className="border-b border-slate-50 last:border-0"
                                >
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">
                                      {trade.symbol}
                                    </div>

                                    <div className="mt-1 text-[11px] text-slate-400">
                                      {trade.id.slice(
                                        0,
                                        8
                                      )}
                                      ...
                                    </div>
                                  </td>

                                  <td className="px-6 py-4">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        trade.side ===
                                        "BUY"
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-rose-50 text-rose-700"
                                      }`}
                                    >
                                      {trade.side}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 text-sm font-semibold">
                                    {trade.quantity}
                                  </td>

                                  <td className="px-6 py-4 text-sm text-slate-600">
                                    {formatCurrency(
                                      trade.entryPrice
                                    )}
                                  </td>

                                  <td className="px-6 py-4 text-sm text-slate-600">
                                    {trade.exitPrice ===
                                    null
                                      ? "—"
                                      : formatCurrency(
                                          trade.exitPrice
                                        )}
                                  </td>

                                  <td className="px-6 py-4">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        isOpen
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {isOpen
                                        ? "OPEN"
                                        : "CLOSED"}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 text-xs text-slate-500">
                                    {formatDateTime(
                                      trade.openedAt
                                    )}
                                  </td>

                                  <td className="px-6 py-4 text-right text-sm font-bold">
                                    {isOpen ? (
                                      <span className="text-slate-400">
                                        —
                                      </span>
                                    ) : (
                                      <PnlValue
                                        value={
                                          trade.realizedPnL
                                        }
                                      />
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Learning Note */}
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white">
                      i
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Learning Perspective
                      </div>

                      <h2 className="mt-2 text-lg font-bold">
                        Analytics are most useful over time.
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        A small number of trades is not enough
                        to establish a reliable performance
                        pattern. Use these metrics to observe
                        your decisions, risk management, and
                        consistency as your simulated trading
                        history grows.
                      </p>

                      <Link
                        href="/learn"
                        className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-slate-500"
          >
            <span className="text-base">⌂</span>
            Home
          </Link>

          <Link
            href="/markets"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-slate-500"
          >
            <span className="text-base">◌</span>
            Markets
          </Link>

          <Link
            href="/portfolio"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-slate-500"
          >
            <span className="text-base">▣</span>
            Portfolio
          </Link>

          <Link
            href="/analytics"
            className="flex flex-col items-center gap-1 rounded-xl bg-slate-950 px-2 py-2 text-[10px] font-semibold text-white"
          >
            <span className="text-base">↗</span>
            Analytics
          </Link>

          <Link
            href="/learn"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-slate-500"
          >
            <span className="text-base">◇</span>
            Learn
          </Link>
        </div>
      </nav>
    </div>
  );
}
