"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Side = "BUY" | "SELL";

type OrderType = "MARKET" | "LIMIT";

type OrderStatus =
  | "PENDING"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

type Execution = {
  id: string;
  executedQuantity: number;
  executedPrice: string;
  simulatedFee: string;
  executedAt: string;
};

type Order = {
  id: string;
  accountId: string;
  instrumentId: string;
  symbol: string;
  instrumentName: string;
  exchange: string;
  instrumentType: string;
  side: Side;
  type: OrderType;
  quantity: number;
  limitPrice: string | null;
  estimatedValue: string;
  simulatedFee: string;
  simulatedSlippage: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  execution: Execution | null;
};

type OrdersResponse = {
  success: boolean;
  error?: string;
  orders?: Order[];
};

type Filter =
  | "ALL"
  | "FILLED"
  | "PENDING"
  | "CANCELLED"
  | "REJECTED";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: OrderStatus) {
  switch (status) {
    case "FILLED":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600";

    case "REJECTED":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        /*
         * The Orders API now identifies the
         * account from the authenticated session.
         *
         * No userId is sent from the browser.
         */
        const response = await fetch(
          "/api/v1/orders",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as OrdersResponse;

        if (
          response.status === 401
        ) {
          window.location.href = "/login";
          return;
        }

        if (
          !response.ok ||
          !data.success ||
          !data.orders
        ) {
          throw new Error(
            data.error ??
              "Failed to load order history"
          );
        }

        setOrders(data.orders);
      } catch (loadError) {
        console.error(
          "Orders page load error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load order history"
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return orders.filter((order) => {
        const matchesFilter =
          filter === "ALL" ||
          order.status === filter;

        if (!matchesFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          order.symbol
            .toLowerCase()
            .includes(query) ||
          order.instrumentName
            .toLowerCase()
            .includes(query) ||
          order.side
            .toLowerCase()
            .includes(query) ||
          order.type
            .toLowerCase()
            .includes(query)
        );
      });
    }, [orders, filter, search]);

  const filledCount = orders.filter(
    (order) =>
      order.status === "FILLED"
  ).length;

  const pendingCount = orders.filter(
    (order) =>
      order.status === "PENDING"
  ).length;

  const totalVolume = orders.reduce(
    (total, order) => {
      return (
        total +
        Number(order.estimatedValue)
      );
    },
    0
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f9]/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Trading Activity
              </div>

              <h1 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                Order History
              </h1>
            </div>

            <Link
              href="/trade"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
            >
              New Trade
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
          {/* Hero */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Execution History
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  Review every simulated order.
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Track your order decisions,
                  execution prices, fees, slippage,
                  and timestamps in one place.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <SummaryCard
                  label="Orders"
                  value={orders.length.toString()}
                />

                <SummaryCard
                  label="Filled"
                  value={filledCount.toString()}
                />

                <SummaryCard
                  label="Pending"
                  value={pendingCount.toString()}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
              <div className="text-sm font-bold text-rose-800">
                Order history error
              </div>

              <div className="mt-1 text-sm text-rose-700">
                {error}
              </div>
            </div>
          )}

          {/* Filters */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "ALL",
                      "FILLED",
                      "PENDING",
                      "CANCELLED",
                      "REJECTED",
                    ] as Filter[]
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setFilter(item)
                      }
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        filter === item
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="relative w-full xl:w-80">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search orders"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Orders */}
            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-2xl bg-slate-100"
                    />
                  )
                )}
              </div>
            ) : filteredOrders.length > 0 ? (
              <>
                {/* Desktop */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[950px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Instrument
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Side
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Order
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Quantity
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Execution
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Fees
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(
                        (order) => {
                          const execution =
                            order.execution;

                          return (
                            <tr
                              key={order.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                            >
                              <td className="px-6 py-5">
                                <div className="font-black">
                                  {
                                    order.symbol
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    order.instrumentName
                                  }
                                </div>
                              </td>

                              <td className="px-6 py-5">
                                <span
                                  className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                                    order.side ===
                                    "BUY"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {order.side}
                                </span>
                              </td>

                              <td className="px-6 py-5">
                                <div className="text-sm font-bold">
                                  {order.type}
                                </div>

                                {order.limitPrice && (
                                  <div className="mt-1 text-xs text-slate-400">
                                    Limit{" "}
                                    {formatCurrency(
                                      Number(
                                        order.limitPrice
                                      )
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <div className="text-sm font-black">
                                  {order.quantity}
                                </div>

                                <div className="mt-1 text-xs text-slate-400">
                                  shares
                                </div>
                              </td>

                              <td className="px-6 py-5">
                                {execution ? (
                                  <>
                                    <div className="text-sm font-black">
                                      {formatCurrency(
                                        Number(
                                          execution.executedPrice
                                        )
                                      )}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-400">
                                      {
                                        execution.executedQuantity
                                      }{" "}
                                      executed
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-sm text-slate-400">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <div className="text-sm font-bold">
                                  {formatCurrency(
                                    Number(
                                      order.simulatedFee
                                    )
                                  )}
                                </div>

                                <div className="mt-1 text-xs text-slate-400">
                                  simulated
                                </div>
                              </td>

                              <td className="px-6 py-5">
                                <span
                                  className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusClasses(
                                    order.status
                                  )}`}
                                >
                                  {order.status}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-500">
                                {formatDate(
                                  execution?.executedAt ??
                                    order.createdAt
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredOrders.map(
                    (order) => {
                      const execution =
                        order.execution;

                      return (
                        <div
                          key={order.id}
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black">
                                  {
                                    order.symbol
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                    order.side ===
                                    "BUY"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {order.side}
                                </span>
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {
                                  order.instrumentName
                                }
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClasses(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <MiniMetric
                              label="Quantity"
                              value={`${order.quantity} shares`}
                            />

                            <MiniMetric
                              label="Order"
                              value={order.type}
                            />

                            <MiniMetric
                              label="Execution"
                              value={
                                execution
                                  ? formatCurrency(
                                      Number(
                                        execution.executedPrice
                                      )
                                    )
                                  : "—"
                              }
                            />

                            <MiniMetric
                              label="Fee"
                              value={formatCurrency(
                                Number(
                                  order.simulatedFee
                                )
                              )}
                            />
                          </div>

                          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                            {formatDate(
                              execution?.executedAt ??
                                order.createdAt
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
                  ▤
                </div>

                <h3 className="mt-5 text-base font-bold">
                  No orders found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Your simulated orders will
                  appear here after you place a
                  trade.
                </p>

                <Link
                  href="/trade"
                  className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                >
                  Place your first order
                </Link>
              </div>
            )}
          </section>

          {/* Activity summary */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Trading Activity
              </div>

              <h2 className="mt-2 text-lg font-black">
                Order volume
              </h2>

              <div className="mt-5">
                <div className="text-3xl font-black tracking-tight">
                  {formatCurrency(
                    totalVolume
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Combined estimated value of
                  orders recorded in the simulated
                  account.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Learning Perspective
              </div>

              <h2 className="mt-2 text-lg font-black">
                An order is a decision, not just a
                transaction.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use your order history together with
                the Journal and Analytics sections to
                understand why you entered trades and
                what happened afterward.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/journal"
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950"
                >
                  Open Journal
                </Link>

                <Link
                  href="/analytics"
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-20 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-xl font-black">
        {value}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-black text-slate-900">
        {value}
      </div>
    </div>
  );
}
