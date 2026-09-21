"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EmotionalState =
  | "CALM"
  | "ANXIOUS"
  | "OVERCONFIDENT"
  | "FOMO"
  | "REVENUE_SEEKING"
  | "NEUTRAL";

type JournalEntry = {
  id: string;
  userId: string;
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

type TradeRecord = {
  id: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: string | number;
  exitPrice: string | number | null;
  realizedPnL: string | number;
  openedAt: string;
  closedAt: string | null;
  instrument: {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  };
};

type JournalResponse = {
  success: boolean;
  journalEntries?: JournalEntry[];
  error?: string;
};

type TradesResponse = {
  success: boolean;
  trades?: TradeRecord[];
  error?: string;
};

type ReflectionFormState = {
  entryReason: string;
  strategy: string;
  expectedOutcome: string;
  stopLossPrice: string;
  targetPrice: string;
  confidenceRating: string;
  emotionalState: EmotionalState;
};

const INITIAL_REFLECTION_FORM: ReflectionFormState = {
  entryReason: "",
  strategy: "",
  expectedOutcome: "",
  stopLossPrice: "",
  targetPrice: "",
  confidenceRating: "5",
  emotionalState: "NEUTRAL",
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value: string | number | null | undefined) {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEmotion(value: EmotionalState) {
  switch (value) {
    case "OVERCONFIDENT":
      return "Overconfident";
    case "REVENUE_SEEKING":
      return "Revenue Seeking";
    case "ANXIOUS":
      return "Anxious";
    case "FOMO":
      return "FOMO";
    case "CALM":
      return "Calm";
    default:
      return "Neutral";
  }
}

function pnlClass(value: string | number | null | undefined) {
  const number = toNumber(value);

  if (number > 0) {
    return "text-emerald-600";
  }

  if (number < 0) {
    return "text-red-600";
  }

  return "text-slate-600";
}

function JournalCard({
  entry,
  onOpen,
}: {
  entry: JournalEntry;
  onOpen: () => void;
}) {
  const pnl = toNumber(entry.trade.realizedPnL);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              {entry.trade.instrument.symbol}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                entry.trade.side === "BUY"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {entry.trade.side}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {formatEmotion(entry.emotionalState)}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {entry.trade.instrument.name} · {entry.trade.instrument.exchange}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className={`text-lg font-bold ${pnlClass(pnl)}`}>
            {pnl >= 0 ? "+" : ""}
            {formatCurrency(pnl)}
          </p>
          <p className="text-xs text-slate-400">
            {formatDate(entry.trade.openedAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TradeMetric
          label="Entry"
          value={formatCurrency(entry.trade.entryPrice)}
        />
        <TradeMetric
          label="Exit"
          value={formatCurrency(entry.trade.exitPrice)}
        />
        <TradeMetric
          label="Quantity"
          value={entry.trade.quantity.toString()}
        />
        <TradeMetric
          label="Confidence"
          value={`${entry.confidenceRating}/10`}
        />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {entry.entryReason}
        </p>
      </div>
    </button>
  );
}

function TradeMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function PendingTradeCard({
  trade,
  onReflect,
}: {
  trade: TradeRecord;
  onReflect: () => void;
}) {
  const pnl = toNumber(trade.realizedPnL);

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              {trade.instrument.symbol}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                trade.side === "BUY"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {trade.side}
            </span>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Reflection pending
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {trade.instrument.name} · {trade.instrument.exchange}
          </p>
        </div>

        <button
          type="button"
          onClick={onReflect}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Reflect on Trade
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <TradeMetric label="Quantity" value={trade.quantity.toString()} />
        <TradeMetric label="Entry" value={formatCurrency(trade.entryPrice)} />
        <TradeMetric label="Exit" value={formatCurrency(trade.exitPrice)} />
        <TradeMetric
          label="P&L"
          value={`${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`}
        />
        <TradeMetric label="Opened" value={formatDate(trade.openedAt)} />
        <TradeMetric label="Closed" value={formatDate(trade.closedAt)} />
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function EmptyJournalState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
        📝
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        Your journal is empty
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Complete a trade and reflect on it to start building your trading
        journal.
      </p>
    </div>
  );
}

function JournalLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-48 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}

function PendingTradesLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </div>
  );
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

