import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

function serializeDecimal(value: Prisma.Decimal) {
  return value.toString();
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
          error: "Trading account not found",
        },
        { status: 404 }
      );
    }

    const positions = await Promise.all(
      account.positions.map(async (position) => {
        const marketPrice = await prisma.marketPrice.findFirst({
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

        const marketValue = currentPrice.mul(
          position.quantity
        );

        const unrealizedPnL = currentPrice
          .minus(position.averageEntryPrice)
          .mul(position.quantity);

        const costBasis = position.averageEntryPrice.mul(
          position.quantity
        );

        const unrealizedPnLPercentage = costBasis.isZero()
          ? new Prisma.Decimal(0)
          : unrealizedPnL
              .div(costBasis)
              .mul(100);

        return {
          instrumentId: position.instrumentId,
          symbol: position.instrument.symbol,
          name: position.instrument.name,
          quantity: position.quantity,

          averageEntryPrice: serializeDecimal(
            position.averageEntryPrice
          ),

          currentPrice: serializeDecimal(
            currentPrice
          ),

          marketValue: serializeDecimal(
            marketValue
          ),

          unrealizedPnL: serializeDecimal(
            unrealizedPnL
          ),

          unrealizedPnLPercentage:
            serializeDecimal(
              unrealizedPnLPercentage
            ),

          realizedPnL: serializeDecimal(
            position.realizedPnL
          ),
        };
      })
    );

    /*
     * The account's actual cash balance is the authoritative
     * available-cash value.
     *
     * This is the same Account.cashBalance that the Profile
     * page already displays correctly.
     */
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

    const totalValue = cashBalance.plus(
      holdingsValue
    );

    const totalPnL = realizedPnL.plus(
      unrealizedPnL
    );

    /*
     * Determine the original simulated capital from the
     * deposit ledger rather than hardcoding ₹100,000.
     *
     * This keeps the return calculation tied to the
     * actual account history.
     */
    const initialDeposit = await prisma.transaction.aggregate({
      where: {
        accountId: account.id,
        type: "DEPOSIT_SIMULATED",
      },
      _sum: {
        amount: true,
      },
    });

    const startingCapital =
      initialDeposit._sum.amount ??
      new Prisma.Decimal(0);

    const totalReturnPercentage =
      startingCapital.gt(0)
        ? totalPnL
            .div(startingCapital)
            .mul(100)
        : new Prisma.Decimal(0);

    return NextResponse.json({
      success: true,

      portfolio: {
        accountId: account.id,

        currency: account.currency,

        cashBalance: serializeDecimal(
          cashBalance
        ),

        holdingsValue: serializeDecimal(
          holdingsValue
        ),

        totalValue: serializeDecimal(
          totalValue
        ),

        portfolioValue: serializeDecimal(
          totalValue
        ),

        realizedPnL: serializeDecimal(
          realizedPnL
        ),

        unrealizedPnL: serializeDecimal(
          unrealizedPnL
        ),

        totalPnL: serializeDecimal(
          totalPnL
        ),

        totalReturnPercentage:
          serializeDecimal(
            totalReturnPercentage
          ),

        positions,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/v1/portfolio error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "Authentication required"
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
        error: "Failed to load portfolio",
      },
      { status: 500 }
    );
  }
}
