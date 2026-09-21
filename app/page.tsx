"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type Portfolio = {
  currency: string;
  cashBalance: string | number;
  holdingsValue: string | number;
  totalValue: string | number;
  realizedPnL: string | number;
  unrealizedPnL: string | number;
  totalPnL: string | number;
  totalReturnPercentage: string | number;
  positions: Position[];
};

type Position = {
  symbol: string;
  name: string;
  quantity: number;
  averageEntryPrice: string | number;
  currentPrice: string | number;
  marketValue: string | number;
  unrealizedPnL: string | number;
  unrealizedPnLPercentage: string | number;
};

type Order = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: number;
  status: string;
  createdAt: string;
  execution: {
    executedPrice: string;
    executedQuantity: number;
  } | null;
};

type ProgressRecord = {
  lessonId: string;
};

type RiskData = {
  score: number;
  level: string;
  concentrationPercentage: number;
  cashPercentage: number;
  drawdownPercentage: number;
  largestPositionPercentage: number;
  signals: string[];
};

type Course = {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
  }[];
};

const COURSES: Course[] = [
  {
    id: "foundations",
    title: "Market Foundations",
    lessons: [
      {
        id: "market-basics",
        title: "Understanding Markets",
      },
      {
        id: "market-orders",
        title: "Market Orders",
      },
      {
        id: "limit-orders",
        title: "Limit Orders",
      },
      {
        id: "fees-slippage",
        title: "Fees & Slippage",
      },
    ],
  },
  {
    id: "risk",
    title: "Risk Management",
    lessons: [
      {
        id: "position-sizing",
        title: "Position Sizing",
      },
      {
        id: "stop-loss",
        title: "Stop Loss",
      },
      {
        id: "drawdown",
        title: "Drawdown",
      },
      {
        id: "concentration",
        title: "Concentration Risk",
      },
    ],
  },
  {
    id: "psychology",
    title: "Trading Psychology",
    lessons: [
      {
        id: "emotions",
        title: "Emotions & Trading",
      },
      {
        id: "fomo",
        title: "Avoiding FOMO",
      },
      {
        id: "journaling",
        title: "Trading Journaling",
      },
      {
        id: "consistency",
        title: "Building Consistency",
      },
    ],
  },
];

