import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createJournalSchema = z.object({
  tradeId: z.string().uuid(),
  entryReason: z.string().min(1).max(2000),
  strategy: z.string().min(1).max(500),
  expectedOutcome: z.string().min(1).max(2000),
  stopLossPrice: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
  confidenceRating: z.number().int().min(1).max(10),
  emotionalState: z.enum([
    "CALM",
    "ANXIOUS",
    "OVERCONFIDENT",
    "FOMO",
    "REVENUE_SEEKING",
    "NEUTRAL",
  ]),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const journalEntries =
      await prisma.journalEntry.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          trade: {
            openedAt: "desc",
          },
        },
        select: {
          id: true,
          userId: true,
          tradeId: true,
          entryReason: true,
          strategy: true,
          expectedOutcome: true,
          stopLossPrice: true,
          targetPrice: true,
          confidenceRating: true,
          emotionalState: true,
          trade: {
            select: {
              id: true,
              side: true,
              quantity: true,
              entryPrice: true,
              exitPrice: true,
              realizedPnL: true,
              openedAt: true,
              closedAt: true,
              instrument: {
                select: {
                  symbol: true,
                  name: true,
                  exchange: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      journalEntries,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/journal error:",
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
        error: "Failed to fetch journal entries",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const validation =
      createJournalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid journal entry",
          details:
            validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      tradeId,
      entryReason,
      strategy,
      expectedOutcome,
      stopLossPrice,
      targetPrice,
      confidenceRating,
      emotionalState,
    } = validation.data;

    /*
     * Verify that the selected trade belongs to
     * the authenticated user's trading account.
     */
    const trade =
      await prisma.trade.findFirst({
        where: {
          id: tradeId,
          account: {
            userId: user.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (!trade) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Trade not found for this user",
        },
        { status: 404 }
      );
    }

    /*
     * A trade can have only one journal entry.
     */
    const existingEntry =
      await prisma.journalEntry.findUnique({
        where: {
          tradeId,
        },
        select: {
          id: true,
        },
      });

    if (existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A journal entry already exists for this trade",
        },
        { status: 409 }
      );
    }

    const journalEntry =
      await prisma.journalEntry.create({
        data: {
          userId: user.id,
          tradeId,
          entryReason,
          strategy,
          expectedOutcome,
          stopLossPrice,
          targetPrice,
          confidenceRating,
          emotionalState,
        },
        select: {
          id: true,
          userId: true,
          tradeId: true,
          entryReason: true,
          strategy: true,
          expectedOutcome: true,
          stopLossPrice: true,
          targetPrice: true,
          confidenceRating: true,
          emotionalState: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Journal entry created",
        journalEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/journal error:",
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
        error: "Failed to create journal entry",
      },
      { status: 500 }
    );
  }
}
