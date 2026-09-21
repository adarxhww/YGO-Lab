import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, OrderSide, OrderType } from "@prisma/client";

import { createOrder } from "../lib/trading/order-service";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const ACCOUNT_ID = "61f97d71-702b-4fda-b45b-db8404b5050a";

async function main() {
  const result = await createOrder(prisma, {
    accountId: ACCOUNT_ID,
    symbol: "INFY",
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: 10,
    idempotencyKey: `journal-demo-${Date.now()}`,
  });

  console.log("Demo order created successfully.");
  console.log("");

  console.log("Order:");
  console.log({
    id: result.order.id,
    status: result.order.status,
    side: result.order.side,
    quantity: result.order.quantity,
    estimatedValue: result.order.estimatedValue.toString(),
    simulatedFee: result.order.simulatedFee.toString(),
    simulatedSlippage: result.order.simulatedSlippage.toString(),
  });

  console.log("");
  console.log("Execution:");

  if (result.execution) {
    console.log({
      id: result.execution.id,
      executedQuantity: result.execution.executedQuantity,
      executedPrice: result.execution.executedPrice.toString(),
      simulatedFee: result.execution.simulatedFee.toString(),
    });
  }

  const trade = await prisma.trade.findFirst({
    where: {
      accountId: ACCOUNT_ID,
      instrument: {
        symbol: "INFY",
      },
    },
    orderBy: {
      openedAt: "desc",
    },
    include: {
      instrument: true,
    },
  });

  console.log("");
  console.log("Trade:");

  if (trade) {
    console.log({
      id: trade.id,
      symbol: trade.instrument.symbol,
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice.toString(),
      realizedPnL: trade.realizedPnL.toString(),
      openedAt: trade.openedAt,
      closedAt: trade.closedAt,
    });
  } else {
    console.log("No trade found.");
  }
}

main()
  .catch((error) => {
    console.error("Failed to create demo trade:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
