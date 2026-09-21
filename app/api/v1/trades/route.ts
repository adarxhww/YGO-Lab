import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

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

    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,

        // Only trades that don't already have a journal
        // entry should appear in the Journal form.
        journalEntry: null,
      },

      include: {
        instrument: true,
      },

      orderBy: {
        openedAt: "desc",
      },
    });

    const serializedTrades = trades.map((trade) => ({
      id: trade.id,
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice?.toString() ?? null,
      realizedPnL: trade.realizedPnL.toString(),
      openedAt: trade.openedAt.toISOString(),
      closedAt: trade.closedAt?.toISOString() ?? null,

      instrument: {
        id: trade.instrument.id,
        symbol: trade.instrument.symbol,
        name: trade.instrument.name,
        exchange: trade.instrument.exchange,
        type: trade.instrument.type,
      },
    }));

    return NextResponse.json({
      success: true,
      trades: serializedTrades,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/trades failed:",
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
        error: "Failed to fetch trades",
      },
      { status: 500 }
    );
  }
}
