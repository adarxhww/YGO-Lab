import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  OrderSide,
  OrderType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

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

const ACCOUNT_ID =
  "61f97d71-702b-4fda-b45b-db8404b5050a";

async function main() {
  console.log("Starting Journal API test setup...");

  const idempotencyKey =
    `journal-test-${Date.now()}`;

  const result = await createOrder(prisma, {
    accountId: ACCOUNT_ID,
    symbol: "TCS",
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: 1,
    idempotencyKey,
  });

  console.log("Test order created.");

  console.log({
    orderId: result.order.id,
    executionId: result.execution?.id,
    status: result.order.status,
  });

  const trade = await prisma.trade.findFirst({
    where: {
      accountId: ACCOUNT_ID,
      instrument: {
        symbol: "TCS",
      },
      closedAt: null,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (!trade) {
    throw new Error("Test trade was not created");
  }

  console.log("Test trade created:");

  console.log({
    tradeId: trade.id,
    instrumentId: trade.instrumentId,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice.toString(),
  });

  console.log("");
  console.log("========================================");
  console.log("Use this Trade ID for the Journal POST:");
  console.log(trade.id);
  console.log("========================================");

  return {
    tradeId: trade.id,
    orderId: result.order.id,
    executionId: result.execution?.id ?? null,
  };
}

main()
  .catch((error) => {
    console.error("JOURNAL TEST SETUP FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
