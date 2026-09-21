import {
  Prisma,
  PrismaClient,
  OrderSide,
  OrderType,
} from "@prisma/client";

import { calculateExecutionCost } from "./slippage";
import { recordTransaction } from "./ledger";
import { updatePosition } from "./position-service";
import { updateTrade } from "./trade-service";
import { updateChallengeProgress } from "@/lib/challenges/progress-service";

type CreateOrderInput = {
  accountId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: string | number;
  idempotencyKey: string;
};

export async function createOrder(
  prisma: PrismaClient,
  input: CreateOrderInput
) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be a positive whole number");
  }

  const existingOrder = await prisma.order.findUnique({
    where: {
      idempotencyKey: input.idempotencyKey,
    },
    include: {
      executions: true,
    },
  });

  if (existingOrder) {
    return {
      order: existingOrder,
      execution: existingOrder.executions[0] ?? null,
    };
  }

  const account = await prisma.account.findUnique({
    where: {
      id: input.accountId,
    },
  });

  if (!account) {
    throw new Error("Trading account not found");
  }

  const instrument = await prisma.instrument.findUnique({
    where: {
      symbol: input.symbol,
    },
  });

  if (!instrument || !instrument.isActive) {
    throw new Error("Instrument not found or inactive");
  }

  const marketPrice = await prisma.marketPrice.findFirst({
    where: {
      instrumentId: instrument.id,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (!marketPrice) {
    throw new Error("Market price not available");
  }

  if (
    input.type === OrderType.LIMIT &&
    input.limitPrice === undefined
  ) {
    throw new Error("Limit price is required for a LIMIT order");
  }

  if (input.type === OrderType.LIMIT) {
    const limitPrice = new Prisma.Decimal(input.limitPrice!);

    if (limitPrice.lte(0)) {
      throw new Error("Limit price must be greater than zero");
    }

    const isBuyLimitValid =
      input.side === OrderSide.BUY &&
      marketPrice.lastPrice.lte(limitPrice);

    const isSellLimitValid =
      input.side === OrderSide.SELL &&
      marketPrice.lastPrice.gte(limitPrice);

    if (!isBuyLimitValid && !isSellLimitValid) {
      throw new Error(
        `LIMIT order condition not met. Market price: ${marketPrice.lastPrice.toString()}, Limit price: ${limitPrice.toString()}`
      );
    }
  }

  const executionCost = calculateExecutionCost({
    marketPrice: marketPrice.lastPrice,
    side: input.side,
    quantity: input.quantity,
  });

  return prisma.$transaction(
    async (tx) => {
      const duplicateOrder = await tx.order.findUnique({
        where: {
          idempotencyKey: input.idempotencyKey,
        },
        include: {
          executions: true,
        },
      });

      if (duplicateOrder) {
        return {
          order: duplicateOrder,
          execution:
            duplicateOrder.executions[0] ?? null,
        };
      }

      const order = await tx.order.create({
        data: {
          accountId: account.id,
          instrumentId: instrument.id,
          idempotencyKey: input.idempotencyKey,
          type: input.type,
          side: input.side,
          quantity: input.quantity,
          limitPrice:
            input.limitPrice !== undefined
              ? new Prisma.Decimal(input.limitPrice)
              : null,
          estimatedValue: executionCost.grossValue,
          simulatedFee: executionCost.fee,
          simulatedSlippage: executionCost.slippage,
          status: "FILLED",
        },
      });

      const execution = await tx.execution.create({
        data: {
          orderId: order.id,
          accountId: account.id,
          executedQuantity: input.quantity,
          executedPrice: executionCost.executionPrice,
          simulatedFee: executionCost.fee,
        },
      });

      const cashMovement =
        input.side === OrderSide.BUY
          ? executionCost.totalValue.negated()
          : executionCost.totalValue;

      await recordTransaction(tx, {
        accountId: account.id,
        executionId: execution.id,
        type:
          input.side === OrderSide.BUY
            ? "ORDER_BUY"
            : "ORDER_SELL",
        amount: cashMovement,
        description: `${input.side} ${input.quantity} ${instrument.symbol}`,
      });

      await updatePosition(tx, {
        accountId: account.id,
        instrumentId: instrument.id,
        side: input.side,
        quantity: input.quantity,
        executionPrice: executionCost.executionPrice,
      });

      await updateTrade(tx, {
        accountId: account.id,
        instrumentId: instrument.id,
        side: input.side,
        quantity: input.quantity,
        executionPrice: executionCost.executionPrice,
      });

      // Update challenge progress inside the same transaction.
      // The longer timeout gives the Neon database enough time
      // to complete the additional progress queries.
      await updateChallengeProgress(
        tx,
        account.userId
      );

      return {
        order,
        execution,
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    }
  );
}
