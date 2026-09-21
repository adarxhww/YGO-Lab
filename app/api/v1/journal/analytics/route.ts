import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
      },
      include: {
        trade: {
          include: {
            instrument: true,
          },
        },
      },
    });

    const totalJournalEntries = journalEntries.length;

    if (totalJournalEntries === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalJournalEntries: 0,
          winningTrades: 0,
          losingTrades: 0,
          breakevenTrades: 0,
          winRate: 0,
          totalRealizedPnL: 0,
          averagePnL: 0,
          averageConfidence: 0,
          emotionalStates: {},
          strategies: {},
        },
      });
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;

    let totalRealizedPnL = 0;
    let totalConfidence = 0;

    const emotionalStates: Record<
      string,
      {
        trades: number;
        totalPnL: number;
        winningTrades: number;
        losingTrades: number;
      }
    > = {};

    const strategies: Record<
      string,
      {
        trades: number;
        totalPnL: number;
        winningTrades: number;
        losingTrades: number;
      }
    > = {};

    for (const entry of journalEntries) {
      const pnl = Number(entry.trade.realizedPnL);
      const confidence = entry.confidenceRating;

      totalRealizedPnL += pnl;
      totalConfidence += confidence;

      if (pnl > 0) {
        winningTrades++;
      } else if (pnl < 0) {
        losingTrades++;
      } else {
        breakevenTrades++;
      }

      const emotion = entry.emotionalState;

      if (!emotionalStates[emotion]) {
        emotionalStates[emotion] = {
          trades: 0,
          totalPnL: 0,
          winningTrades: 0,
          losingTrades: 0,
        };
      }

      emotionalStates[emotion].trades++;
      emotionalStates[emotion].totalPnL += pnl;

      if (pnl > 0) {
        emotionalStates[emotion].winningTrades++;
      }

      if (pnl < 0) {
        emotionalStates[emotion].losingTrades++;
      }

      const strategy = entry.strategy;

      if (!strategies[strategy]) {
        strategies[strategy] = {
          trades: 0,
          totalPnL: 0,
          winningTrades: 0,
          losingTrades: 0,
        };
      }

      strategies[strategy].trades++;
      strategies[strategy].totalPnL += pnl;

      if (pnl > 0) {
        strategies[strategy].winningTrades++;
      }

      if (pnl < 0) {
        strategies[strategy].losingTrades++;
      }
    }

    const completedTrades =
      winningTrades + losingTrades;

    const winRate =
      completedTrades > 0
        ? (winningTrades / completedTrades) * 100
        : 0;

    const averagePnL =
      totalJournalEntries > 0
        ? totalRealizedPnL / totalJournalEntries
        : 0;

    const averageConfidence =
      totalJournalEntries > 0
        ? totalConfidence / totalJournalEntries
        : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalJournalEntries,
        winningTrades,
        losingTrades,
        breakevenTrades,
        winRate: Number(winRate.toFixed(2)),
        totalRealizedPnL: Number(
          totalRealizedPnL.toFixed(2)
        ),
        averagePnL: Number(
          averagePnL.toFixed(2)
        ),
        averageConfidence: Number(
          averageConfidence.toFixed(2)
        ),
        emotionalStates,
        strategies,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/v1/journal/analytics failed:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate journal analytics",
      },
      { status: 500 }
    );
  }
}