function toNumber(
  value: string | number | null | undefined,
  fallback = 0
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function formatINR(
  value: string | number
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatPercent(
  value: string | number
) {
  const numericValue = toNumber(value);

  return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(
    2
  )}%`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "U";
  }

  const parts = trimmedName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
}

function getRiskLevelClasses(
  level: string
) {
  switch (level.toUpperCase()) {
    case "LOW":
      return {
        badge:
          "bg-emerald-50 text-emerald-700",
        bar: "bg-emerald-500",
        text: "text-emerald-600",
      };

    case "MODERATE":
      return {
        badge:
          "bg-amber-50 text-amber-700",
        bar: "bg-amber-500",
        text: "text-amber-600",
      };

    case "HIGH":
      return {
        badge:
          "bg-orange-50 text-orange-700",
        bar: "bg-orange-500",
        text: "text-orange-600",
      };

    case "CRITICAL":
      return {
        badge:
          "bg-red-50 text-red-700",
        bar: "bg-red-500",
        text: "text-red-600",
      };

    default:
      return {
        badge:
          "bg-slate-100 text-slate-600",
        bar: "bg-slate-500",
        text: "text-slate-600",
      };
  }
}

function normalizeRiskData(
  data: Record<string, unknown>
): RiskData {
  const risk =
    (data.risk as Record<string, unknown>) ??
    data;

  const numberValue = (
    value: unknown,
    fallback = 0
  ) => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  };

  const signals =
    Array.isArray(risk.signals)
      ? risk.signals.filter(
          (item): item is string =>
            typeof item === "string"
        )
      : Array.isArray(risk.warnings)
        ? risk.warnings.filter(
            (item): item is string =>
              typeof item === "string"
          )
        : [];

  return {
    score: numberValue(
      risk.score ??
        risk.riskScore
    ),

    level:
      typeof risk.level === "string"
        ? risk.level
        : typeof risk.riskLevel ===
            "string"
          ? risk.riskLevel
          : "UNKNOWN",

    concentrationPercentage:
      numberValue(
        risk.concentrationPercentage ??
          risk.concentrationRisk ??
          risk.largestPositionPercentage
      ),

    cashPercentage:
      numberValue(
        risk.cashPercentage
      ),

    drawdownPercentage:
      numberValue(
        risk.drawdownPercentage ??
          risk.drawdown
      ),

    largestPositionPercentage:
      numberValue(
        risk.largestPositionPercentage ??
          risk.concentrationPercentage
      ),

    signals,
  };
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [portfolio, setPortfolio] =
    useState<Portfolio | null>(null);

  const [orders, setOrders] = useState<
    Order[]
  >([]);

  const [progress, setProgress] =
    useState<ProgressRecord[]>([]);

  const [risk, setRisk] =
    useState<RiskData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [riskLoading, setRiskLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [riskError, setRiskError] =
    useState("");

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch(
          "/api/v1/auth/me",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          !data.success ||
          !data.user
        ) {
          return;
        }

        setCurrentUser(data.user);
      } catch (error) {
        console.error(
          "Current user loading error:",
          error
        );
      }
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          portfolioResponse,
          ordersResponse,
          progressResponse,
        ] = await Promise.all([
          fetch(
            "/api/v1/portfolio",
            {
              cache: "no-store",
            }
          ),

          fetch(
            "/api/v1/orders",
            {
              cache: "no-store",
            }
          ),

          fetch(
            "/api/v1/learn/progress",
            {
              cache: "no-store",
            }
          ),
        ]);

        const portfolioData =
          await portfolioResponse.json();

        const ordersData =
          await ordersResponse.json();

        const progressData =
          await progressResponse.json();

        if (
          !portfolioResponse.ok ||
          !portfolioData.success
        ) {
          throw new Error(
            portfolioData.error ||
              "Failed to load portfolio"
          );
        }

        if (
          !ordersResponse.ok ||
          !ordersData.success
        ) {
          throw new Error(
            ordersData.error ||
              "Failed to load orders"
          );
        }

        if (
          !progressResponse.ok ||
          !progressData.success
        ) {
          throw new Error(
            progressData.error ||
              "Failed to load learning progress"
          );
        }

        setPortfolio(
          portfolioData.portfolio
        );

        setOrders(
          ordersData.orders
        );

        setProgress(
          progressData.progress
        );
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadRisk() {
      try {
        setRiskLoading(true);
        setRiskError("");

        const response = await fetch(
          "/api/v1/risk",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Failed to load risk overview"
          );
        }

        setRisk(
          normalizeRiskData(data)
        );
      } catch (error) {
        console.error(
          "Risk loading error:",
          error
        );

        setRiskError(
          error instanceof Error
            ? error.message
            : "Failed to load risk overview"
        );
      } finally {
        setRiskLoading(false);
      }
    }

    loadCurrentUser();
    loadDashboard();
    loadRisk();
  }, []);

  const displayName =
    currentUser?.displayName ??
    "Loading...";

  const initials = currentUser
    ? getInitials(
        currentUser.displayName
      )
    : "…";

  const completedLessons =
    progress.length;

  const totalLessons =
    COURSES.reduce(
      (total, course) =>
        total + course.lessons.length,
      0
    );

  const learningProgress =
    totalLessons > 0
      ? Math.round(
          (completedLessons /
            totalLessons) *
            100
        )
      : 0;

  const continueLesson = useMemo(() => {
    const completedIds = new Set(
      progress.map(
        (item) => item.lessonId
      )
    );

    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (
          !completedIds.has(
            lesson.id
          )
        ) {
          return lesson;
        }
      }
    }

    return null;
  }, [progress]);

  const recentOrders =
    orders.slice(0, 5);

  const topPositions =
    portfolio?.positions
      .slice()
      .sort(
        (a, b) =>
          toNumber(b.marketValue) -
          toNumber(a.marketValue)
      )
      .slice(0, 4) ?? [];

  const pnlPositive =
    toNumber(
      portfolio?.totalPnL
    ) >= 0;

  const unrealizedPositive =
    toNumber(
      portfolio?.unrealizedPnL
    ) >= 0;

  const riskClasses =
    getRiskLevelClasses(
      risk?.level ?? "UNKNOWN"
    );

  const riskScore =
    Math.min(
      100,
      Math.max(
        0,
        risk?.score ?? 0
      )
    );

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#111827] lg:ml-64">
      <section className="min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Workspace
              </div>

              <h1 className="text-lg font-bold tracking-tight">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/trade"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                + Trade
              </Link>

              {/* Dynamic profile avatar */}
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                {currentUser?.avatarUrl ? (
                  <Image
                    src={
                      currentUser.avatarUrl
                    }
                    alt={displayName}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8">
          {/* Hero */}
          <section className="mb-7">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500">
                  Welcome back,{" "}
                  <span className="font-semibold text-slate-700">
                    {displayName}
                  </span>
                </p>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Your trading workspace
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Track your simulated portfolio,
                  review your trades, and keep
                  building disciplined trading habits.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/markets"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Markets
                </Link>

                <Link
                  href="/learn"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Learn
                </Link>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Portfolio stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Portfolio Value"
              value={
                loading
                  ? "Loading..."
                  : formatINR(
                      portfolio?.totalValue ??
                        0
                    )
              }
              helper="Current simulated equity"
            />

            <StatCard
              label="Total P&L"
              value={
                loading
                  ? "Loading..."
                  : formatINR(
                      portfolio?.totalPnL ??
                        0
                    )
              }
              helper={
                loading
                  ? "Loading..."
                  : formatPercent(
                      portfolio
                        ?.totalReturnPercentage ??
                        0
                    )
              }
              positive={
                !loading
                  ? pnlPositive
                  : undefined
              }
            />

            <StatCard
              label="Cash Balance"
              value={
                loading
                  ? "Loading..."
                  : formatINR(
                      portfolio?.cashBalance ??
                        0
                    )
              }
              helper="Available simulated cash"
            />

            <StatCard
              label="Unrealized P&L"
              value={
                loading
                  ? "Loading..."
                  : formatINR(
                      portfolio?.unrealizedPnL ??
                        0
                    )
              }
              helper="Open position performance"
              positive={
                !loading
                  ? unrealizedPositive
                  : undefined
              }
            />
          </section>

          {/* Risk Overview */}
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold">
                  Risk Overview
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Educational risk indicators based on
                  your current simulated portfolio.
                </p>
              </div>

              <Link
                href="/portfolio"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Detailed risk view →
              </Link>
            </div>

            {riskError && (
              <div className="px-5 py-4 text-sm text-red-600">
                {riskError}
              </div>
            )}

            {riskLoading ? (
              <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : risk ? (
              <>
                <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
                  <RiskMetric
                    label="Risk Score"
                    value={`${riskScore}/100`}
                    description="Overall educational risk score"
                    accent={riskClasses.text}
                  />

                  <RiskMetric
                    label="Risk Level"
                    value={risk.level}
                    description="Current portfolio risk band"
                    badgeClass={riskClasses.badge}
                  />

                  <RiskMetric
                    label="Largest Exposure"
                    value={`${risk.largestPositionPercentage.toFixed(
                      1
                    )}%`}
                    description="Share of portfolio in largest position"
                  />

                  <RiskMetric
                    label="Cash Allocation"
                    value={`${risk.cashPercentage.toFixed(
                      1
                    )}%`}
                    description="Current portfolio held as cash"
                  />
                </div>

                <div className="grid gap-6 border-t border-slate-200 p-5 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Overall Risk Score
                      </span>

                      <span
                        className={`text-xs font-bold ${riskClasses.text}`}
                      >
                        {riskScore}/100
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${riskClasses.bar}`}
                        style={{
                          width: `${riskScore}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                      <span>Lower risk</span>
                      <span>Higher risk</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-600">
                      Risk Signals
                    </div>

                    {risk.signals.length >
                    0 ? (
                      <div className="mt-3 space-y-2">
                        {risk.signals
                          .slice(0, 3)
                          .map(
                            (
                              signal,
                              index
                            ) => (
                              <div
                                key={`${signal}-${index}`}
                                className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                              >
                                {signal}
                              </div>
                            )
                          )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        No current risk signals
                        were reported.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid border-t border-slate-200 sm:grid-cols-3">
                  <RiskBar
                    label="Concentration"
                    value={
                      risk.largestPositionPercentage
                    }
                    suffix="%"
                  />

                  <RiskBar
                    label="Cash"
                    value={
                      risk.cashPercentage
                    }
                    suffix="%"
                  />

                  <RiskBar
                    label="Drawdown"
                    value={Math.abs(
                      risk.drawdownPercentage
                    )}
                    suffix="%"
                  />
                </div>
              </>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Risk information is currently
                unavailable.
              </div>
            )}
          </section>

          {/* Positions + Learning */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
            {/* Positions */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold">
                    Open Positions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Your current simulated holdings
                  </p>
                </div>

                <Link
                  href="/portfolio"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View portfolio →
                </Link>
              </div>

              {loading ? (
                <LoadingRows count={3} />
              ) : topPositions.length === 0 ? (
                <EmptyState
                  title="No open positions"
                  description="Place your first simulated trade to start building a portfolio."
                  actionHref="/trade"
                  actionLabel="Start trading"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {topPositions.map(
                    (position) => (
                      <div
                        key={position.symbol}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold">
                            {position.symbol.slice(
                              0,
                              2
                            )}
                          </div>

                          <div>
                            <div className="text-sm font-bold">
                              {position.symbol}
                            </div>

                            <div className="text-xs text-slate-500">
                              {position.quantity}{" "}
                              shares · Avg{" "}
                              {formatINR(
                                position.averageEntryPrice
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-sm font-semibold">
                            {formatINR(
                              position.marketValue
                            )}
                          </div>

                          <div
                            className={`mt-1 text-xs font-semibold ${
                              toNumber(
                                position.unrealizedPnL
                              ) >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatINR(
                              position.unrealizedPnL
                            )}{" "}
                            (
                            {formatPercent(
                              position.unrealizedPnLPercentage
                            )}
                            )
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Learning */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">
                      Learning Progress
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Build knowledge alongside your
                      trading practice.
                    </p>
                  </div>

                  <span className="text-sm font-bold">
                    {learningProgress}%
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${learningProgress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {completedLessons} of{" "}
                  {totalLessons} lessons completed
                </div>
              </div>

              <div className="p-5">
                {continueLesson ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Continue Learning
                    </div>

                    <div className="mt-2 text-base font-bold">
                      {continueLesson.title}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Continue your structured learning
                      path and strengthen your trading
                      fundamentals.
                    </p>

                    <Link
                      href={`/learn/${continueLesson.id}`}
                      className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Continue lesson →
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-base font-bold">
                      Learning path complete
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      You have completed all available
                      lessons.
                    </p>

                    <Link
                      href="/learn"
                      className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                    >
                      Review lessons
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Orders + Quick actions */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold">
                    Recent Orders
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest activity in your simulated
                    account
                  </p>
                </div>

                <Link
                  href="/orders"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all →
                </Link>
              </div>

              {loading ? (
                <LoadingRows count={4} />
              ) : recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="Your executed and pending orders will appear here."
                  actionHref="/trade"
                  actionLabel="Place order"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentOrders.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                              order.side ===
                              "BUY"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {order.side ===
                            "BUY"
                              ? "B"
                              : "S"}
                          </div>

                          <div>
                            <div className="text-sm font-bold">
                              {order.side}{" "}
                              {order.symbol}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {order.quantity}{" "}
                              shares ·{" "}
                              {order.type}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              order.status ===
                              "FILLED"
                                ? "bg-emerald-50 text-emerald-700"
                                : order.status ===
                                    "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {order.status}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {formatTime(
                              order.createdAt
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-bold">
                  Quick Actions
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Jump directly into your workflow.
                </p>
              </div>

              <div className="grid gap-3 p-5">
                <QuickAction
                  href="/trade"
                  title="Place a Trade"
                  description="Buy or sell a simulated instrument."
                />

                <QuickAction
                  href="/portfolio"
                  title="Review Portfolio"
                  description="Inspect holdings and allocation."
                />

                <QuickAction
                  href="/journal"
                  title="Trading Journal"
                  description="Review your trading decisions."
                />

                <QuickAction
                  href="/analytics"
                  title="View Analytics"
                  description="Study your trading performance."
                />
              </div>
            </div>
          </section>

          {/* Account overview */}
          <section className="mt-6 grid gap-6 md:grid-cols-3">
            <InfoCard
              label="Open Positions"
              value={
                loading
                  ? "—"
                  : String(
                      portfolio?.positions
                        .length ?? 0
                    )
              }
              description="Active holdings in your account"
            />

            <InfoCard
              label="Orders"
              value={
                loading
                  ? "—"
                  : String(orders.length)
              }
              description="Orders recorded in your account"
            />

            <InfoCard
              label="Lessons Completed"
              value={`${completedLessons}/${totalLessons}`}
              description="Progress through the learning path"
            />
          </section>

          {/* Educational note */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                YGO Lab Learning Principle
              </div>

              <h3 className="mt-2 text-lg font-bold">
                Practice execution, understand risk,
                review your decisions.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                YGO Lab Sim is designed to combine
                paper trading with structured learning.
                Use the simulated environment to understand
                orders, position sizing, risk, journaling,
                and performance before applying those
                concepts elsewhere.
              </p>

              <Link
                href="/learn"
                className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Explore learning path →
              </Link>
            </div>
          </section>
        </div>
      </section>

      {/* Mobile navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          <MobileNav
            href="/"
            label="Home"
            active
          />

          <MobileNav
            href="/markets"
            label="Markets"
          />

          <MobileNav
            href="/trade"
            label="Trade"
          />

          <MobileNav
            href="/portfolio"
            label="Portfolio"
          />

          <MobileNav
            href="/learn"
            label="Learn"
          />
        </div>
      </div>
    </main>
  );
}

function MobileNav({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-500"
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({
  label,
  value,
  helper,
  positive,
}: {
  label: string;
  value: string;
  helper: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-3 text-xl font-bold tracking-tight ${
          positive === true
            ? "text-emerald-600"
            : positive === false
              ? "text-red-600"
              : "text-slate-900"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {helper}
      </div>
    </div>
  );
}

function RiskMetric({
  label,
  value,
  description,
  accent,
  badgeClass,
}: {
  label: string;
  value: string;
  description: string;
  accent?: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {badgeClass ? (
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass}`}
          >
            {value}
          </span>
        ) : (
          <span
            className={`text-lg font-bold ${
              accent ?? "text-slate-900"
            }`}
          >
            {value}
          </span>
        )}
      </div>

      <div className="mt-1 text-[11px] leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function RiskBar({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  const safeValue = Math.min(
    100,
    Math.max(0, value)
  );

  return (
    <div className="border-b border-slate-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>

        <span className="text-xs font-bold">
          {safeValue.toFixed(1)}
          {suffix}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-3 text-2xl font-bold">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {description}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="text-sm font-bold">
        {title}
      </div>

      <div className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-sm font-bold">
        {title}
      </div>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

      <Link
        href={actionHref}
        className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function LoadingRows({
  count,
}: {
  count: number;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />

              <div>
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />

                <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            </div>

            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        )
      )}
    </div>
  );
}