function JournalDetailModal({
  entry,
  onClose,
}: {
  entry: JournalEntry;
  onClose: () => void;
}) {
  const pnl = toNumber(entry.trade.realizedPnL);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {entry.trade.instrument.symbol} Journal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatDateTime(entry.trade.openedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-7 p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailMetric
              label="Side"
              value={entry.trade.side}
            />
            <DetailMetric
              label="Quantity"
              value={entry.trade.quantity.toString()}
            />
            <DetailMetric
              label="Entry"
              value={formatCurrency(entry.trade.entryPrice)}
            />
            <DetailMetric
              label="Exit"
              value={formatCurrency(entry.trade.exitPrice)}
            />
            <DetailMetric
              label="P&L"
              value={`${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`}
            />
            <DetailMetric
              label="Confidence"
              value={`${entry.confidenceRating}/10`}
            />
            <DetailMetric
              label="Emotion"
              value={formatEmotion(entry.emotionalState)}
            />
            <DetailMetric
              label="Strategy"
              value={entry.strategy}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailSection title="Why I entered">
              {entry.entryReason}
            </DetailSection>

            <DetailSection title="Expected outcome">
              {entry.expectedOutcome}
            </DetailSection>

            <DetailSection title="Risk plan">
              <div className="grid grid-cols-2 gap-3">
                <DetailMetric
                  label="Stop loss"
                  value={formatCurrency(entry.stopLossPrice)}
                />
                <DetailMetric
                  label="Target"
                  value={formatCurrency(entry.targetPrice)}
                />
              </div>
            </DetailSection>

            <DetailSection title="Trade timeline">
              <div className="space-y-1">
                <p>Opened: {formatDateTime(entry.trade.openedAt)}</p>
                <p>Closed: {formatDateTime(entry.trade.closedAt)}</p>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReflectionModal({
  trade,
  form,
  setForm,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  trade: TradeRecord;
  form: ReflectionFormState;
  setForm: React.Dispatch<React.SetStateAction<ReflectionFormState>>;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Reflect on {trade.instrument.symbol}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture what you were thinking before and during the trade.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close reflection form"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {trade.instrument.symbol}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  trade.side === "BUY"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {trade.side}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailMetric
                label="Quantity"
                value={trade.quantity.toString()}
              />
              <DetailMetric
                label="Entry"
                value={formatCurrency(trade.entryPrice)}
              />
              <DetailMetric
                label="Exit"
                value={formatCurrency(trade.exitPrice)}
              />
              <DetailMetric
                label="P&L"
                value={formatCurrency(trade.realizedPnL)}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="entryReason"
                className="text-sm font-semibold text-slate-800"
              >
                Why did you enter this trade?
              </label>

              <textarea
                id="entryReason"
                value={form.entryReason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    entryReason: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe the setup, signal, or reasoning behind the entry."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="strategy"
                className="text-sm font-semibold text-slate-800"
              >
                Strategy
              </label>

              <input
                id="strategy"
                value={form.strategy}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    strategy: event.target.value,
                  }))
                }
                placeholder="e.g. Breakout, support bounce, trend following"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="expectedOutcome"
                className="text-sm font-semibold text-slate-800"
              >
                What did you expect to happen?
              </label>

              <textarea
                id="expectedOutcome"
                value={form.expectedOutcome}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expectedOutcome: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe the expected price movement or trade outcome."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="stopLossPrice"
                  className="text-sm font-semibold text-slate-800"
                >
                  Stop loss
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="stopLossPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.stopLossPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stopLossPrice: event.target.value,
                    }))
                  }
                  placeholder="e.g. 1460"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="targetPrice"
                  className="text-sm font-semibold text-slate-800"
                >
                  Target price
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="targetPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.targetPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetPrice: event.target.value,
                    }))
                  }
                  placeholder="e.g. 1580"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="confidenceRating"
                  className="text-sm font-semibold text-slate-800"
                >
                  Confidence
                </label>

                <select
                  id="confidenceRating"
                  value={form.confidenceRating}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confidenceRating: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (rating) => (
                      <option key={rating} value={rating}>
                        {rating}/10
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="emotionalState"
                  className="text-sm font-semibold text-slate-800"
                >
                  Emotional state
                </label>

                <select
                  id="emotionalState"
                  value={form.emotionalState}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emotionalState: event.target
                        .value as EmotionalState,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="CALM">Calm</option>
                  <option value="ANXIOUS">Anxious</option>
                  <option value="OVERCONFIDENT">Overconfident</option>
                  <option value="FOMO">FOMO</option>
                  <option value="REVENUE_SEEKING">
                    Revenue Seeking
                  </option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving Reflection..." : "Save Reflection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pendingTrades, setPendingTrades] = useState<TradeRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [pendingTradesLoading, setPendingTradesLoading] = useState(true);

  const [error, setError] = useState("");
  const [pendingTradesError, setPendingTradesError] = useState("");

  const [selectedEntry, setSelectedEntry] =
    useState<JournalEntry | null>(null);

  const [selectedTradeForReflection, setSelectedTradeForReflection] =
    useState<TradeRecord | null>(null);

  const [reflectionForm, setReflectionForm] =
    useState<ReflectionFormState>(INITIAL_REFLECTION_FORM);

  const [submittingReflection, setSubmittingReflection] =
    useState(false);

  const [reflectionError, setReflectionError] = useState("");

  async function loadJournal() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v1/journal", {
        cache: "no-store",
      });

      const data: JournalResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load journal");
      }

      setEntries(data.journalEntries ?? []);
    } catch (loadError) {
      console.error("Failed to load journal:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load journal",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingTrades() {
    try {
      setPendingTradesLoading(true);
      setPendingTradesError("");

      const response = await fetch("/api/v1/trades", {
        cache: "no-store",
      });

      const data: TradesResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load pending trades");
      }

      setPendingTrades(data.trades ?? []);
    } catch (loadError) {
      console.error("Failed to load pending trades:", loadError);
      setPendingTradesError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load pending trades",
      );
    } finally {
      setPendingTradesLoading(false);
    }
  }

  async function refreshJournalData() {
    await Promise.all([loadJournal(), loadPendingTrades()]);
  }

  useEffect(() => {
    refreshJournalData();
  }, []);

  const statistics = useMemo(() => {
    const totalTrades = entries.length;

    const profitableTrades = entries.filter(
      (entry) => toNumber(entry.trade.realizedPnL) > 0,
    ).length;

    const losingTrades = entries.filter(
      (entry) => toNumber(entry.trade.realizedPnL) < 0,
    ).length;

    const totalPnL = entries.reduce(
      (sum, entry) => sum + toNumber(entry.trade.realizedPnL),
      0,
    );

    const averageConfidence =
      totalTrades > 0
        ? entries.reduce(
            (sum, entry) => sum + entry.confidenceRating,
            0,
          ) / totalTrades
        : 0;

    const winRate =
      totalTrades > 0
        ? (profitableTrades / totalTrades) * 100
        : 0;

    return {
      totalTrades,
      profitableTrades,
      losingTrades,
      totalPnL,
      averageConfidence,
      winRate,
    };
  }, [entries]);

  function openReflection(trade: TradeRecord) {
    setSelectedTradeForReflection(trade);
    setReflectionForm(INITIAL_REFLECTION_FORM);
    setReflectionError("");
  }

  function closeReflection() {
    if (submittingReflection) {
      return;
    }

    setSelectedTradeForReflection(null);
    setReflectionForm(INITIAL_REFLECTION_FORM);
    setReflectionError("");
  }

  async function submitReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTradeForReflection) {
      return;
    }

    const entryReason = reflectionForm.entryReason.trim();
    const strategy = reflectionForm.strategy.trim();
    const expectedOutcome = reflectionForm.expectedOutcome.trim();
    const confidenceRating = Number(
      reflectionForm.confidenceRating,
    );

    if (!entryReason || !strategy || !expectedOutcome) {
      setReflectionError(
        "Please complete the entry reason, strategy, and expected outcome.",
      );
      return;
    }

    if (
      !Number.isInteger(confidenceRating) ||
      confidenceRating < 1 ||
      confidenceRating > 10
    ) {
      setReflectionError(
        "Confidence must be between 1 and 10.",
      );
      return;
    }

    const stopLossPrice = reflectionForm.stopLossPrice.trim()
      ? Number(reflectionForm.stopLossPrice)
      : undefined;

    const targetPrice = reflectionForm.targetPrice.trim()
      ? Number(reflectionForm.targetPrice)
      : undefined;

    if (
      stopLossPrice !== undefined &&
      (!Number.isFinite(stopLossPrice) || stopLossPrice <= 0)
    ) {
      setReflectionError(
        "Stop loss must be a positive number.",
      );
      return;
    }

    if (
      targetPrice !== undefined &&
      (!Number.isFinite(targetPrice) || targetPrice <= 0)
    ) {
      setReflectionError(
        "Target price must be a positive number.",
      );
      return;
    }

    try {
      setSubmittingReflection(true);
      setReflectionError("");

      const payload = {
        tradeId: selectedTradeForReflection.id,
        entryReason,
        strategy,
        expectedOutcome,
        ...(stopLossPrice !== undefined
          ? { stopLossPrice }
          : {}),
        ...(targetPrice !== undefined
          ? { targetPrice }
          : {}),
        confidenceRating,
        emotionalState: reflectionForm.emotionalState,
      };

      const response = await fetch("/api/v1/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 409) {
          throw new Error(
            "A journal entry already exists for this trade. Refreshing your journal.",
          );
        }

        throw new Error(
          data.error ?? "Failed to save journal entry",
        );
      }

      setSelectedTradeForReflection(null);
      setReflectionForm(INITIAL_REFLECTION_FORM);

      await refreshJournalData();
    } catch (submitError) {
      console.error(
        "Failed to save journal reflection:",
        submitError,
      );

      setReflectionError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save journal reflection",
      );

      if (
        submitError instanceof Error &&
        submitError.message.includes(
          "already exists",
        )
      ) {
        await refreshJournalData();
      }
    } finally {
      setSubmittingReflection(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <div className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <section className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-sm sm:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-slate-300">
                  Trading Journal
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Learn from every trade.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Record your reasoning, emotions, expectations, and
                  outcomes so you can identify patterns and improve
                  your trading process.
                </p>
              </div>
            </section>

            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <InsightCard
                title="Journaled trades"
                value={statistics.totalTrades.toString()}
                description="Trades with a completed reflection."
              />

              <InsightCard
                title="Win rate"
                value={`${statistics.winRate.toFixed(1)}%`}
                description={`${statistics.profitableTrades} profitable · ${statistics.losingTrades} losing`}
              />

              <InsightCard
                title="Journal P&L"
                value={`${statistics.totalPnL >= 0 ? "+" : ""}${formatCurrency(statistics.totalPnL)}`}
                description="Realized P&L across journaled trades."
              />

              <InsightCard
                title="Avg. confidence"
                value={`${statistics.averageConfidence.toFixed(1)}/10`}
                description="Average confidence recorded before reflection."
              />

              <InsightCard
                title="Pending reflection"
                value={pendingTrades.length.toString()}
                description="Trades waiting for your review."
              />
            </section>

            {/* Pending reflections */}
            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Trades waiting for reflection
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Turn completed trades into learning opportunities.
                  </p>
                </div>

                {pendingTrades.length > 0 ? (
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    {pendingTrades.length} pending
                  </span>
                ) : null}
              </div>

              {pendingTradesLoading ? (
                <PendingTradesLoadingState />
              ) : pendingTradesError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {pendingTradesError}
                </div>
              ) : pendingTrades.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      ✓
                    </div>

                    <div>
                      <h3 className="font-bold text-emerald-900">
                        You&apos;re caught up
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Every available trade currently has a journal
                        entry.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTrades.map((trade) => (
                    <PendingTradeCard
                      key={trade.id}
                      trade={trade}
                      onReflect={() => openReflection(trade)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Recent entries */}
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Recent journal entries
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the decisions behind your previous trades.
                </p>
              </div>

              {loading ? (
                <JournalLoadingState />
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              ) : entries.length === 0 ? (
                <EmptyJournalState />
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <JournalCard
                      key={entry.id}
                      entry={entry}
                      onOpen={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Learning insights */}
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Journal insights
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Simple observations from your recorded trading behavior.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <InsightCard
                  title="Confidence"
                  value={
                    statistics.totalTrades > 0
                      ? `${statistics.averageConfidence.toFixed(1)}/10`
                      : "—"
                  }
                  description="Compare confidence with actual outcomes over time."
                />

                <InsightCard
                  title="Reflection habit"
                  value={`${statistics.totalTrades} trades`}
                  description="Consistent journaling helps expose repeatable decision patterns."
                />

                <InsightCard
                  title="Next step"
                  value={
                    pendingTrades.length > 0
                      ? "Reflect"
                      : "Keep trading"
                  }
                  description={
                    pendingTrades.length > 0
                      ? "Review your outstanding trades before taking new positions."
                      : "Your current trades have been reflected. Keep recording your reasoning."
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {selectedEntry ? (
        <JournalDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      ) : null}

      {selectedTradeForReflection ? (
        <ReflectionModal
          trade={selectedTradeForReflection}
          form={reflectionForm}
          setForm={setReflectionForm}
          submitting={submittingReflection}
          error={reflectionError}
          onClose={closeReflection}
          onSubmit={submitReflection}
        />
      ) : null}
    </main>
  );
}
