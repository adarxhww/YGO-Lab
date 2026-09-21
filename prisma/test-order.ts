import "dotenv/config";
import { PrismaClient, OrderSide, OrderType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
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

async function main() {
  const account = await prisma.account.findFirst();

  if (!account) {
    throw new Error("No trading account found");
  }

  const instrument = await prisma.instrument.findUnique({
    where: {
      symbol: "RELIANCE",
    },
  });

  if (!instrument) {
    throw new Error("RELIANCE not found");
  }

  // Clean up only data created by this test.
  await prisma.position.deleteMany({
    where: {
      accountId: account.id,
      instrumentId: instrument.id,
    },
  });

  const startingBalance = Number(account.cashBalance);

  console.log("Starting cash:", startingBalance);

  console.log("\nCreating BUY order...");

  const result = await createOrder(prisma, {
    accountId: account.id,
    symbol: "RELIANCE",
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: 10,
    idempotencyKey: `test-${Date.now()}`,
  });

  if (!result.execution) {
  throw new Error("Execution was not found for the order");
}

console.log("Order status:", result.order.status);
console.log(
  "Execution price:",
  result.execution.executedPrice.toString()
);
console.log(
  "Execution fee:",
  result.execution.simulatedFee.toString()
);

  const updatedAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  const position = await prisma.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: account.id,
        instrumentId: instrument.id,
      },
    },
  });

  console.log("\nAfter BUY:");

  console.log(
    "Cash balance:",
    updatedAccount?.cashBalance.toString()
  );

  console.log("Position quantity:", position?.quantity);

  console.log(
    "Average entry:",
    position?.averageEntryPrice.toString()
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: account.id,
      executionId: result.execution.id,
    },
  });

  console.log("\nLedger transaction:");

  console.log(transactions);

  console.log("\nIntegration test completed.");
}

main()
  .catch((error) => {
    console.error("TEST FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });