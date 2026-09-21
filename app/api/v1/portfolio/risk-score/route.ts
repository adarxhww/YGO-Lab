import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { calculateRiskScore } from "@/lib/trading/risk-score";

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
          message: "Trading account not found",
        },
        { status: 404 }
      );
    }

    const riskScore = await calculateRiskScore(prisma, {
      accountId: account.id,
    });

    return NextResponse.json({
      success: true,
      riskScore,
    });
  } catch (error) {
    console.error("Risk score API error:", error);

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

    const message =
      error instanceof Error
        ? error.message
        : "Failed to calculate risk score";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}
