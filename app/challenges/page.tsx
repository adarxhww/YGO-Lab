"use client";

import { useEffect, useMemo, useState } from "react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  targetType: string;
  targetValue: number;
  durationDays: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  started: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  userChallengeId: string | null;
};

type ApiResponse = {
  success: boolean;
  challenges?: Challenge[];
  error?: string;
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function loadChallenges() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/v1/challenges",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ??
            "Failed to load challenges"
        );
      }

      setChallenges(data.challenges ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load challenges"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallenges();
  }, []);

  async function startChallenge(
    challengeId: string
  ) {
    try {
      setStartingId(challengeId);
      setError(null);

      const response = await fetch(
        "/api/v1/challenges",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challengeId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ??
            "Failed to start challenge"
        );
      }

      await loadChallenges();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to start challenge"
      );
    } finally {
      setStartingId(null);
    }
  }

  const activeCount = useMemo(
    () =>
      challenges.filter(
        (challenge) =>
          challenge.started &&
          !challenge.completed &&
          !challenge.expired
      ).length,
    [challenges]
  );

  const completedCount = useMemo(
    () =>
      challenges.filter(
        (challenge) => challenge.completed
      ).length,
    [challenges]
  );

  const expiredCount = useMemo(
    () =>
      challenges.filter(
        (challenge) => challenge.expired
      ).length,
    [challenges]
  );

  function formatDate(date: string | null) {
    if (!date) {
      return null;
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getProgressPercentage(
    challenge: Challenge
  ) {
    if (challenge.targetValue <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (challenge.progress /
          challenge.targetValue) *
          100
      )
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading challenges...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Progress
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Challenges
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Complete trading and learning goals to
            build consistency, discipline, and better
            trading habits.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Expired
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {expiredCount}
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => {
            const percentage =
              getProgressPercentage(
                challenge
              );

            const isStarting =
              startingId === challenge.id;

            return (
              <article
                key={challenge.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  challenge.completed
                    ? "border-emerald-200"
                    : challenge.expired
                    ? "border-amber-200"
                    : "border-slate-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {challenge.badgeIcon}
                  </div>

                  {challenge.completed ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Completed
                    </span>
                  ) : challenge.expired ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                      Expired
                    </span>
                  ) : challenge.started ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                      In Progress
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                      Not Started
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900">
                  {challenge.title}
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                  {challenge.description}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">
                      Progress
                    </span>

                    <span className="text-slate-700">
                      {challenge.progress}/
                      {challenge.targetValue}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        challenge.completed
                          ? "bg-emerald-500"
                          : challenge.expired
                          ? "bg-amber-400"
                          : "bg-slate-900"
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Duration
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {challenge.durationDays}{" "}
                      {challenge.durationDays === 1
                        ? "day"
                        : "days"}
                    </p>
                  </div>

                  {challenge.started &&
                    !challenge.completed &&
                    !challenge.expired &&
                    challenge.expiresAt && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Expires
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(
                            challenge.expiresAt
                          )}
                        </p>
                      </div>
                    )}

                  {challenge.completed &&
                    challenge.completedAt && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Completed
                        </p>

                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          {formatDate(
                            challenge.completedAt
                          )}
                        </p>
                      </div>
                    )}

                  {challenge.expired &&
                    challenge.expiresAt && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Expired
                        </p>

                        <p className="mt-1 text-sm font-semibold text-amber-700">
                          {formatDate(
                            challenge.expiresAt
                          )}
                        </p>
                      </div>
                    )}
                </div>

                {!challenge.started &&
                  !challenge.completed &&
                  !challenge.expired && (
                    <button
                      type="button"
                      onClick={() =>
                        startChallenge(
                          challenge.id
                        )
                      }
                      disabled={isStarting}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStarting
                        ? "Starting..."
                        : "Start Challenge"}
                    </button>
                  )}

                {challenge.started &&
                  !challenge.completed &&
                  !challenge.expired && (
                    <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-600">
                      Keep going — you're{" "}
                      {percentage}% there.
                    </div>
                  )}

                {challenge.completed && (
                  <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                    Challenge completed 🎉
                  </div>
                )}

                {challenge.expired && (
                  <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
                    Challenge period ended
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {challenges.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              No challenges available
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Check back later for new challenges.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
