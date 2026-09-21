import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRiskLevel(score: number) {
  if (score >= 80) {
    return "CRITICAL";
  }

  if (score >= 60) {
    return "HIGH";
  }

  if (score >= 30) {
    return "MODERATE";
  }

  return "LOW";
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

    const positions = await prisma.position.findMany({
      where: {
        accountId: account.id,
      },
      include: {
        instrument: true,
      },
    });

    const marketValues = await Promise.all(
      positions.map(async (position) => {
        const latestPrice = await prisma.marketPrice.findFirst({
          where: {
            instrumentId: position.instrumentId,
          },
          orderBy: {
            timestamp: "desc",
          },
        });

        const currentPrice =
          latestPrice?.lastPrice ?? position.averageEntryPrice;

        const marketValue = currentPrice.mul(position.quantity);

        return {
          symbol: position.instrument.symbol,
          quantity: position.quantity,
          marketValue: marketValue.toNumber(),
        };
      })
    );

    const cashBalance = Number(account.cashBalance);

    const holdingsValue = marketValues.reduce(
      (total, position) => total + position.marketValue,
      0
    );

    const totalValue = cashBalance + holdingsValue;

    if (totalValue <= 0) {
      return NextResponse.json({
        success: true,
        risk: {
          score: 0,
          level: "LOW",
          concentration: 0,
          drawdown: 0,
          cashExposure: 0,
          warnings: [],
        },
      });
    }

    const largestPositionValue = marketValues.reduce(
      (largest, position) =>
        Math.max(largest, position.marketValue),
      0
    );

    const largestPositionPercentage =
      totalValue === 0
        ? 0
        : (largestPositionValue / totalValue) * 100;

    const cashPercentage =
      (cashBalance / totalValue) * 100;

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        accountId: account.id,
      },
      orderBy: {
        timestamp: "asc",
      },
      select: {
        totalValue: true,
      },
    });

    let maximumDrawdown = 0;
    let peakValue = totalValue;

    for (const snapshot of snapshots) {
      const value = Number(snapshot.totalValue);

      if (value > peakValue) {
        peakValue = value;
      }

      if (peakValue > 0) {
        const drawdown =
          ((peakValue - value) / peakValue) * 100;

        maximumDrawdown = Math.max(
          maximumDrawdown,
          drawdown
        );
      }
    }

    const concentrationPoints =
      largestPositionPercentage >= 50
        ? 40
        : largestPositionPercentage >= 35
          ? 30
          : largestPositionPercentage >= 25
            ? 20
            : largestPositionPercentage >= 15
              ? 10
              : 0;

    const drawdownPoints =
      maximumDrawdown >= 20
        ? 40
        : maximumDrawdown >= 10
          ? 30
          : maximumDrawdown >= 5
            ? 20
            : maximumDrawdown >= 2
              ? 10
              : 0;

    const cashRiskPoints =
      cashPercentage < 10
        ? 20
        : cashPercentage < 20
          ? 10
          : 0;

    const score = Math.min(
      100,
      concentrationPoints +
        drawdownPoints +
        cashRiskPoints
    );

    const warnings: string[] = [];

    if (largestPositionPercentage >= 25) {
      warnings.push(
        `Largest position represents ${largestPositionPercentage.toFixed(
          1
        )}% of total portfolio value.`
      );
    }

    if (maximumDrawdown >= 5) {
      warnings.push(
        `Portfolio drawdown is currently ${maximumDrawdown.toFixed(
          1
        )}%.`
      );
    }

    if (cashPercentage < 10) {
      warnings.push(
        `Cash represents only ${cashPercentage.toFixed(
          1
        )}% of total portfolio value.`
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      account: {
        id: account.id,
        currency: account.currency,
        isSimulated: account.isSimulated,
      },
      risk: {
        score,
        level: getRiskLevel(score),
        concentration: Number(
          largestPositionPercentage.toFixed(4)
        ),
        drawdown: Number(
          maximumDrawdown.toFixed(4)
        ),
        cashExposure: Number(
          cashPercentage.toFixed(4)
        ),
        warnings,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/risk error:", error);

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
        error: "Failed to calculate portfolio risk",
      },
      { status: 500 }
    );
  }
}
