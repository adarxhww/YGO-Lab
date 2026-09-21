"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type Lesson = {
  id: string;
  title: string;
  level: Level;
  duration: string;
  description: string;
  content: string[];
  quiz: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
};

type ProgressRecord = {
  lessonId: string;
  completedAt: string;
};

const LEVEL_ORDER: Level[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

const LESSONS: Lesson[] = [
  {
    id: "market-basics",
    title: "How Financial Markets Work",
    level: "BEGINNER",
    duration: "5 min",
    description:
      "Learn what markets, exchanges, instruments, and prices represent.",
    content: [
      "Financial markets are systems where buyers and sellers exchange financial instruments such as stocks, bonds, currencies, and derivatives.",
      "An exchange provides a structured marketplace where orders from buyers and sellers can interact.",
      "A stock represents ownership in a company. When you buy a stock, you are purchasing a small ownership stake in that business.",
      "Market prices change continuously as buyers and sellers place orders. The interaction between available supply and demand determines the price at which trades occur.",
      "In this platform, market prices are simulated so that you can practice trading without risking real money.",
    ],
    quiz: {
      question:
        "What primarily determines the market price of a stock?",
      options: [
        "The company's CEO",
        "The interaction between supply and demand",
        "The stock exchange alone",
        "The investor's bank balance",
      ],
      answer: 1,
      explanation:
        "Market prices are primarily determined by the interaction of buyers and sellers, or supply and demand.",
    },
  },

  {
    id: "market-orders",
    title: "Market Orders",
    level: "BEGINNER",
    duration: "4 min",
    description:
      "Understand how simulated market orders are executed.",
    content: [
      "A market order tells the trading system that you want to buy or sell an instrument immediately at the best available simulated market price.",
      "The main advantage of a market order is execution speed. You prioritize getting the trade executed rather than specifying an exact price.",
      "Because the market price can change, the final execution price may differ slightly from the price you saw when placing the order.",
      "In this paper-trading platform, simulated slippage is applied to demonstrate this effect.",
    ],
    quiz: {
      question:
        "What is the main purpose of a market order?",
      options: [
        "Guarantee a specific price",
        "Delay execution until tomorrow",
        "Execute the trade at the available market price",
        "Prevent a trade from being executed",
      ],
      answer: 2,
      explanation:
        "A market order prioritizes execution at the currently available market price rather than guaranteeing a specific price.",
    },
  },

  {
    id: "limit-orders",
    title: "Limit Orders",
    level: "BEGINNER",
    duration: "5 min",
    description:
      "Learn how a limit price controls when an order can execute.",
    content: [
      "A limit order lets you specify the maximum price you are willing to pay when buying or the minimum price you are willing to accept when selling.",
      "For a buy limit order, execution can occur only at the specified limit price or a lower price.",
      "For a sell limit order, execution can occur only at the specified limit price or a higher price.",
      "The advantage is greater price control. The trade-off is that the order may never execute if the market does not reach your specified price.",
    ],
    quiz: {
      question:
        "What does a buy limit order specify?",
      options: [
        "The minimum price you will pay",
        "The maximum price you are willing to pay",
        "The exact number of sellers",
        "The exchange's closing price",
      ],
      answer: 1,
      explanation:
        "A buy limit order specifies the maximum price you are willing to pay.",
    },
  },

  {
    id: "fees-slippage",
    title: "Fees & Slippage",
    level: "BEGINNER",
    duration: "5 min",
    description:
      "See why execution costs affect trading performance.",
    content: [
      "Trading does not always happen at zero cost. Brokers, exchanges, and other market infrastructure can introduce transaction costs.",
      "Slippage is the difference between an expected execution price and the actual execution price.",
      "For example, if you expect to buy at ₹1,000 but the simulated execution occurs at ₹1,000.50, the difference represents slippage.",
      "Even small costs can become significant when many trades are made, which is why disciplined traders include costs when evaluating performance.",
    ],
    quiz: {
      question:
        "What does slippage represent?",
      options: [
        "A guaranteed trading profit",
        "The difference between expected and actual execution price",
        "A portfolio deposit",
        "The number of shares owned",
      ],
      answer: 1,
      explanation:
        "Slippage represents the difference between the expected execution price and the actual execution price.",
    },
  },

  {
    id: "position-sizing",
    title: "Position Sizing",
    level: "INTERMEDIATE",
    duration: "7 min",
    description:
      "Learn how position size changes the amount of capital exposed to a trade.",
    content: [
      "Position sizing determines how much capital you allocate to a particular trade.",
      "A larger position can increase both potential gains and potential losses.",
      "Good position sizing considers your available capital, acceptable risk, and the distance to your planned stop-loss.",
      "The goal is not simply to maximize trade size. Instead, position sizing should keep individual losses within a level that your overall portfolio can handle.",
    ],
    quiz: {
      question:
        "Why is position sizing important?",
      options: [
        "It guarantees profitable trades",
        "It determines how much capital is exposed to a trade",
        "It removes all market risk",
        "It guarantees a specific entry price",
      ],
      answer: 1,
      explanation:
        "Position sizing determines how much capital is exposed to a trade and therefore affects potential gains and losses.",
    },
  },

  {
    id: "stop-loss",
    title: "Stop Loss",
    level: "INTERMEDIATE",
    duration: "6 min",
    description:
      "Understand how predefined exit levels can help control downside.",
    content: [
      "A stop loss is a predefined price level where a trader intends to exit a position if the market moves against them.",
      "The purpose is to limit potential losses rather than allowing a losing position to continue indefinitely.",
      "A stop-loss level should be considered alongside position size and the trader's overall risk tolerance.",
      "A stop loss does not guarantee that the exact price will be achieved during a rapidly moving market.",
    ],
    quiz: {
      question:
        "What is the main purpose of a stop loss?",
      options: [
        "Guarantee a profit",
        "Increase position size",
        "Help control downside risk",
        "Predict the market",
      ],
      answer: 2,
      explanation:
        "A stop loss is intended to help control downside risk by defining an exit level.",
    },
  },

  {
    id: "drawdown",
    title: "Understanding Drawdown",
    level: "INTERMEDIATE",
    duration: "6 min",
    description:
      "Learn how portfolio losses accumulate and how drawdown is measured.",
    content: [
      "Drawdown measures the decline in portfolio value from a previous peak to a subsequent low.",
      "For example, if a portfolio reaches ₹120,000 and later falls to ₹100,000, the drawdown from that peak is ₹20,000.",
      "Maximum drawdown measures the largest peak-to-trough decline during a period.",
      "Tracking drawdown helps traders understand how much temporary loss their strategy or portfolio has experienced.",
    ],
    quiz: {
      question:
        "What does maximum drawdown measure?",
      options: [
        "The largest deposit",
        "The largest peak-to-trough decline",
        "The number of trades",
        "The average stock price",
      ],
      answer: 1,
      explanation:
        "Maximum drawdown measures the largest decline from a portfolio peak to a subsequent trough.",
    },
  },

  {
    id: "concentration",
    title: "Portfolio Concentration",
    level: "INTERMEDIATE",
    duration: "5 min",
    description:
      "Understand the risks of putting too much capital into one position.",
    content: [
      "Portfolio concentration occurs when a large portion of your capital is exposed to a small number of positions.",
      "Concentration can increase the effect that one company's price movement has on your total portfolio.",
      "Diversification can spread exposure across multiple instruments, although diversification does not eliminate risk.",
      "Monitoring position weights helps traders understand where their portfolio risk is concentrated.",
    ],
    quiz: {
      question:
        "What can excessive concentration increase?",
      options: [
        "The impact of one position on the overall portfolio",
        "Guaranteed returns",
        "Trading certainty",
        "Market liquidity",
      ],
      answer: 0,
      explanation:
        "When a large portion of capital is concentrated in one position, that position can have a larger effect on the overall portfolio.",
    },
  },

  {
    id: "emotions",
    title: "Trading Emotions",
    level: "ADVANCED",
    duration: "6 min",
    description:
      "Identify emotional patterns that can affect trading decisions.",
    content: [
      "Trading decisions can be influenced by emotions such as fear, excitement, frustration, and overconfidence.",
      "Emotional decision-making can cause traders to abandon predefined plans or take positions that do not match their intended risk.",
      "Recognizing emotional patterns is an important part of developing a consistent trading process.",
      "A trading journal can help identify recurring emotional behaviors over time.",
    ],
    quiz: {
      question:
        "Why should traders monitor their emotional state?",
      options: [
        "Emotions can influence trading decisions",
        "Emotions determine stock prices",
        "Emotions guarantee profits",
        "Emotions eliminate portfolio risk",
      ],
      answer: 0,
      explanation:
        "Emotions can influence decisions and cause traders to deviate from their planned process.",
    },
  },

  {
    id: "fomo",
    title: "FOMO & Impulsive Decisions",
    level: "ADVANCED",
    duration: "6 min",
    description:
      "Learn how fear of missing out can influence trade entries.",
    content: [
      "FOMO, or fear of missing out, can occur when traders feel pressure to enter a trade because an asset has already moved significantly.",
      "This can lead to impulsive entries without a clear setup, risk plan, or exit strategy.",
      "A structured trading plan can help reduce the influence of short-term emotional reactions.",
      "Reviewing missed opportunities objectively can also help prevent the need to chase future moves.",
    ],
    quiz: {
      question:
        "What can FOMO lead to?",
      options: [
        "More disciplined decisions",
        "Impulsive trade entries",
        "Guaranteed profits",
        "Lower market volatility",
      ],
      answer: 1,
      explanation:
        "FOMO can cause traders to enter positions impulsively because they fear missing a market move.",
    },
  },

  {
    id: "journaling",
    title: "Using a Trading Journal",
    level: "ADVANCED",
    duration: "5 min",
    description:
      "Turn your completed trades into structured learning opportunities.",
    content: [
      "A trading journal records the reasoning behind trades as well as their outcomes.",
      "Useful journal information can include entry reason, strategy, expected outcome, confidence, emotional state, stop loss, and target.",
      "Reviewing journal entries can reveal patterns that are difficult to notice when looking at individual trades.",
      "The goal of journaling is not simply to record whether a trade made or lost money. It is to understand the quality of the decision-making process.",
    ],
    quiz: {
      question:
        "What is a key purpose of a trading journal?",
      options: [
        "Guarantee future profits",
        "Understand decision-making patterns",
        "Predict every market movement",
        "Remove all trading risk",
      ],
      answer: 1,
      explanation:
        "A trading journal helps traders review decisions and identify recurring patterns in their process.",
    },
  },

  {
    id: "consistency",
    title: "Building Consistency",
    level: "ADVANCED",
    duration: "6 min",
    description:
      "Focus on repeatable processes instead of individual trade outcomes.",
    content: [
      "Consistency in trading means following a defined process repeatedly rather than changing decisions based on individual outcomes.",
      "A profitable trade does not necessarily mean the decision was good, and a losing trade does not necessarily mean the decision was bad.",
      "Evaluating the quality of the process helps separate decision-making from short-term randomness.",
      "Clear rules, risk management, journaling, and regular review can all contribute to a more consistent process.",
    ],
    quiz: {
      question:
        "What should a consistent trading process focus on?",
      options: [
        "Only individual profits",
        "Repeatable decision-making",
        "Predicting every market movement",
        "Increasing trade frequency",
      ],
      answer: 1,
      explanation:
        "Consistency focuses on following a repeatable decision-making process rather than judging the process only by individual outcomes.",
    },
  },
];

function getLevelIndex(level: Level) {
  return LEVEL_ORDER.indexOf(level);
}

function isLessonUnlocked(
  lesson: Lesson,
  progress: Set<string>,
) {
  const levelIndex = getLevelIndex(lesson.level);

  /*
   * BEGINNER is always unlocked.
   */
  if (levelIndex === 0) {
    const beginnerLessons = LESSONS.filter(
      (item) => item.level === "BEGINNER",
    );

    const lessonIndex = beginnerLessons.findIndex(
      (item) => item.id === lesson.id,
    );

    if (lessonIndex <= 0) {
      return true;
    }

    return beginnerLessons
      .slice(0, lessonIndex)
      .every((item) => progress.has(item.id));
  }

  /*
   * A level is unlocked only after the previous
   * level has been completely finished.
   */
  const previousLevel =
    LEVEL_ORDER[levelIndex - 1];

  const previousLessons = LESSONS.filter(
    (item) => item.level === previousLevel,
  );

  const previousLevelComplete =
    previousLessons.length > 0 &&
    previousLessons.every((item) =>
      progress.has(item.id),
    );

  if (!previousLevelComplete) {
    return false;
  }

  /*
   * Lessons within the unlocked level are sequential.
   */
  const lessonsInLevel = LESSONS.filter(
    (item) => item.level === lesson.level,
  );

  const lessonIndex = lessonsInLevel.findIndex(
    (item) => item.id === lesson.id,
  );

  if (lessonIndex <= 0) {
    return true;
  }

  return lessonsInLevel
    .slice(0, lessonIndex)
    .every((item) => progress.has(item.id));
}

export default function LearnLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const [lessonId, setLessonId] = useState("");

  const [progress, setProgress] =
    useState<ProgressRecord[]>([]);

  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [progressError, setProgressError] =
    useState("");

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [answerSubmitted, setAnswerSubmitted] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [savingProgress, setSavingProgress] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLessonId() {
      const resolvedParams = await params;

      if (!cancelled) {
        setLessonId(resolvedParams.lessonId);
      }
    }

    loadLessonId();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const lesson = useMemo(
    () =>
      LESSONS.find(
        (item) => item.id === lessonId,
      ),
    [lessonId],
  );

  const progressSet = useMemo(
    () =>
      new Set(
        progress.map(
          (record) => record.lessonId,
        ),
      ),
    [progress],
  );

  const lessonUnlocked = lesson
    ? isLessonUnlocked(
        lesson,
        progressSet,
      )
    : false;

  const currentIndex = LESSONS.findIndex(
    (item) => item.id === lessonId,
  );

  const previousLesson =
    currentIndex > 0
      ? LESSONS[currentIndex - 1]
      : null;

  const nextLesson =
    currentIndex >= 0 &&
    currentIndex < LESSONS.length - 1
      ? LESSONS[currentIndex + 1]
      : null;

  const nextLessonUnlocked =
    nextLesson
      ? isLessonUnlocked(
          nextLesson,
          progressSet,
        )
      : false;

  useEffect(() => {
    if (!lessonId) {
      return;
    }

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

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Failed to load progress.",
          );
        }

        if (cancelled) {
          return;
        }

        const records: ProgressRecord[] =
          Array.isArray(data.progress)
            ? data.progress
            : [];

        setProgress(records);

        setCompleted(
          records.some(
            (record) =>
              record.lessonId ===
              lessonId,
          ),
        );
      } catch (error) {
        console.error(
          "Failed to load lesson progress:",
          error,
        );

        if (!cancelled) {
          setProgressError(
            "We couldn't load your learning progress.",
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
  }, [lessonId]);

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
  }, [lessonId]);

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      return;
    }

    setAnswerSubmitted(true);
  };

  const handleComplete = async () => {
    if (
      completed ||
      savingProgress ||
      !lessonId
    ) {
      return;
    }

    if (
      selectedAnswer === null ||
      !answerSubmitted
    ) {
      return;
    }

    try {
      setSavingProgress(true);

      const response = await fetch(
        "/api/v1/learn/progress",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            lessonId,
          }),
        },
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to save progress.",
        );
      }

      setCompleted(true);

      setProgress((current) => {
        if (
          current.some(
            (record) =>
              record.lessonId ===
              lessonId,
          )
        ) {
          return current;
        }

        return [
          ...current,
          {
            lessonId,
            completedAt:
              new Date().toISOString(),
          },
        ];
      });
    } catch (error) {
      console.error(
        "Failed to save lesson progress:",
        error,
      );

      setProgressError(
        "We couldn't save your progress. Please try again.",
      );
    } finally {
      setSavingProgress(false);
    }
  };

  /*
   * While resolving the dynamic route.
   */
  if (!lessonId) {
    return (
      <LoadingScreen message="Loading lesson..." />
    );
  }

  /*
   * Invalid lesson ID.
   */
  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            ?
          </div>

          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            Lesson not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The lesson you are looking for does not
            exist.
          </p>

          <Link
            href="/learn"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  /*
   * Don't allow a user to bypass the curriculum
   * by manually typing a locked lesson URL.
   */
  if (
    !loadingProgress &&
    !lessonUnlocked &&
    !completed
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🔒
          </div>

          <div className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {lesson.level}
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Lesson locked
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Complete the previous lessons in your
            learning path before opening this lesson.
          </p>

          <Link
            href="/learn"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Return to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage =
    LESSONS.length > 0
      ? Math.round(
          ((currentIndex + 1) /
            LESSONS.length) *
            100,
        )
      : 0;

  const answerIsCorrect =
    selectedAnswer === lesson.quiz.answer;

  const canComplete =
    answerSubmitted &&
    selectedAnswer !== null;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="flex min-h-screen">
        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                TC
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900">
                  TradeCraft
                </div>

                <div className="text-xs text-slate-500">
                  Learning Platform
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>

            <SideNavItem
              href="/"
              label="Dashboard"
            />

            <SideNavItem
              href="/markets"
              label="Markets"
            />

            <SideNavItem
              href="/portfolio"
              label="Portfolio"
            />

            <SideNavItem
              href="/orders"
              label="Orders"
            />

            <SideNavItem
              href="/journal"
              label="Journal"
            />

            <div className="mb-3 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Learn
            </div>

            <SideNavItem
              href="/learn"
              label="Learning Center"
              active
            />
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-900">
                Demo Trader
              </div>

              <div className="mt-1 text-[11px] text-slate-500">
                Paper trading account
              </div>
            </div>
          </div>
        </aside>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            {/* Back */}

            <Link
              href="/learn"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← Back to Learning Center
            </Link>

            {/* Header */}

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                    {lesson.level}
                  </span>

                  <span className="text-sm text-slate-500">
                    {lesson.duration}
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {lesson.title}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                  {lesson.description}
                </p>
              </div>

              <div className="shrink-0">
                {loadingProgress ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500">
                    Checking progress...
                  </div>
                ) : completed ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    ✓ Completed
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500">
                    Lesson {currentIndex + 1} of{" "}
                    {LESSONS.length}
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">
                  Learning path
                </span>

                <span className="text-slate-900">
                  {progressPercentage}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* Error */}

            {progressError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {progressError}
              </div>
            )}

            {/* ==================================================
                LESSON CONTENT
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lesson
                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Key Concepts
                </h2>
              </div>

              <div className="space-y-5">
                {lesson.content.map(
                  (paragraph, index) => (
                    <div
                      key={index}
                      className="flex gap-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-7 text-slate-600">
                        {paragraph}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* ==================================================
                QUIZ
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick Check
                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {lesson.quiz.question}
                </h2>
              </div>

              <div className="space-y-3">
                {lesson.quiz.options.map(
                  (option, index) => {
                    const isSelected =
                      selectedAnswer === index;

                    const isCorrect =
                      answerSubmitted &&
                      index ===
                        lesson.quiz.answer;

                    const isWrong =
                      answerSubmitted &&
                      isSelected &&
                      index !==
                        lesson.quiz.answer;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (
                            !answerSubmitted
                          ) {
                            setSelectedAnswer(
                              index,
                            );
                          }
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                          isCorrect
                            ? "border-emerald-300 bg-emerald-50"
                            : isWrong
                              ? "border-red-300 bg-red-50"
                              : isSelected
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : isWrong
                                ? "bg-red-600 text-white"
                                : isSelected
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index,
                          )}
                        </span>

                        <span className="pt-1 text-sm font-medium text-slate-700">
                          {option}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {!answerSubmitted && (
                <button
                  type="button"
                  onClick={
                    handleSubmitAnswer
                  }
                  disabled={
                    selectedAnswer === null
                  }
                  className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check Answer
                </button>
              )}

              {answerSubmitted && (
                <div
                  className={`mt-6 rounded-xl border p-4 ${
                    answerIsCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">
                    {answerIsCorrect
                      ? "Correct!"
                      : "Not quite."}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {lesson.quiz.explanation}
                  </p>

                  {!answerIsCorrect && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswer(
                          null,
                        );
                        setAnswerSubmitted(
                          false,
                        );
                      }}
                      className="mt-3 text-xs font-semibold text-slate-700 underline underline-offset-2"
                    >
                      Try again
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ==================================================
                COMPLETION
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-bold text-slate-950">
                    Finish this lesson
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {completed
                      ? "This lesson has been saved to your learning progress."
                      : "Answer the quick check and mark this lesson as completed."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={
                    completed ||
                    savingProgress ||
                    loadingProgress ||
                    !canComplete
                  }
                  className={`shrink-0 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    completed
                      ? "cursor-default bg-emerald-100 text-emerald-700"
                      : canComplete
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  {savingProgress
                    ? "Saving..."
                    : completed
                      ? "✓ Lesson Completed"
                      : "Mark as Complete"}
                </button>
              </div>

              {!completed &&
                !canComplete && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    Complete the quick check above before
                    marking this lesson as complete.
                  </div>
                )}
            </section>

            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {previousLesson ? (
                <Link
                  href={`/learn/${previousLesson.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Previous
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-900">
                    ← {previousLesson.title}
                  </div>
                </Link>
              ) : (
                <Link
                  href="/learn"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Learning Center
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-900">
                    ← Back to Learning Center
                  </div>
                </Link>
              )}

              {nextLesson &&
              nextLessonUnlocked ? (
                <Link
                  href={`/learn/${nextLesson.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Next Lesson
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-900">
                    {nextLesson.title} →
                  </div>
                </Link>
              ) : nextLesson ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Next Lesson
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                    <span>🔒</span>
                    <span>
                      Complete this lesson first
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href="/learn"
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Course Complete
                  </div>

                  <div className="mt-2 text-sm font-bold text-emerald-900">
                    Back to Learning Center →
                  </div>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-4">
          <MobileNavItem
            href="/"
            label="Home"
          />

          <MobileNavItem
            href="/markets"
            label="Markets"
          />

          <MobileNavItem
            href="/portfolio"
            label="Portfolio"
          />

          <MobileNavItem
            href="/learn"
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

function LoadingScreen({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

function SideNavItem({
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
      className={`mb-1 flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavItem({
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
      className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium ${
        active
          ? "text-slate-900"
          : "text-slate-400"
      }`}
    >
      <span className="text-xs font-semibold">
        {label}
      </span>
    </Link>
  );
}
