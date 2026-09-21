"use client";

import { useMemo } from "react";

type Snapshot = {
  id: string;
  totalValue: number | string;
  cashBalance: number | string;
  holdingsValue: number | string;
  unrealizedPnL: number | string;
  realizedPnL: number | string;
  timestamp: string;
};

type PortfolioPerformanceChartProps = {
  snapshots: Snapshot[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export default function PortfolioPerformanceChart({
  snapshots,
}: PortfolioPerformanceChartProps) {
  const chart = useMemo(() => {
    const values = snapshots.map((snapshot) =>
      Number(snapshot.totalValue)
    );

    if (values.length === 0) {
      return null;
    }

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
    const height = 300;
    const leftPadding = 55;
    const rightPadding = 20;
    const topPadding = 25;
    const bottomPadding = 45;

    const chartWidth =
      width - leftPadding - rightPadding;

    const chartHeight =
      height - topPadding - bottomPadding;

    const points = snapshots.map(
      (snapshot, index) => {
        const value = Number(snapshot.totalValue);

        const x =
          snapshots.length === 1
            ? leftPadding + chartWidth / 2
            : leftPadding +
              (index /
                (snapshots.length - 1)) *
                chartWidth;

        const y =
          topPadding +
          ((max - value) /
            (max - min)) *
            chartHeight;

        return {
          x,
          y,
          value,
          timestamp: snapshot.timestamp,
        };
      }
    );

    const linePath = points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${
            height - bottomPadding
          } L ${points[0].x} ${
            height - bottomPadding
          } Z`
        : "";

    const startValue = values[0];
    const latestValue =
      values[values.length - 1];

    const change = latestValue - startValue;

    const changePercentage =
      startValue !== 0
        ? (change / startValue) * 100
        : 0;

    const yLabels = [
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
      chartWidth,
      chartHeight,
      points,
      linePath,
      areaPath,
      yLabels,
      startValue,
      latestValue,
      change,
      changePercentage,
    };
  }, [snapshots]);

  if (!chart) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Portfolio Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical portfolio value based on saved
            snapshots.
          </p>
        </div>

        <div className="flex min-h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
              ↗
            </div>

            <h3 className="mt-5 text-base font-bold">
              No performance history yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Portfolio snapshots will appear here as
              historical performance data is recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = chart.change >= 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Performance
          </div>

          <h2 className="mt-2 text-lg font-bold tracking-tight">
            Portfolio Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical portfolio value from saved
            snapshots.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div
            className={`text-sm font-bold ${
              isPositive
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {formatCurrency(chart.change)}
          </div>

          <div
            className={`mt-1 text-xs font-semibold ${
              isPositive
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {chart.changePercentage.toFixed(2)}%
          </div>

          <div className="mt-1 text-[10px] text-slate-400">
            Since first snapshot
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
            {chart.yLabels.map(
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
                      strokeWidth="1"
                    />

                    <text
                      x={chart.leftPadding - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[11px]"
                    >
                      {formatCurrency(label)}
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
              className={
                isPositive
                  ? "text-emerald-500"
                  : "text-rose-500"
              }
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
                    className={
                      isPositive
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }
                    strokeWidth="3"
                  />

                  {(index === 0 ||
                    index ===
                      chart.points.length - 1) && (
                    <text
                      x={point.x}
                      y={
                        chart.height -
                        15
                      }
                      textAnchor={
                        index === 0
                          ? "start"
                          : "end"
                      }
                      className="fill-slate-400 text-[11px]"
                    >
                      {formatDate(
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

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            First Snapshot
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCurrency(
              chart.startValue
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Latest Value
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCurrency(
              chart.latestValue
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Snapshots
          </div>

          <div className="mt-1 text-sm font-bold text-slate-900">
            {snapshots.length}
          </div>
        </div>
      </div>
    </div>
  );
}
