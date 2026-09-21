"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type Module = {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
};

type Course = {
  id: string;
  level: Level;
  title: string;
  description: string;
  modules: Module[];
};

type ProgressRecord = {
  id: string;
  lessonId: string;
  completedAt: string;
};

const LEVEL_ORDER: Level[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

const COURSES: Course[] = [
  {
    id: "foundations",
    level: "BEGINNER",
    title: "Trading Foundations",
    description:
      "Understand the basic concepts behind paper trading, orders, prices, and portfolio management.",
    modules: [
      {
        id: "market-basics",
        title: "How Financial Markets Work",
        description:
          "Learn what markets, exchanges, instruments, and prices represent.",
        duration: "5 min",
        completed: false,
      },
      {
        id: "market-orders",
        title: "Market Orders",
        description:
          "Understand how simulated market orders are executed.",
        duration: "4 min",
        completed: false,
      },
      {
        id: "limit-orders",
        title: "Limit Orders",
        description:
          "Learn how a limit price controls when an order can execute.",
        duration: "5 min",
        completed: false,
      },
      {
        id: "fees-slippage",
        title: "Fees & Slippage",
        description:
          "See why execution costs affect trading performance.",
        duration: "5 min",
        completed: false,
      },
    ],
  },
  {
    id: "risk",
    level: "INTERMEDIATE",
    title: "Risk Management",
    description:
      "Build disciplined habits around position sizing, drawdowns, stop losses, and portfolio concentration.",
    modules: [
      {
        id: "position-sizing",
        title: "Position Sizing",
        description:
          "Learn how position size changes the amount of capital exposed to a trade.",
        duration: "7 min",
        completed: false,
      },
      {
        id: "stop-loss",
        title: "Stop Loss",
        description:
          "Understand how predefined exit levels can help control downside.",
        duration: "6 min",
        completed: false,
      },
      {
        id: "drawdown",
        title: "Understanding Drawdown",
        description:
          "Learn how portfolio losses accumulate and how drawdown is measured.",
        duration: "6 min",
        completed: false,
      },
      {
        id: "concentration",
        title: "Portfolio Concentration",
        description:
          "Understand the risks of putting too much capital into one position.",
        duration: "5 min",
        completed: false,
      },
    ],
  },
  {
    id: "psychology",
    level: "ADVANCED",
    title: "Trading Psychology",
    description:
      "Develop a structured approach to emotions, decision-making, consistency, and post-trade reflection.",
    modules: [
      {
        id: "emotions",
        title: "Trading Emotions",
        description:
          "Identify emotional patterns that can affect trading decisions.",
        duration: "6 min",
        completed: false,
      },
      {
        id: "fomo",
        title: "FOMO & Impulsive Decisions",
        description:
          "Learn how fear of missing out can influence trade entries.",
        duration: "6 min",
        completed: false,
      },
      {
        id: "journaling",
        title: "Using a Trading Journal",
        description:
          "Turn your completed trades into structured learning opportunities.",
        duration: "5 min",
        completed: false,
      },
      {
        id: "consistency",
        title: "Building Consistency",
        description:
          "Focus on repeatable processes instead of individual trade outcomes.",
        duration: "6 min",
        completed: false,
      },
    ],
  },
];

function levelLabel(level: Level) {
  return (
    level.charAt(0) +
    level.slice(1).toLowerCase()
  );
}

function getCourseProgress(course: Course) {
  if (course.modules.length === 0) {
    return 0;
  }

  const completed = course.modules.filter(
    (module) => module.completed,
  ).length;

  return Math.round(
    (completed / course.modules.length) * 100,
  );
}

function isLevelUnlocked(
  courses: Course[],
  level: Level,
) {
  const levelIndex = LEVEL_ORDER.indexOf(level);

  if (levelIndex <= 0) {
    return true;
  }

  const previousLevel =
    LEVEL_ORDER[levelIndex - 1];

  const previousCourse = courses.find(
    (course) => course.level === previousLevel,
  );

  if (!previousCourse) {
    return false;
  }

  return previousCourse.modules.every(
    (module) => module.completed,
  );
}

function getLevelState(
  courses: Course[],
  level: Level,
) {
  const course = courses.find(
    (item) => item.level === level,
  );

  if (!course) {
    return {
      completed: 0,
      total: 0,
      progress: 0,
      unlocked: false,
    };
  }

  return {
    completed: course.modules.filter(
      (module) => module.completed,
    ).length,
    total: course.modules.length,
    progress: getCourseProgress(course),
    unlocked: isLevelUnlocked(courses, level),
  };
}

export default function LearnPage() {
  const [selectedLevel, setSelectedLevel] =
    useState<Level>("BEGINNER");

  const [courses, setCourses] =
    useState<Course[]>(COURSES);

  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [progressError, setProgressError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setLoadingProgress(true);
      setProgressError("");

      try {
        const response = await fetch(
          "/api/v1/learn/progress",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Failed to load learning progress.",
          );
        }

        if (cancelled) {
          return;
        }

        const progressRecords: ProgressRecord[] =
          Array.isArray(data.progress)
            ? data.progress
            : [];

        const completedLessonIds =
          new Set(
            progressRecords.map(
              (record) => record.lessonId,
            ),
          );

        const updatedCourses =
          COURSES.map((course) => ({
            ...course,
            modules: course.modules.map(
              (module) => ({
                ...module,
                completed:
                  completedLessonIds.has(
                    module.id,
                  ),
              }),
            ),
          }));

        setCourses(updatedCourses);

        /*
         * If the saved progress means the current
         * level is no longer unlocked, move the user
         * to the first available level.
         */
        if (
          !isLevelUnlocked(
            updatedCourses,
            selectedLevel,
          )
        ) {
          const firstUnlockedLevel =
            LEVEL_ORDER.find((level) =>
              isLevelUnlocked(
                updatedCourses,
                level,
              ),
            );

          if (firstUnlockedLevel) {
            setSelectedLevel(
              firstUnlockedLevel,
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load learning progress:",
          error,
        );

        if (!cancelled) {
          setProgressError(
            "We couldn't load your saved learning progress.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProgress(false);
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [selectedLevel]);

  const selectedCourse = useMemo(
    () =>
      courses.find(
        (course) =>
          course.level === selectedLevel,
      ),
    [courses, selectedLevel],
  );

  const totalModules = courses.reduce(
    (total, course) =>
      total + course.modules.length,
    0,
  );

  const completedModules = courses.reduce(
    (total, course) =>
      total +
      course.modules.filter(
        (module) => module.completed,
      ).length,
    0,
  );

  const overallProgress =
    totalModules > 0
      ? Math.round(
          (completedModules /
            totalModules) *
            100,
        )
      : 0;

  const continueLesson = useMemo(() => {
    for (const level of LEVEL_ORDER) {
      const course = courses.find(
        (item) => item.level === level,
      );

      if (!course) {
        continue;
      }

      const incompleteModule =
        course.modules.find(
          (module) => !module.completed,
        );

      if (
        incompleteModule &&
        isLevelUnlocked(courses, level)
      ) {
        return {
          course,
          module: incompleteModule,
        };
      }
    }

    return null;
  }, [courses]);

  const selectedCourseCompleted =
    selectedCourse?.modules.filter(
      (module) => module.completed,
    ).length ?? 0;

  const selectedCourseTotal =
    selectedCourse?.modules.length ?? 0;

  const selectedCourseProgress =
    selectedCourseTotal > 0
      ? Math.round(
          (selectedCourseCompleted /
            selectedCourseTotal) *
            100,
        )
      : 0;

  const selectedLevelUnlocked =
    isLevelUnlocked(
      courses,
      selectedLevel,
    );

  const selectedCourseComplete =
    selectedCourseTotal > 0 &&
    selectedCourseCompleted ===
      selectedCourseTotal;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="flex min-h-screen">
        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                TC
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  TradeCraft
                </p>

                <p className="text-xs text-slate-500">
                  Simulated Trading
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <NavItem
              href="/"
              icon="⌂"
              label="Dashboard"
            />

            <NavItem
              href="/markets"
              icon="◈"
              label="Markets"
            />

            <NavItem
              href="/portfolio"
              icon="▣"
              label="Portfolio"
            />

            <NavItem
              href="/orders"
              icon="↔"
              label="Orders"
            />

            <NavItem
              href="/journal"
              icon="✎"
              label="Journal"
            />

            <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Learning
            </p>

            <NavItem
              href="/learn"
              icon="◎"
              label="Learn"
              active
            />

            <NavItem
              href="/challenges"
              icon="★"
              label="Challenges"
            />

            <NavItem
              href="/community"
              icon="♧"
              label="Community"
            />
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">
                Demo Trader
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Simulated account
              </p>
            </div>
          </div>
        </aside>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          {/* TOP BAR */}

          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Learn
                </h1>

                <p className="hidden text-xs text-slate-500 sm:block">
                  Build your trading knowledge step by
                  step.
                </p>
              </div>

              <Link
                href="/challenges"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Challenges →
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {/* ==================================================
                HERO
            ================================================== */}

            <section className="overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Trading Education
                  </p>

                  <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                    Learn before you risk.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Build practical knowledge through
                    short, focused lessons covering
                    markets, execution, risk management,
                    and trading psychology.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <StatBox
                      label="Lessons"
                      value={String(totalModules)}
                    />

                    <StatBox
                      label="Completed"
                      value={String(
                        completedModules,
                      )}
                    />

                    <StatBox
                      label="Progress"
                      value={`${overallProgress}%`}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Overall Progress
                    </p>

                    <span className="text-sm font-bold">
                      {loadingProgress
                        ? "..."
                        : `${overallProgress}%`}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${overallProgress}%`,
                      }}
                    />
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    {loadingProgress
                      ? "Loading your saved learning progress..."
                      : `${completedModules} of ${totalModules} lessons completed.`}
                  </p>

                  {continueLesson &&
                    !loadingProgress && (
                      <Link
                        href={`/learn/${continueLesson.module.id}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-100"
                      >
                        Continue{" "}
                        {continueLesson.module.title} →
                      </Link>
                    )}

                  {!continueLesson &&
                    !loadingProgress &&
                    totalModules > 0 && (
                      <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-300">
                        🎉 All lessons completed
                      </div>
                    )}
                </div>
              </div>
            </section>

            {/* ==================================================
                ERROR
            ================================================== */}

            {progressError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {progressError}
              </div>
            )}

            {/* ==================================================
                LEARNING PATH
            ================================================== */}

            <section>
              <p className="text-sm font-medium text-slate-500">
                Learning Path
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Progress through the curriculum
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Start with the fundamentals, build your
                risk-management knowledge, then move into
                trading psychology and consistency.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {LEVEL_ORDER.map(
                  (level, index) => {
                    const state =
                      getLevelState(
                        courses,
                        level,
                      );

                    const isSelected =
                      selectedLevel === level;

                    return (
                      <button
                        key={level}
                        type="button"
                        disabled={!state.unlocked}
                        onClick={() => {
                          if (state.unlocked) {
                            setSelectedLevel(
                              level,
                            );
                          }
                        }}
                        className={`relative overflow-hidden rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : state.unlocked
                              ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                              : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                                isSelected
                                  ? "text-slate-400"
                                  : "text-slate-400"
                              }`}
                            >
                              Level {index + 1}
                            </p>

                            <h3 className="mt-2 text-base font-bold">
                              {levelLabel(
                                level,
                              )}
                            </h3>
                          </div>

                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                              isSelected
                                ? "bg-white/10"
                                : state.completed ===
                                      state.total &&
                                    state.total > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : state.unlocked
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            {!state.unlocked
                              ? "🔒"
                              : state.completed ===
                                      state.total &&
                                    state.total > 0
                                ? "✓"
                                : index + 1}
                          </div>
                        </div>

                        <div className="mt-5">
                          <div
                            className={`flex items-center justify-between text-xs ${
                              isSelected
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            <span>
                              {state.completed}/
                              {state.total} lessons
                            </span>

                            <span>
                              {state.progress}%
                            </span>
                          </div>

                          <div
                            className={`mt-2 h-1.5 overflow-hidden rounded-full ${
                              isSelected
                                ? "bg-slate-700"
                                : "bg-slate-100"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSelected
                                  ? "bg-emerald-400"
                                  : "bg-slate-900"
                              }`}
                              style={{
                                width: `${state.progress}%`,
                              }}
                            />
                          </div>
                        </div>

                        {!state.unlocked && (
                          <p className="mt-4 text-xs text-slate-400">
                            Complete the previous level
                            to unlock.
                          </p>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* ==================================================
                SELECTED COURSE
            ================================================== */}

            {selectedCourse && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {selectedCourse.level}
                    </span>

                    <h3 className="mt-3 text-xl font-bold">
                      {selectedCourse.title}
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {selectedCourse.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3 sm:min-w-[150px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Course Progress
                    </p>

                    <div className="mt-1 flex items-baseline gap-2">
                      <p className="text-lg font-bold">
                        {selectedCourseCompleted}/
                        {selectedCourseTotal}
                      </p>

                      <span className="text-xs font-semibold text-slate-400">
                        {selectedCourseProgress}%
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedLevelUnlocked && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <span className="text-base">
                      🔒
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        This level is locked
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Complete the previous level before
                        continuing here.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${selectedCourseProgress}%`,
                    }}
                  />
                </div>

                {selectedCourseComplete && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-900">
                      ✓ Level completed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      You have completed every lesson in
                      this level. The next level is now
                      available.
                    </p>
                  </div>
                )}

                {/* Modules */}

                <div className="mt-6 space-y-3">
                  {selectedCourse.modules.map(
                    (module, index) => {
                      const previousModule =
                        index > 0
                          ? selectedCourse
                              .modules[index - 1]
                          : null;

                      const moduleUnlocked =
                        selectedLevelUnlocked &&
                        (index === 0 ||
                          Boolean(
                            previousModule?.completed,
                          ));

                      const isCurrent =
                        moduleUnlocked &&
                        !module.completed;

                      return (
                        <div
                          key={module.id}
                          className={`rounded-xl border p-4 transition ${
                            isCurrent
                              ? "border-slate-300 bg-slate-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                  module.completed
                                    ? "bg-emerald-100 text-emerald-700"
                                    : isCurrent
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {module.completed
                                  ? "✓"
                                  : !moduleUnlocked
                                    ? "🔒"
                                    : index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold">
                                    {module.title}
                                  </h4>

                                  {module.completed && (
                                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      Completed
                                    </span>
                                  )}

                                  {isCurrent && (
                                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                      Continue
                                    </span>
                                  )}

                                  {!moduleUnlocked &&
                                    !module.completed && (
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                        Locked
                                      </span>
                                    )}
                                </div>

                                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                                  {module.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:justify-end">
                              <span className="text-xs font-medium text-slate-400">
                                {module.duration}
                              </span>

                              {moduleUnlocked ||
                              module.completed ? (
                                <Link
                                  href={`/learn/${module.id}`}
                                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                  {module.completed
                                    ? "Review"
                                    : isCurrent
                                      ? "Continue"
                                      : "Start"}
                                </Link>
                              ) : (
                                <span className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400">
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {/* ==================================================
                HOW IT WORKS
            ================================================== */}

            <section>
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500">
                  Your learning loop
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Learn. Practice. Reflect.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <LearningFeature
                  number="01"
                  title="Learn"
                  description="Complete short lessons focused on one practical trading concept at a time."
                />

                <LearningFeature
                  number="02"
                  title="Practice"
                  description="Apply concepts inside the simulated trading environment without using real money."
                />

                <LearningFeature
                  number="03"
                  title="Reflect"
                  description="Use your journal and portfolio analytics to understand your decisions and behavior."
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ==================================================
          MOBILE NAV
      ================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-4">
          <MobileNavItem
            href="/"
            icon="⌂"
            label="Home"
          />

          <MobileNavItem
            href="/markets"
            icon="◈"
            label="Markets"
          />

          <MobileNavItem
            href="/portfolio"
            icon="▣"
            label="Portfolio"
          />

          <MobileNavItem
            href="/learn"
            icon="◎"
            label="Learn"
            active
          />
        </div>
      </nav>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="w-5 text-center text-base">
        {icon}
      </span>

      {label}
    </Link>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium ${
        active
          ? "text-slate-900"
          : "text-slate-400"
      }`}
    >
      <span className="text-lg">
        {icon}
      </span>

      {label}
    </Link>
  );
}

function LearningFeature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
