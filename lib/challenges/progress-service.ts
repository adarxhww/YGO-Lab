import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateJournalStreak(dates: Date[]) {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDateKeys = Array.from(
    new Set(dates.map(getDateKey))
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDateKeys.length === 0) {
    return 0;
  }

  let streak = 1;

  for (
    let index = 1;
    index < uniqueDateKeys.length;
    index++
  ) {
    const previous = new Date(
      `${uniqueDateKeys[index - 1]}T00:00:00.000Z`
    );

    const current = new Date(
      `${uniqueDateKeys[index]}T00:00:00.000Z`
    );

    const difference =
      (previous.getTime() - current.getTime()) /
      (1000 * 60 * 60 * 24);

    if (difference === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export async function updateChallengeProgress(
  db: DbClient,
  userId: string
) {
  const userChallenges =
    await db.userChallenge.findMany({
      where: {
        userId,
      },
      include: {
        challenge: true,
      },
    });

  if (userChallenges.length === 0) {
    return [];
  }

  const now = new Date();
  const updatedChallenges = [];

  for (const userChallenge of userChallenges) {
    const durationMilliseconds =
      userChallenge.challenge.durationDays *
      24 *
      60 *
      60 *
      1000;

    const expiresAt = new Date(
      userChallenge.startedAt.getTime() +
        durationMilliseconds
    );

    const expired = now >= expiresAt;

    if (userChallenge.completed) {
      updatedChallenges.push(userChallenge);
      continue;
    }

    if (expired) {
      const updated =
        await db.userChallenge.update({
          where: {
            id: userChallenge.id,
          },
          data: {
            progress: userChallenge.progress,
            completed: false,
            completedAt: null,
          },
        });

      updatedChallenges.push(updated);
      continue;
    }

    let progress = userChallenge.progress;

    switch (
      userChallenge.challenge.targetType
    ) {
      case "COMPLETE_TRADES": {
        progress = await db.execution.count({
          where: {
            account: {
              userId,
            },
            executedAt: {
              gte: userChallenge.startedAt,
            },
          },
        });

        break;
      }

      case "JOURNAL_STREAK": {
        const journalEntries =
          await db.journalEntry.findMany({
            where: {
              userId,
              trade: {
                openedAt: {
                  gte: userChallenge.startedAt,
                },
              },
            },
            select: {
              trade: {
                select: {
                  openedAt: true,
                },
              },
            },
          });

        const journalDates =
          journalEntries.map(
            (entry) => entry.trade.openedAt
          );

        progress =
          calculateJournalStreak(
            journalDates
          );

        break;
      }

      case "RISK_LIMIT": {
        progress =
          await db.journalEntry.count({
            where: {
              userId,
              stopLossPrice: {
                not: null,
              },
              trade: {
                openedAt: {
                  gte: userChallenge.startedAt,
                },
              },
            },
          });

        break;
      }

      default: {
        progress = userChallenge.progress;
        break;
      }
    }

    progress = Math.max(
      0,
      Math.min(
        progress,
        userChallenge.challenge.targetValue
      )
    );

    const completed =
      progress >=
      userChallenge.challenge.targetValue;

    const wasCompleted =
      userChallenge.completed;

    const completedAt = completed
      ? userChallenge.completedAt ??
        new Date()
      : null;

    const updated =
      await db.userChallenge.update({
        where: {
          id: userChallenge.id,
        },
        data: {
          progress,
          completed,
          completedAt,
        },
      });

    /*
     * Create a notification only when the challenge
     * transitions from incomplete -> completed.
     *
     * This prevents duplicate notifications when
     * progress is recalculated later.
     */
    if (completed && !wasCompleted) {
      await db.notification.create({
        data: {
          userId,
          type: "CHALLENGE",
          message: `Challenge completed: ${userChallenge.challenge.title}`,
        },
      });
    }

    updatedChallenges.push(updated);
  }

  return updatedChallenges;
}
