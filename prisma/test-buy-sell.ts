import "dotenv/config";

import {
  Prisma,
  PrismaClient,
  OrderSide,
  OrderType,
} from "@prisma/client";

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
  // --------------------------------------------------
  // SETUP
  // --------------------------------------------------

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

  const startingBalance = account.cashBalance;

  // Make sure no RELIANCE position is left from a previous test.
  await prisma.position.deleteMany({
    where: {
      accountId: account.id,
      instrumentId: instrument.id,
    },
  });

  console.log("Starting cash:", startingBalance.toString());

  // --------------------------------------------------
  // TEST 1: BUY 10
  // --------------------------------------------------

  console.log("\nTEST 1: BUY 10 RELIANCE");

  const buy = await createOrder(prisma, {
    accountId: account.id,
    symbol: "RELIANCE",
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: 10,
    idempotencyKey: `buy-sell-test-buy-${Date.now()}`,
  });

  if (!buy.execution) {
    throw new Error("BUY execution was not created");
  }

  console.log("BUY status:", buy.order.status);

  console.log(
    "BUY execution price:",
    buy.execution.executedPrice.toString()
  );

  let position = await prisma.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: account.id,
        instrumentId: instrument.id,
      },
    },
  });

  if (!position) {
    throw new Error("BUY did not create a position");
  }

  console.log("Position quantity:", position.quantity);

  console.log(
    "Average entry:",
    position.averageEntryPrice.toString()
  );

  if (position.quantity !== 10) {
    throw new Error("Expected position quantity to be 10");
  }

  // --------------------------------------------------
  // TEST 2: SELL 5
  // --------------------------------------------------

  console.log("\nTEST 2: SELL 5 RELIANCE");

  const sell1 = await createOrder(prisma, {
    accountId: account.id,
    symbol: "RELIANCE",
    side: OrderSide.SELL,
    type: OrderType.MARKET,
    quantity: 5,
    idempotencyKey: `buy-sell-test-sell1-${Date.now()}`,
  });

  if (!sell1.execution) {
    throw new Error("First SELL execution was not created");
  }

  console.log("SELL status:", sell1.order.status);

  console.log(
    "SELL execution price:",
    sell1.execution.executedPrice.toString()
  );

  position = await prisma.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: account.id,
        instrumentId: instrument.id,
      },
    },
  });

  if (!position) {
    throw new Error("Position disappeared after partial SELL");
  }

  console.log("Position quantity:", position.quantity);

  console.log(
    "Realized P&L:",
    position.realizedPnL.toString()
  );

  if (position.quantity !== 5) {
    throw new Error("Expected position quantity to be 5");
  }

  // --------------------------------------------------
  // TEST 3: SELL REMAINING 5
  // --------------------------------------------------

  console.log("\nTEST 3: SELL remaining 5 RELIANCE");

  const sell2 = await createOrder(prisma, {
    accountId: account.id,
    symbol: "RELIANCE",
    side: OrderSide.SELL,
    type: OrderType.MARKET,
    quantity: 5,
    idempotencyKey: `buy-sell-test-sell2-${Date.now()}`,
  });

  if (!sell2.execution) {
    throw new Error("Second SELL execution was not created");
  }

  console.log("SELL status:", sell2.order.status);

  console.log(
    "SELL execution price:",
    sell2.execution.executedPrice.toString()
  );

  position = await prisma.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: account.id,
        instrumentId: instrument.id,
      },
    },
  });

  console.log(
    "Position after closing:",
    position
      ? {
          quantity: position.quantity,
          realizedPnL: position.realizedPnL.toString(),
        }
      : "NONE"
  );

  if (position) {
    throw new Error("Position should be completely closed");
  }

  console.log("\nBUY → SELL TEST PASSED.");

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  console.log("\nCleaning up test data...");

  const testOrders = await prisma.order.findMany({
    where: {
      accountId: account.id,
      idempotencyKey: {
        startsWith: "buy-sell-test-",
      },
    },
  });

  console.log("Test orders found:", testOrders.length);

  const testOrderIds = testOrders.map(
    (order) => order.id
  );

  const testExecutions = await prisma.execution.findMany({
    where: {
      orderId: {
        in: testOrderIds,
      },
    },
  });

  const testExecutionIds = testExecutions.map(
    (execution) => execution.id
  );

  const testTransactions = await prisma.transaction.findMany({
    where: {
      executionId: {
        in: testExecutionIds,
      },
    },
    select: {
      amount: true,
    },
  });

  let restoreAmount = new Prisma.Decimal(0);

  for (const transaction of testTransactions) {
    restoreAmount = restoreAmount.minus(
      transaction.amount
    );
  }

  // Everything is removed atomically.
  await prisma.$transaction(
    async (tx) => {
      // Delete ledger transactions.
      await tx.transaction.deleteMany({
        where: {
          executionId: {
            in: testExecutionIds,
          },
        },
      });

      // Delete executions.
      await tx.execution.deleteMany({
        where: {
          id: {
            in: testExecutionIds,
          },
        },
      });

      // Delete orders.
      await tx.order.deleteMany({
        where: {
          id: {
            in: testOrderIds,
          },
        },
      });

      // Restore cash.
      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          cashBalance: {
            increment: restoreAmount,
          },
        },
      });
    },
    {
      timeout: 15000,
    }
  );

  // --------------------------------------------------
  // VERIFY CLEANUP
  // --------------------------------------------------

  const finalAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  const remainingOrders = await prisma.order.count({
    where: {
      accountId: account.id,
      idempotencyKey: {
        startsWith: "buy-sell-test-",
      },
    },
  });

  const remainingPosition = await prisma.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: account.id,
        instrumentId: instrument.id,
      },
    },
  });

  console.log(
    "Restored amount:",
    restoreAmount.toString()
  );

  console.log(
    "Final cash:",
    finalAccount?.cashBalance.toString()
  );

  console.log(
    "Remaining test orders:",
    remainingOrders
  );

  console.log(
    "Remaining RELIANCE position:",
    remainingPosition ? "YES" : "NONE"
  );

  // --------------------------------------------------
  // FINAL CHECK
  // --------------------------------------------------

  if (!finalAccount) {
    throw new Error("Could not verify final account");
  }

  if (
    !new Prisma.Decimal(finalAccount.cashBalance).equals(
      startingBalance
    )
  ) {
    throw new Error(
      `Cash was not restored. Expected ${startingBalance.toString()}, got ${finalAccount.cashBalance.toString()}`
    );
  }

  if (remainingOrders !== 0) {
    throw new Error(
      "Some test orders were not cleaned up"
    );
  }

  if (remainingPosition) {
    throw new Error(
      "RELIANCE test position still exists"
    );
  }

  console.log("\n=================================");
  console.log("BUY → SELL TEST COMPLETED");
  console.log("Database cleanup verified");
  console.log("Starting cash:", startingBalance.toString());
  console.log(
    "Final cash:",
    finalAccount.cashBalance.toString()
  );
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("\nTEST FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });