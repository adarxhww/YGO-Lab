"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Instrument = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  lotSize: number;
  tickSize: string | number;
  lastPrice: string | number;
  timestamp: string | null;
};

type InstrumentsResponse = {
  success: boolean;
  error?: string;
  instruments?: Instrument[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(value: string | null) {
  if (!value) {
    return "No price update";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No price update";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function MarketsPage() {
  const [instruments, setInstruments] = useState<
    Instrument[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/v1/instruments",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as InstrumentsResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.instruments
        ) {
          throw new Error(
            data.error ??
              "Failed to load market data"
          );
        }

        setInstruments(data.instruments);
      } catch (loadError) {
        console.error(
          "Markets page load error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load market data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
  }, []);

  const filteredInstruments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return instruments;
    }

    return instruments.filter(
      (instrument) =>
        instrument.symbol
          .toLowerCase()
          .includes(query) ||
        instrument.name
          .toLowerCase()
          .includes(query) ||
        instrument.exchange
          .toLowerCase()
          .includes(query)
    );
  }, [instruments, search]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f9]/95 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Market Watch
            </div>

            <h1 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
              Markets
            </h1>
          </div>

          <Link
            href="/trade"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Trade
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Simulated Market
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Explore instruments before you
              trade.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Browse the instruments available in
              your paper-trading environment and
              open an order ticket directly from the
              market list.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Instruments
              </div>

              <div className="mt-2 text-2xl font-black">
                {instruments.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Exchange
              </div>

              <div className="mt-2 text-2xl font-black">
                NSE
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Environment
              </div>

              <div className="mt-2 text-2xl font-black">
                Paper
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-bold text-rose-800">
              Market data error
            </div>

            <div className="mt-1 text-sm text-rose-700">
              {error}
            </div>
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Watchlist
                </div>

                <h2 className="mt-2 text-lg font-black">
                  Available Instruments
                </h2>
              </div>

              <div className="relative w-full sm:w-80">
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
                  placeholder="Search symbol or company"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse p-5 sm:p-6"
                >
                  <div className="h-5 w-28 rounded bg-slate-100" />

                  <div className="mt-3 h-4 w-48 rounded bg-slate-100" />

                  <div className="mt-4 h-10 w-full rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredInstruments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredInstruments.map(
                (instrument) => (
                  <div
                    key={instrument.id}
                    className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                          {instrument.symbol.slice(
                            0,
                            2
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black">
                              {instrument.symbol}
                            </h3>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                              {instrument.exchange}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                              {instrument.type}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {instrument.name}
                          </p>

                          <p className="mt-2 text-[11px] text-slate-400">
                            Updated{" "}
                            {formatTime(
                              instrument.timestamp
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="sm:min-w-36 sm:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            Last Price
                          </div>

                          <div className="mt-1 text-xl font-black tracking-tight">
                            {formatCurrency(
                              Number(
                                instrument.lastPrice
                              )
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/trade?symbol=${encodeURIComponent(
                            instrument.symbol
                          )}`}
                          className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          Trade
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
                ⌕
              </div>

              <h3 className="mt-5 text-base font-bold">
                No instruments found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try searching with a different
                symbol or company name.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-7">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Learning Note
            </div>

            <h2 className="mt-3 text-lg font-black">
              Market price is not the same as
              guaranteed execution price.
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              In this simulation, executions include
              configurable simulated slippage and
              fees. Use the Trade screen to understand
              how those costs affect an order before
              placing it.
            </p>

            <Link
              href="/learn/fees-slippage"
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Learn about fees &amp; slippage
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
