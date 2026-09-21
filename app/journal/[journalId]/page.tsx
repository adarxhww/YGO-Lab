"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EmotionalState =
  | "CALM"
  | "ANXIOUS"
  | "OVERCONFIDENT"
  | "FOMO"
  | "REVENUE_SEEKING"
  | "NEUTRAL";

type JournalEntry = {
  id: string;
  tradeId: string;
  entryReason: string;
  strategy: string;
  expectedOutcome: string;
  stopLossPrice: string | number | null;
  targetPrice: string | number | null;
  confidenceRating: number;
  emotionalState: EmotionalState;
  trade: {
    id: string;
    side: "BUY" | "SELL";
    quantity: number;
    entryPrice: string | number;
    exitPrice: string | number | null;
    realizedPnL: string | number;
    openedAt: string;
    closedAt: string | null;
    instrument: {
      symbol: string;
      name: string;
      exchange: string;
    };
  };
};

type JournalResponse = {
  success: boolean;
  journalEntries?: JournalEntry[];
  error?: string;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatNumber(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function formatEmotion(emotion: EmotionalState) {
  switch (emotion) {
    case "CALM":
      return "Calm";
    case "ANXIOUS":
      return "Anxious";
    case "OVERCONFIDENT":
      return "Overconfident";
    case "FOMO":
      return "FOMO";
    case "REVENUE_SEEKING":
      return "Revenue Seeking";
    default:
      return "Neutral";
  }
}

function emotionIcon(emotion: EmotionalState) {
  switch (emotion) {
    case "CALM":
      return "◉";
    case "ANXIOUS":
      return "!";
    case "OVERCONFIDENT":
      return "↑";
    case "FOMO":
      return "⚡";
    case "REVENUE_SEEKING":
      return "₹";
    default:
      return "•";
  }
}

function getPnLClass(value: string | number | null | undefined) {
  const pnl = toNumber(value);

  if (pnl > 0) {
    return "text-emerald-600";
  }

  if (pnl < 0) {
    return "text-rose-600";
  }

  return "text-slate-600";
}

function getConfidenceLabel(rating: number) {
  if (rating >= 8) {
    return "High";
  }

  if (rating >= 5) {
    return "Moderate";
  }

  return "Low";
}

function calculateHoldingDuration(
  openedAt: string,
  closedAt: string | null
) {
  if (!closedAt) {
    return "Position open";
  }

  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "—";
  }

  const difference = Math.max(0, end - start);

  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function calculateRiskReward(
  entryPrice: string | number,
  stopLossPrice: string | number | null,
  targetPrice: string | number | null,
  side: "BUY" | "SELL"
) {
  const entry = toNumber(entryPrice);
  const stop = toNumber(stopLossPrice);
  const target = toNumber(targetPrice);

  if (!entry || !stop || !target) {
    return null;
  }

  let risk: number;
  let reward: number;

  if (side === "BUY") {
    risk = entry - stop;
    reward = target - entry;
  } else {
    risk = stop - entry;
    reward = entry - target;
  }

  if (risk <= 0 || reward <= 0) {
    return null;
  }

  return reward / risk;
}

export default function JournalDetailPage({
  params,
}: {
  params: Promise<{ journalId: string }>;
}) {
  const [journalId, setJournalId] = useState("");
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadParams() {
      const resolvedParams = await params;

      if (!cancelled) {
        setJournalId(resolvedParams.journalId);
      }
    }

    loadParams();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!journalId) {
      return;
    }

    let cancelled = false;

    async function loadJournalEntry() {
      try {
        setLoading(true);
        setError("");
        setEntry(null);

        const response = await fetch("/api/v1/journal", {
          method: "GET",
          cache: "no-store",
        });

        const data: JournalResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to load journal entry"
          );
        }

        const matchedEntry = (data.journalEntries ?? []).find(
          (item) => item.id === journalId
        );

        if (!matchedEntry) {
          throw new Error("Journal entry not found");
        }

        if (!cancelled) {
          setEntry(matchedEntry);
        }
      } catch (error) {
        console.error(
          "Failed to load journal entry:",
          error
        );

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load journal entry"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJournalEntry();

    return () => {
      cancelled = true;
    };
  }, [journalId]);

  const analytics = useMemo(() => {
    if (!entry) {
      return null;
    }

    const riskReward = calculateRiskReward(
      entry.trade.entryPrice,
      entry.stopLossPrice,
      entry.targetPrice,
      entry.trade.side
    );

    const entryPrice = toNumber(entry.trade.entryPrice);
    const exitPrice = toNumber(entry.trade.exitPrice);
    const stopLoss = toNumber(entry.stopLossPrice);
    const target = toNumber(entry.targetPrice);

    let returnPercentage: number | null = null;

    if (entry.trade.exitPrice !== null && entryPrice > 0) {
      if (entry.trade.side === "BUY") {
        returnPercentage =
          ((exitPrice - entryPrice) / entryPrice) * 100;
      } else {
        returnPercentage =
          ((entryPrice - exitPrice) / entryPrice) * 100;
      }
    }

    let stopDistancePercentage: number | null = null;

    if (entryPrice > 0 && stopLoss > 0) {
      stopDistancePercentage =
        entry.trade.side === "BUY"
          ? ((entryPrice - stopLoss) / entryPrice) * 100
          : ((stopLoss - entryPrice) / entryPrice) * 100;
    }

    let targetDistancePercentage: number | null = null;

    if (entryPrice > 0 && target > 0) {
      targetDistancePercentage =
        entry.trade.side === "BUY"
          ? ((target - entryPrice) / entryPrice) * 100
          : ((entryPrice - target) / entryPrice) * 100;
    }

    return {
      riskReward,
      returnPercentage,
      stopDistancePercentage,
      targetDistancePercentage,
      holdingDuration: calculateHoldingDuration(
        entry.trade.openedAt,
        entry.trade.closedAt
      ),
    };
  }, [entry]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <main className="lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Trading Journal
              </div>

              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Trade Review
              </h1>
            </div>

            <Link
              href="/journal"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              ← Back to Journal
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-7 pb-24 sm:px-8">
          {loading && <DetailLoadingState />}

          {!loading && error && (
            <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-600">
                !
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Journal entry unavailable
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {error}
              </p>

              <Link
                href="/journal"
                className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Return to Journal
              </Link>
            </div>
          )}

          {!loading && !error && entry && (
            <>
              <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                        {entry.trade.instrument.symbol.slice(0, 2)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {entry.trade.instrument.symbol}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              entry.trade.side === "BUY"
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-rose-400/15 text-rose-300"
                            }`}
                          >
                            {entry.trade.side}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              entry.trade.closedAt
                                ? "bg-white/10 text-slate-300"
                                : "bg-blue-400/15 text-blue-300"
                            }`}
                          >
                            {entry.trade.closedAt
                              ? "Closed"
                              : "Open"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-300">
                          {entry.trade.instrument.name} •{" "}
                          {entry.trade.instrument.exchange}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Trade ID: {entry.tradeId}
                        </p>
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Journal recorded
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-200">
                        {formatDate(entry.trade.openedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <SectionHeading
                  title="Trade Overview"
                  description="The key numbers behind this position."
                />

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <OverviewCard
                    label="Quantity"
                    value={formatNumber(entry.trade.quantity)}
                  />

                  <OverviewCard
                    label="Entry Price"
                    value={formatCurrency(
                      entry.trade.entryPrice
                    )}
                  />

                  <OverviewCard
                    label="Exit Price"
                    value={
                      entry.trade.exitPrice !== null
                        ? formatCurrency(entry.trade.exitPrice)
                        : "Position Open"
                    }
                  />

                  <OverviewCard
                    label="Realized P&L"
                    value={
                      entry.trade.closedAt
                        ? formatCurrency(entry.trade.realizedPnL)
                        : "Not realized"
                    }
                    valueClassName={
                      entry.trade.closedAt
                        ? getPnLClass(entry.trade.realizedPnL)
                        : "text-slate-500"
                    }
                  />
                </div>
              </section>

              <section className="mt-8">
                <SectionHeading
                  title="Trade Performance"
                  description="A compact view of the position's outcome and timing."
                />

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <PerformanceCard
                    label="Holding Period"
                    value={analytics?.holdingDuration ?? "—"}
                    icon="◷"
                  />

                  <PerformanceCard
                    label="Return"
                    value={
                      analytics?.returnPercentage !== null &&
                      analytics?.returnPercentage !== undefined
                        ? `${
                            analytics.returnPercentage >= 0
                              ? "+"
                              : ""
                          }${analytics.returnPercentage.toFixed(2)}%`
                        : "Open"
                    }
                    icon="↗"
                    valueClassName={
                      analytics?.returnPercentage !== null &&
                      analytics?.returnPercentage !== undefined
                        ? getPnLClass(
                            analytics.returnPercentage
                          )
                        : undefined
                    }
                  />

                  <PerformanceCard
                    label="Risk / Reward"
                    value={
                      analytics?.riskReward
                        ? `1 : ${analytics.riskReward.toFixed(2)}`
                        : "Not available"
                    }
                    icon="◈"
                  />

                  <PerformanceCard
                    label="Confidence"
                    value={`${entry.confidenceRating}/10`}
                    icon="◎"
                  />
                </div>
              </section>

              <section className="mt-8">
                <SectionHeading
                  title="Decision Journal"
                  description="What you were thinking when the trade was taken."
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <JournalTextCard
                    title="Why did I enter?"
                    content={entry.entryReason}
                  />

                  <JournalTextCard
                    title="Expected outcome"
                    content={entry.expectedOutcome}
                  />
                </div>
              </section>

              <section className="mt-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Strategy
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                    <div className="text-xl font-bold text-slate-900">
                      {entry.strategy}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      The strategy recorded for this trade.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Emotional State
                  </div>

                  <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold shadow-sm">
                      {emotionIcon(entry.emotionalState)}
                    </div>

                    <div>
                      <div className="text-xl font-bold text-slate-900">
                        {formatEmotion(entry.emotionalState)}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Emotional state recorded before the trade.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <SectionHeading
                  title="Risk Plan"
                  description="The risk levels recorded before entering the position."
                />

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <RiskCard
                      label="Entry Price"
                      value={formatCurrency(
                        entry.trade.entryPrice
                      )}
                      description="Actual simulated execution price"
                      tone="neutral"
                    />

                    <RiskCard
                      label="Stop Loss"
                      value={
                        entry.stopLossPrice !== null
                          ? formatCurrency(entry.stopLossPrice)
                          : "Not specified"
                      }
                      description={
                        analytics?.stopDistancePercentage !== null &&
                        analytics?.stopDistancePercentage !== undefined
                          ? `${analytics.stopDistancePercentage.toFixed(
                              2
                            )}% from entry`
                          : "No stop distance available"
                      }
                      tone="loss"
                    />

                    <RiskCard
                      label="Target"
                      value={
                        entry.targetPrice !== null
                          ? formatCurrency(entry.targetPrice)
                          : "Not specified"
                      }
                      description={
                        analytics?.targetDistancePercentage !== null &&
                        analytics?.targetDistancePercentage !== undefined
                          ? `${analytics.targetDistancePercentage.toFixed(
                              2
                            )}% from entry`
                          : "No target distance available"
                      }
                      tone="gain"
                    />
                  </div>

                  {analytics?.riskReward && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            Planned risk / reward
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            Based on the recorded stop loss and target.
                          </p>
                        </div>

                        <div className="text-xl font-bold text-slate-950">
                          1 : {analytics.riskReward.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-8">
                <SectionHeading
                  title="Confidence Assessment"
                  description="How strongly you believed in the trade when it was recorded."
                />

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Confidence Rating
                      </div>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight">
                          {entry.confidenceRating}
                        </span>

                        <span className="text-sm font-semibold text-slate-400">
                          / 10
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-500">
                      {getConfidenceLabel(
                        entry.confidenceRating
                      )}
                    </div>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{
                        width: `${entry.confidenceRating * 10}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <SectionHeading
                  title="Trade Timeline"
                  description="Important timestamps for this position."
                />

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <TimelineItem
                    title="Position opened"
                    date={formatDateTime(entry.trade.openedAt)}
                    description={`Bought ${formatNumber(
                      entry.trade.quantity
                    )} ${
                      entry.trade.instrument.symbol
                    } at ${formatCurrency(
                      entry.trade.entryPrice
                    )}.`}
                    active
                  />

                  <TimelineItem
                    title={
                      entry.trade.closedAt
                        ? "Position closed"
                        : "Position remains open"
                    }
                    date={
                      entry.trade.closedAt
                        ? formatDateTime(entry.trade.closedAt)
                        : "Currently open"
                    }
                    description={
                      entry.trade.closedAt
                        ? `Position closed at ${formatCurrency(
                            entry.trade.exitPrice
                          )} with realized P&L of ${formatCurrency(
                            entry.trade.realizedPnL
                          )}.`
                        : "The position has not been closed yet, so realized P&L is not available."
                    }
                    active={Boolean(entry.trade.closedAt)}
                  />
                </div>
              </section>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/journal"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  ← Back to Journal
                </Link>

                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Continue Learning →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-3 text-xl font-bold tracking-tight ${
          valueClassName ?? "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PerformanceCard({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </div>

          <div
            className={`mt-3 text-xl font-bold tracking-tight ${
              valueClassName ?? "text-slate-900"
            }`}
          >
            {value}
          </div>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function JournalTextCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm leading-7 text-slate-600">
          {content}
        </p>
      </div>
    </div>
  );
}

function RiskCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: "neutral" | "loss" | "gain";
}) {
  const toneClasses = {
    neutral: "bg-slate-50 text-slate-800",
    loss: "bg-rose-50 text-rose-700",
    gain: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl p-5 ${toneClasses[tone]}`}>
      <div className="text-xs font-bold uppercase tracking-[0.12em] opacity-60">
        {label}
      </div>

      <div className="mt-3 text-xl font-bold">
        {value}
      </div>

      <p className="mt-2 text-xs leading-5 opacity-70">
        {description}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  description,
  active,
}: {
  title: string;
  date: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-7 last:pb-0">
      <div className="relative flex w-5 shrink-0 justify-center">
        <div
          className={`mt-1 h-3 w-3 rounded-full ring-4 ring-white ${
            active ? "bg-slate-950" : "bg-slate-300"
          }`}
        />

        <div className="absolute top-4 h-full w-px bg-slate-200" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col justify-between gap-1 sm:flex-row">
          <div className="text-sm font-bold text-slate-800">
            {title}
          </div>

          <div className="text-xs font-medium text-slate-400">
            {date}
          </div>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function DetailLoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl bg-slate-200"
          />
        ))}
      </div>

      <div className="h-8 w-48 rounded bg-slate-200" />

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-40 rounded-3xl bg-slate-200"
          />
        ))}
      </div>

      <div className="h-56 rounded-3xl bg-slate-200" />
    </div>
  );
}
