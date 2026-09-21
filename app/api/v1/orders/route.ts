import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/trading/order-service";

const orderSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().int().positive(),
  limitPrice: z.number().positive().optional(),
  idempotencyKey: z.string().min(1),
});

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

    const orders = await prisma.order.findMany({
      where: {
        accountId: account.id,
      },
      include: {
        instrument: true,
        executions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        symbol: order.instrument.symbol,
        instrumentName: order.instrument.name,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        limitPrice: order.limitPrice?.toString() ?? null,
        estimatedValue: order.estimatedValue.toString(),
        simulatedFee: order.simulatedFee.toString(),
        simulatedSlippage: order.simulatedSlippage.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        executions: order.executions.map((execution) => ({
          id: execution.id,
          executedQuantity: execution.executedQuantity,
          executedPrice: execution.executedPrice.toString(),
          simulatedFee: execution.simulatedFee.toString(),
          executedAt: execution.executedAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/v1/orders error:", error);

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
        error: "Failed to load orders",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const validation = orderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order data",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

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

    const result = await createOrder(prisma, {
      accountId: account.id,
      symbol: validation.data.symbol,
      side: validation.data.side,
      type: validation.data.type,
      quantity: validation.data.quantity,
      limitPrice: validation.data.limitPrice,
      idempotencyKey: validation.data.idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        symbol: validation.data.symbol,
        side: result.order.side,
        type: result.order.type,
        quantity: result.order.quantity,
        status: result.order.status,
        estimatedValue: result.order.estimatedValue.toString(),
        simulatedFee: result.order.simulatedFee.toString(),
        simulatedSlippage:
          result.order.simulatedSlippage.toString(),
        createdAt: result.order.createdAt.toISOString(),
      },
      execution: result.execution
        ? {
            id: result.execution.id,
            executedQuantity:
              result.execution.executedQuantity,
            executedPrice:
              result.execution.executedPrice.toString(),
            simulatedFee:
              result.execution.simulatedFee.toString(),
            executedAt:
              result.execution.executedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/v1/orders error:", error);

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
          error instanceof Error
            ? error.message
            : "Failed to place order",
      },
      { status: 400 }
    );
  }
}
