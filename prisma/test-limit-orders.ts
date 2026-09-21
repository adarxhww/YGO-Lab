import "dotenv/config";

import {
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
  const account = await prisma.account.findFirst();

  if (!account) {
    throw new Error("Trading account not found");
  }

  const startingCash = account.cashBalance;

  console.log("Starting cash:", startingCash.toString());

  // --------------------------------------------------
  // TEST 1: BUY LIMIT SHOULD EXECUTE
  // Market price = ₹1400
  // Limit price = ₹1450
  // --------------------------------------------------

  console.log("\nTEST 1: BUY LIMIT ₹1450");

  const buyLimit = await createOrder(prisma, {
    accountId: account.id,
    symbol: "RELIANCE",
    side: OrderSide.BUY,
    type: OrderType.LIMIT,
    quantity: 1,
    limitPrice: 1450,
    idempotencyKey: `limit-test-buy-valid-${Date.now()}`,
  });

  if (buyLimit.order.status !== "FILLED") {
    throw new Error("Valid BUY LIMIT should be FILLED");
  }

  console.log("Result:", buyLimit.order.status);
  console.log("BUY LIMIT TEST PASSED.");

  // --------------------------------------------------
  // CLEANUP BUY
  // --------------------------------------------------

  const buyExecutionId = buyLimit.execution?.id;

  if (!buyExecutionId) {
    throw new Error("BUY execution missing");
  }

  const buyTransaction = await prisma.transaction.findFirst({
    where: {
      executionId: buyExecutionId,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        executionId: buyExecutionId,
      },
    });

    await tx.execution.delete({
      where: {
        id: buyExecutionId,
      },
    });

    await tx.order.delete({
      where: {
        id: buyLimit.order.id,
      },
    });

    await tx.position.deleteMany({
      where: {
        accountId: account.id,
      },
    });

    if (buyTransaction) {
      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          cashBalance: {
            increment: buyTransaction.amount.negated(),
          },
        },
      });
    }
  });

  // --------------------------------------------------
  // TEST 2: BUY LIMIT SHOULD REJECT
  // Market price = ₹1400
  // Limit price = ₹1350
  // --------------------------------------------------

  console.log("\nTEST 2: BUY LIMIT ₹1350");

  try {
    await createOrder(prisma, {
      accountId: account.id,
      symbol: "RELIANCE",
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      quantity: 1,
      limitPrice: 1350,
      idempotencyKey: `limit-test-buy-invalid-${Date.now()}`,
    });

    throw new Error(
      "Invalid BUY LIMIT should have been rejected"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("LIMIT order condition not met")
    ) {
      console.log("Expected rejection:", error.message);
      console.log("BUY LIMIT rejection TEST PASSED.");
    } else {
      throw error;
    }
  }

  // --------------------------------------------------
  // TEST 3: SELL LIMIT SHOULD REJECT
  // No position is required because validation happens
  // before execution.
  //
  // Market price = ₹1400
  // Limit price = ₹1450
  // --------------------------------------------------

  console.log("\nTEST 3: SELL LIMIT ₹1450");

  try {
    await createOrder(prisma, {
      accountId: account.id,
      symbol: "RELIANCE",
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      quantity: 1,
      limitPrice: 1450,
      idempotencyKey: `limit-test-sell-invalid-${Date.now()}`,
    });

    throw new Error(
      "Invalid SELL LIMIT should have been rejected"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("LIMIT order condition not met")
    ) {
      console.log("Expected rejection:", error.message);
      console.log("SELL LIMIT rejection TEST PASSED.");
    } else {
      throw error;
    }
  }

  // --------------------------------------------------
  // TEST 4: SELL LIMIT CONDITION
  // Market price = ₹1400
  // Limit price = ₹1350
  //
  // The LIMIT condition should pass, but the order should
  // then fail because we don't own RELIANCE.
  // This proves the LIMIT condition itself is working.
  // --------------------------------------------------

  console.log("\nTEST 4: SELL LIMIT ₹1350");

  try {
    await createOrder(prisma, {
      accountId: account.id,
      symbol: "RELIANCE",
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      quantity: 1,
      limitPrice: 1350,
      idempotencyKey: `limit-test-sell-valid-condition-${Date.now()}`,
    });

    throw new Error(
      "SELL should fail because no position exists"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Cannot sell an instrument that is not owned"
      )
    ) {
      console.log("Expected position rejection:", error.message);
      console.log("SELL LIMIT condition TEST PASSED.");
    } else {
      throw error;
    }
  }

  // --------------------------------------------------
  // FINAL CHECK
  // --------------------------------------------------

  const finalAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  console.log(
    "\nFinal cash:",
    finalAccount?.cashBalance.toString()
  );

  if (
    !finalAccount ||
    !finalAccount.cashBalance.equals(startingCash)
  ) {
    throw new Error("Cash balance was not restored");
  }

  console.log("\n=================================");
  console.log("LIMIT ORDER TESTS PASSED");
  console.log("Cash restored successfully");
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("\nLIMIT TEST FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });