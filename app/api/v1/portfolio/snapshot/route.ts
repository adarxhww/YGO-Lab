import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

async function getPortfolioSnapshotData(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      currency: true,
      cashBalance: true,
      reservedMargin: true,
      isSimulated: true,
    },
  });

  if (!account) {
    throw new Error("Trading account not found");
  }

  const positions = await prisma.position.findMany({
    where: {
      accountId: account.id,
      quantity: {
        gt: 0,
      },
    },
    select: {
      instrumentId: true,
      quantity: true,
      averageEntryPrice: true,
    },
  });

  let holdingsValue = 0;
  let unrealizedPnL = 0;

  for (const position of positions) {
    const latestPrice = await prisma.marketPrice.findFirst({
      where: {
        instrumentId: position.instrumentId,
      },
      orderBy: {
        timestamp: "desc",
      },
      select: {
        lastPrice: true,
      },
    });

    const averageEntryPrice = Number(
      position.averageEntryPrice
    );

    const currentPrice = latestPrice
      ? Number(latestPrice.lastPrice)
      : averageEntryPrice;

    const marketValue =
      currentPrice * position.quantity;

    const positionUnrealizedPnL =
      (currentPrice - averageEntryPrice) *
      position.quantity;

    holdingsValue += marketValue;
    unrealizedPnL += positionUnrealizedPnL;
  }

  const trades = await prisma.trade.findMany({
    where: {
      accountId: account.id,
    },
    select: {
      realizedPnL: true,
    },
  });

  const realizedPnL = trades.reduce(
    (total, trade) =>
      total + Number(trade.realizedPnL),
    0
  );

  const cashBalance = Number(account.cashBalance);

  const totalValue =
    cashBalance + holdingsValue;

  return {
    accountId: account.id,
    currency: account.currency,
    isSimulated: account.isSimulated,
    cashBalance,
    holdingsValue,
    unrealizedPnL,
    realizedPnL,
    totalValue,
    reservedMargin: Number(account.reservedMargin),
  };
}

export async function POST() {
  try {
    const user = await requireCurrentUser();

    const snapshotData =
      await getPortfolioSnapshotData(user.id);

    const snapshot =
      await prisma.portfolioSnapshot.create({
        data: {
          accountId: snapshotData.accountId,
          totalValue: snapshotData.totalValue,
          cashBalance: snapshotData.cashBalance,
          holdingsValue: snapshotData.holdingsValue,
          unrealizedPnL: snapshotData.unrealizedPnL,
          realizedPnL: snapshotData.realizedPnL,
        },
        select: {
          id: true,
          accountId: true,
          totalValue: true,
          cashBalance: true,
          holdingsValue: true,
          unrealizedPnL: true,
          realizedPnL: true,
          timestamp: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Portfolio snapshot created",
        snapshot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/portfolio/snapshot error:",
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

    if (
      error instanceof Error &&
      error.message === "Trading account not found"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Trading account not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create portfolio snapshot",
      },
      { status: 500 }
    );
  }
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

    return NextResponse.json({
      success: true,
      snapshots,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/portfolio/snapshot error:",
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
        error: "Failed to fetch portfolio snapshots",
      },
      { status: 500 }
    );
  }
}
