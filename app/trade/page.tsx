"use client";

import { useEffect, useMemo, useState } from "react";

type Instrument = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  lotSize: number;
  tickSize: string | number;
  isActive: boolean;
  price?: {
    lastPrice: string | number;
    high: string | number;
    low: string | number;
    close: string | number;
    volume: string | number;
    timestamp: string;
  } | null;
};

type Side = "BUY" | "SELL";
type OrderType = "MARKET" | "LIMIT";

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toNumber(value: string | number | undefined | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function TradePage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [side, setSide] = useState<Side>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastOrder, setLastOrder] = useState<{
    symbol: string;
    side: string;
    quantity: number;
    executionPrice: number;
    fee: number;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInstruments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/v1/instruments", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to load available instruments"
          );
        }

        const loadedInstruments: Instrument[] = data.instruments ?? [];

        if (cancelled) {
          return;
        }

        setInstruments(loadedInstruments);

        if (loadedInstruments.length > 0) {
          setSelectedSymbol(loadedInstruments[0].symbol);
        }
      } catch (err) {
        console.error("Failed to load instruments:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load available instruments"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInstruments();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedInstrument = useMemo(
    () =>
      instruments.find(
        (instrument) => instrument.symbol === selectedSymbol
      ) ?? null,
    [instruments, selectedSymbol]
  );

  const marketPrice = toNumber(
    selectedInstrument?.price?.lastPrice
  );

  const currentLimitPrice = toNumber(limitPrice);

  const effectivePrice =
    orderType === "LIMIT" && currentLimitPrice > 0
      ? currentLimitPrice
      : marketPrice;

  const numericQuantity = Math.max(
    0,
    Math.floor(Number(quantity) || 0)
  );

  const estimatedGrossValue =
    effectivePrice * numericQuantity;

  const estimatedFee = estimatedGrossValue * 0.001;

  const estimatedSlippage =
    orderType === "MARKET"
      ? marketPrice * 0.0005 * numericQuantity
      : 0;

  const estimatedTotal =
    side === "BUY"
      ? estimatedGrossValue + estimatedFee
      : estimatedGrossValue - estimatedFee;

  function handleInstrumentChange(symbol: string) {
    setSelectedSymbol(symbol);
    setSuccess("");
    setError("");
    setLastOrder(null);
  }

  function handleOrderTypeChange(type: OrderType) {
    setOrderType(type);
    setSuccess("");
    setError("");
    setLastOrder(null);

    if (type === "LIMIT" && marketPrice > 0) {
      setLimitPrice(marketPrice.toFixed(2));
    }
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");
    setLastOrder(null);

    if (!selectedInstrument) {
      setError("Please select an instrument.");
      return;
    }

    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      selectedInstrument.lotSize > 1 &&
      numericQuantity % selectedInstrument.lotSize !== 0
    ) {
      setError(
        `Quantity must be a multiple of ${selectedInstrument.lotSize}.`
      );
      return;
    }

    if (orderType === "LIMIT") {
      if (!Number.isFinite(currentLimitPrice) || currentLimitPrice <= 0) {
        setError("Please enter a valid limit price.");
        return;
      }

      if (
        side === "BUY" &&
        currentLimitPrice < marketPrice
      ) {
        setError(
          `Buy limit price must be at least the current simulated market price of ${formatINR(
            marketPrice
          )} for immediate paper execution.`
        );
        return;
      }

      if (
        side === "SELL" &&
        currentLimitPrice > marketPrice
      ) {
        setError(
          `Sell limit price must be at most the current simulated market price of ${formatINR(
            marketPrice
          )} for immediate paper execution.`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: selectedInstrument.symbol,
          side,
          type: orderType,
          quantity: numericQuantity,
          ...(orderType === "LIMIT"
            ? {
                limitPrice: currentLimitPrice,
              }
            : {}),
          idempotencyKey: generateIdempotencyKey(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "The order could not be submitted."
        );
      }

      const execution = data.execution;

      const executionPrice = toNumber(
        execution?.executedPrice
      );

      const fee = toNumber(execution?.simulatedFee);

      setLastOrder({
        symbol: selectedInstrument.symbol,
        side,
        quantity: numericQuantity,
        executionPrice,
        fee,
        orderId: data.order?.id ?? "—",
      });

      setSuccess(
        `${side} order for ${numericQuantity} ${selectedInstrument.symbol} executed successfully.`
      );
    } catch (err) {
      console.error("Order submission failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "The order could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Paper Trading
          </div>

          <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Place a Trade
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Practice order execution with simulated prices,
                fees, and slippage.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Simulation Mode
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading instruments...
            </p>
          </div>
        )}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left side */}
            <section className="space-y-6">
              {/* Instrument selector */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    Instrument
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose the simulated instrument you want to
                    trade.
                  </p>
                </div>

                <div className="p-5">
                  {instruments.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      No active instruments are currently available.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {instruments.map((instrument) => {
                        const price = toNumber(
                          instrument.price?.lastPrice
                        );

                        const selected =
                          instrument.symbol === selectedSymbol;

                        return (
                          <button
                            key={instrument.id}
                            type="button"
                            onClick={() =>
                              handleInstrumentChange(
                                instrument.symbol
                              )
                            }
                            className={`rounded-xl border p-4 text-left transition ${
                              selected
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold">
                                  {instrument.symbol}
                                </div>

                                <div
                                  className={`mt-1 text-xs ${
                                    selected
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {instrument.name}
                                </div>
                              </div>

                              <div
                                className={`text-sm font-bold ${
                                  selected
                                    ? "text-white"
                                    : "text-slate-900"
                                }`}
                              >
                                {formatINR(price)}
                              </div>
                            </div>

                            <div
                              className={`mt-3 flex items-center justify-between text-[11px] ${
                                selected
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }`}
                            >
                              <span>
                                {instrument.exchange}
                              </span>

                              <span>
                                {instrument.type}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Market information */}
              {selectedInstrument && (
                <div className="grid gap-4 sm:grid-cols-4">
                  <MarketStat
                    label="Last Price"
                    value={formatINR(marketPrice)}
                  />

                  <MarketStat
                    label="Day High"
                    value={formatINR(
                      toNumber(selectedInstrument.price?.high)
                    )}
                  />

                  <MarketStat
                    label="Day Low"
                    value={formatINR(
                      toNumber(selectedInstrument.price?.low)
                    )}
                  />

                  <MarketStat
                    label="Volume"
                    value={toNumber(
                      selectedInstrument.price?.volume
                    ).toLocaleString("en-IN")}
                  />
                </div>
              )}

              {/* Trading form */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    Order Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Configure your simulated order before
                    submitting it.
                  </p>
                </div>

                <div className="space-y-5 p-5">
                  {/* Buy/Sell */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Side
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSide("BUY");
                          setError("");
                          setSuccess("");
                        }}
                        className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                          side === "BUY"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Buy
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSide("SELL");
                          setError("");
                          setSuccess("");
                        }}
                        className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                          side === "SELL"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  {/* Order type */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Order Type
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleOrderTypeChange("MARKET")
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          orderType === "MARKET"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-bold">
                          Market
                        </div>

                        <div
                          className={`mt-1 text-[11px] ${
                            orderType === "MARKET"
                              ? "text-slate-300"
                              : "text-slate-400"
                          }`}
                        >
                          Execute at simulated market price
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleOrderTypeChange("LIMIT")
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          orderType === "LIMIT"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-bold">
                          Limit
                        </div>

                        <div
                          className={`mt-1 text-[11px] ${
                            orderType === "LIMIT"
                              ? "text-slate-300"
                              : "text-slate-400"
                          }`}
                        >
                          Specify your execution price
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label
                      htmlFor="quantity"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Quantity
                    </label>

                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      step={
                        selectedInstrument?.lotSize ?? 1
                      }
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />

                    {selectedInstrument && (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Lot size:{" "}
                        {selectedInstrument.lotSize}
                      </p>
                    )}
                  </div>

                  {/* Limit price */}
                  {orderType === "LIMIT" && (
                    <div>
                      <label
                        htmlFor="limitPrice"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        Limit Price
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          ₹
                        </span>

                        <input
                          id="limitPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={limitPrice}
                          onChange={(event) =>
                            setLimitPrice(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Current simulated price:{" "}
                        {formatINR(marketPrice)}
                      </p>
                    </div>
                  )}

                  {/* Messages */}
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {success}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !selectedInstrument ||
                      numericQuantity <= 0
                    }
                    className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      side === "BUY"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {submitting
                      ? "Submitting Order..."
                      : `${side === "BUY" ? "Buy" : "Sell"} ${
                          selectedInstrument?.symbol ?? ""
                        }`}
                  </button>
                </div>
              </div>
            </section>

            {/* Right side */}
            <aside className="space-y-6">
              {/* Order preview */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    Order Preview
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Estimated execution details.
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <PreviewRow
                    label="Instrument"
                    value={
                      selectedInstrument?.symbol ?? "—"
                    }
                  />

                  <PreviewRow
                    label="Side"
                    value={side}
                    valueClassName={
                      side === "BUY"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  />

                  <PreviewRow
                    label="Type"
                    value={orderType}
                  />

                  <PreviewRow
                    label="Quantity"
                    value={String(numericQuantity)}
                  />

                  <PreviewRow
                    label="Estimated Price"
                    value={formatINR(effectivePrice)}
                  />

                  <div className="border-t border-slate-100 pt-4">
                    <PreviewRow
                      label="Gross Value"
                      value={formatINR(
                        estimatedGrossValue
                      )}
                    />

                    <div className="mt-3">
                      <PreviewRow
                        label="Estimated Fee"
                        value={formatINR(estimatedFee)}
                      />
                    </div>

                    {orderType === "MARKET" && (
                      <div className="mt-3">
                        <PreviewRow
                          label="Estimated Slippage"
                          value={formatINR(
                            estimatedSlippage
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">
                        Estimated Total
                      </span>

                      <span className="text-xl font-extrabold text-slate-900">
                        {formatINR(
                          Math.max(0, estimatedTotal)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution result */}
              {lastOrder && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
                  <div className="border-b border-emerald-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        ✓
                      </div>

                      <div>
                        <h2 className="text-sm font-bold text-emerald-900">
                          Order Executed
                        </h2>

                        <p className="text-[11px] text-emerald-700">
                          Simulated execution completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <PreviewRow
                      label="Symbol"
                      value={lastOrder.symbol}
                    />

                    <PreviewRow
                      label="Side"
                      value={lastOrder.side}
                    />

                    <PreviewRow
                      label="Quantity"
                      value={String(lastOrder.quantity)}
                    />

                    <PreviewRow
                      label="Execution Price"
                      value={formatINR(
                        lastOrder.executionPrice
                      )}
                    />

                    <PreviewRow
                      label="Simulated Fee"
                      value={formatINR(lastOrder.fee)}
                    />

                    <div className="border-t border-emerald-200 pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Order ID
                      </div>

                      <div className="mt-1 break-all font-mono text-[10px] text-emerald-900">
                        {lastOrder.orderId}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning note */}
              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  TradeCraft Principle
                </div>

                <h3 className="mt-2 text-base font-bold">
                  Understand the order before you place it.
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Market orders prioritize execution. Limit
                  orders provide price control but may not
                  execute unless their conditions are met.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function MarketStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`text-xs font-bold ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}
