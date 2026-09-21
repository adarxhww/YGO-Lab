import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
      include: {
        positions: {
          include: {
            instrument: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: "Trading account not found",
        },
        { status: 404 }
      );
    }

    const positions = await Promise.all(
      account.positions.map(async (position) => {
        const marketPrice =
          await prisma.marketPrice.findFirst({
            where: {
              instrumentId: position.instrumentId,
            },
            orderBy: {
              timestamp: "desc",
            },
          });

        const currentPrice =
          marketPrice?.lastPrice ??
          position.averageEntryPrice;

        const marketValue =
          currentPrice.mul(position.quantity);

        const unrealizedPnL = currentPrice
          .minus(position.averageEntryPrice)
          .mul(position.quantity);

        return {
          instrumentId: position.instrumentId,

          symbol: position.instrument.symbol,

          name: position.instrument.name,

          quantity: position.quantity,

          averageEntryPrice:
            position.averageEntryPrice.toString(),

          currentPrice:
            currentPrice.toString(),

          marketValue:
            marketValue.toString(),

          unrealizedPnL:
            unrealizedPnL.toString(),

          realizedPnL:
            position.realizedPnL.toString(),
        };
      })
    );

    const cashBalance = account.cashBalance;

    const holdingsValue = positions.reduce(
      (total, position) =>
        total.plus(
          new Prisma.Decimal(
            position.marketValue
          )
        ),
      new Prisma.Decimal(0)
    );

    const portfolioValue =
      cashBalance.plus(holdingsValue);

    const unrealizedPnL = positions.reduce(
      (total, position) =>
        total.plus(
          new Prisma.Decimal(
            position.unrealizedPnL
          )
        ),
      new Prisma.Decimal(0)
    );

    const realizedPnL = positions.reduce(
      (total, position) =>
        total.plus(
          new Prisma.Decimal(
            position.realizedPnL
          )
        ),
      new Prisma.Decimal(0)
    );

    return NextResponse.json({
      success: true,

      portfolio: {
        accountId: account.id,

        currency: account.currency,

        cashBalance:
          cashBalance.toString(),

        holdingsValue:
          holdingsValue.toString(),

        portfolioValue:
          portfolioValue.toString(),

        unrealizedPnL:
          unrealizedPnL.toString(),

        realizedPnL:
          realizedPnL.toString(),

        positions,
      },
    });
  } catch (error) {
    console.error(
      "Portfolio summary API error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch portfolio summary",
      },
      { status: 500 }
    );
  }
}
