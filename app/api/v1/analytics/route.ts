import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TradeRecord = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  realizedPnL: number;
  openedAt: string;
  closedAt: string | null;
};

function round(value: number, decimals = 2) {
  const multiplier = Math.pow(10, decimals);

  return (
    Math.round((value + Number.EPSILON) * multiplier) /
    multiplier
  );
}

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        currency: true,
        cashBalance: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Trading account not found",
        },
        { status: 404 }
      );
    }

    /*
     * Fetch trades together with their instruments.
     *
     * Trades with an exit price represent completed
     * trades and therefore have realized P&L.
     */
    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,
      },
      include: {
        instrument: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
      orderBy: {
        openedAt: "asc",
      },
    });

    const tradeRecords: TradeRecord[] = trades.map(
      (trade) => ({
        id: trade.id,
        symbol: trade.instrument.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: Number(trade.entryPrice),
        exitPrice:
          trade.exitPrice === null
            ? null
            : Number(trade.exitPrice),
        realizedPnL: Number(trade.realizedPnL),
        openedAt: trade.openedAt.toISOString(),
        closedAt:
          trade.closedAt === null
            ? null
            : trade.closedAt.toISOString(),
      })
    );

    /*
     * Only closed trades are used for win/loss statistics.
     */
    const closedTrades = tradeRecords.filter(
      (trade) =>
        trade.closedAt !== null &&
        trade.exitPrice !== null
    );

    const winningTrades = closedTrades.filter(
      (trade) => trade.realizedPnL > 0
    );

    const losingTrades = closedTrades.filter(
      (trade) => trade.realizedPnL < 0
    );

    const breakevenTrades = closedTrades.filter(
      (trade) => trade.realizedPnL === 0
    );

    const totalRealizedPnL = closedTrades.reduce(
      (total, trade) =>
        total + trade.realizedPnL,
      0
    );

    const grossProfit = winningTrades.reduce(
      (total, trade) =>
        total + trade.realizedPnL,
      0
    );

    const grossLoss = losingTrades.reduce(
      (total, trade) =>
        total + Math.abs(trade.realizedPnL),
      0
    );

    const winRate =
      closedTrades.length > 0
        ? (winningTrades.length /
            closedTrades.length) *
          100
        : 0;

    const averageWin =
      winningTrades.length > 0
        ? grossProfit / winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? grossLoss / losingTrades.length
        : 0;

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
          ? null
          : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(
            ...winningTrades.map(
              (trade) => trade.realizedPnL
            )
          )
        : 0;

    const largestLoss =
      losingTrades.length > 0
        ? Math.min(
            ...losingTrades.map(
              (trade) => trade.realizedPnL
            )
          )
        : 0;

    /*
     * Portfolio snapshots provide historical equity
     * information for the performance curve.
     */
    const snapshots =
      await prisma.portfolioSnapshot.findMany({
        where: {
          accountId: account.id,
        },
        orderBy: {
          timestamp: "asc",
        },
        select: {
          id: true,
          totalValue: true,
          cashBalance: true,
          holdingsValue: true,
          unrealizedPnL: true,
          realizedPnL: true,
          timestamp: true,
        },
      });

    const performanceHistory = snapshots.map(
      (snapshot) => ({
        id: snapshot.id,
        totalValue: Number(
          snapshot.totalValue
        ),
        cashBalance: Number(
          snapshot.cashBalance
        ),
        holdingsValue: Number(
          snapshot.holdingsValue
        ),
        unrealizedPnL: Number(
          snapshot.unrealizedPnL
        ),
        realizedPnL: Number(
          snapshot.realizedPnL
        ),
        timestamp:
          snapshot.timestamp.toISOString(),
      })
    );

    /*
     * Calculate maximum drawdown from snapshots.
     */
    let peakValue = 0;
    let maximumDrawdown = 0;

    for (const snapshot of performanceHistory) {
      if (snapshot.totalValue > peakValue) {
        peakValue = snapshot.totalValue;
      }

      if (peakValue > 0) {
        const drawdown =
          ((snapshot.totalValue - peakValue) /
            peakValue) *
          100;

        if (drawdown < maximumDrawdown) {
          maximumDrawdown = drawdown;
        }
      }
    }

    const latestSnapshot =
      performanceHistory.length > 0
        ? performanceHistory[
            performanceHistory.length - 1
          ]
        : null;

    const firstSnapshot =
      performanceHistory.length > 0
        ? performanceHistory[0]
        : null;

    const currentPortfolioValue =
      latestSnapshot?.totalValue ??
      Number(account.cashBalance);

    const firstPortfolioValue =
      firstSnapshot?.totalValue ?? 100000;

    const portfolioReturn =
      firstPortfolioValue > 0
        ? ((currentPortfolioValue -
            firstPortfolioValue) /
            firstPortfolioValue) *
          100
        : 0;

    /*
     * Determine currently open trades.
     */
    const openTrades = tradeRecords.filter(
      (trade) => trade.closedAt === null
    );

    /*
     * Symbol-level realized P&L.
     */
    const symbolStats = new Map<
      string,
      {
        symbol: string;
        realizedPnL: number;
        trades: number;
        wins: number;
        losses: number;
      }
    >();

    for (const trade of closedTrades) {
      const existing =
        symbolStats.get(trade.symbol);

      if (existing) {
        existing.realizedPnL +=
          trade.realizedPnL;

        existing.trades += 1;

        if (trade.realizedPnL > 0) {
          existing.wins += 1;
        }

        if (trade.realizedPnL < 0) {
          existing.losses += 1;
        }
      } else {
        symbolStats.set(trade.symbol, {
          symbol: trade.symbol,
          realizedPnL:
            trade.realizedPnL,
          trades: 1,
          wins:
            trade.realizedPnL > 0
              ? 1
              : 0,
          losses:
            trade.realizedPnL < 0
              ? 1
              : 0,
        });
      }
    }

    const symbolPerformance = Array.from(
      symbolStats.values()
    )
      .map((item) => ({
        ...item,
        realizedPnL: round(
          item.realizedPnL
        ),
        winRate:
          item.trades > 0
            ? round(
                (item.wins /
                  item.trades) *
                  100
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.realizedPnL -
          a.realizedPnL
      );

    /*
     * Daily/chronological trade P&L data.
     */
    const tradePerformance =
      closedTrades.map((trade) => ({
        tradeId: trade.id,
        symbol: trade.symbol,
        realizedPnL: round(
          trade.realizedPnL
        ),
        closedAt: trade.closedAt,
      }));

    return NextResponse.json({
      success: true,

      analytics: {
        accountId: account.id,
        currency: account.currency,

        overview: {
          totalTrades:
            closedTrades.length,
          openTrades:
            openTrades.length,
          winningTrades:
            winningTrades.length,
          losingTrades:
            losingTrades.length,
          breakevenTrades:
            breakevenTrades.length,

          winRate: round(winRate),

          totalRealizedPnL: round(
            totalRealizedPnL
          ),

          grossProfit: round(
            grossProfit
          ),

          grossLoss: round(
            grossLoss
          ),

          averageWin: round(
            averageWin
          ),

          averageLoss: round(
            averageLoss
          ),

          profitFactor:
            profitFactor === null
              ? null
              : round(profitFactor),

          largestWin: round(
            largestWin
          ),

          largestLoss: round(
            largestLoss
          ),
        },

        portfolio: {
          currentValue: round(
            currentPortfolioValue
          ),

          firstSnapshotValue: round(
            firstPortfolioValue
          ),

          returnPercentage: round(
            portfolioReturn
          ),

          maximumDrawdown: round(
            maximumDrawdown
          ),
        },

        symbolPerformance,

        tradePerformance,

        performanceHistory,

        trades: tradeRecords,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/v1/analytics error:",
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
        error:
          "Failed to calculate trading analytics",
      },
      { status: 500 }
    );
  }
}
