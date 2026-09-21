import "dotenv/config";

import { PrismaClient } from "@prisma/client";
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

const ACCOUNT_ID =
  "61f97d71-702b-4fda-b45b-db8404b5050a";

async function main() {
  console.log("Starting Trade service test...\n");

  const beforeAccount = await prisma.account.findUnique({
    where: {
      id: ACCOUNT_ID,
    },
  });

  if (!beforeAccount) {
    throw new Error("Test account not found");
  }

  const instrument = await prisma.instrument.findUnique({
    where: {
      symbol: "RELIANCE",
    },
  });

  if (!instrument) {
    throw new Error("RELIANCE instrument not found");
  }

  console.log("Initial cash:");
  console.log(beforeAccount.cashBalance.toString());

  // --------------------------------------------------
  // BUY
  // --------------------------------------------------

  console.log("\n1. Creating BUY order...");

  const buyResult = await createOrder(prisma, {
    accountId: ACCOUNT_ID,
    symbol: "RELIANCE",
    side: "BUY",
    type: "MARKET",
    quantity: 2,
    idempotencyKey: `trade-test-buy-${Date.now()}`,
  });

  console.log("BUY execution price:");
  console.log(
    buyResult.execution?.executedPrice.toString()
  );

  const tradeAfterBuy = await prisma.trade.findFirst({
    where: {
      accountId: ACCOUNT_ID,
      instrumentId: instrument.id,
      closedAt: null,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (!tradeAfterBuy) {
    throw new Error(
      "Trade was not created after BUY"
    );
  }

  console.log("\nTrade after BUY:");
  console.log({
    id: tradeAfterBuy.id,
    quantity: tradeAfterBuy.quantity,
    entryPrice:
      tradeAfterBuy.entryPrice.toString(),
    realizedPnL:
      tradeAfterBuy.realizedPnL.toString(),
    closedAt: tradeAfterBuy.closedAt,
  });

  // --------------------------------------------------
  // SELL 1
  // --------------------------------------------------

  console.log("\n2. Creating partial SELL order...");

  const sellResult = await createOrder(prisma, {
    accountId: ACCOUNT_ID,
    symbol: "RELIANCE",
    side: "SELL",
    type: "MARKET",
    quantity: 1,
    idempotencyKey: `trade-test-sell-1-${Date.now()}`,
  });

  console.log("SELL execution price:");
  console.log(
    sellResult.execution?.executedPrice.toString()
  );

  const tradeAfterPartialSell =
    await prisma.trade.findUnique({
      where: {
        id: tradeAfterBuy.id,
      },
    });

  if (!tradeAfterPartialSell) {
    throw new Error(
      "Trade disappeared after partial SELL"
    );
  }

  console.log("\nTrade after partial SELL:");
  console.log({
    id: tradeAfterPartialSell.id,
    quantity:
      tradeAfterPartialSell.quantity,
    entryPrice:
      tradeAfterPartialSell.entryPrice.toString(),
    exitPrice:
      tradeAfterPartialSell.exitPrice?.toString() ??
      null,
    realizedPnL:
      tradeAfterPartialSell.realizedPnL.toString(),
    closedAt:
      tradeAfterPartialSell.closedAt,
  });

  // --------------------------------------------------
  // SELL remaining quantity
  // --------------------------------------------------

  console.log("\n3. Creating final SELL order...");

  const finalSellResult = await createOrder(
    prisma,
    {
      accountId: ACCOUNT_ID,
      symbol: "RELIANCE",
      side: "SELL",
      type: "MARKET",
      quantity: 1,
      idempotencyKey: `trade-test-sell-2-${Date.now()}`,
    }
  );

  console.log("Final SELL execution price:");
  console.log(
    finalSellResult.execution?.executedPrice.toString()
  );

  const closedTrade = await prisma.trade.findUnique({
    where: {
      id: tradeAfterBuy.id,
    },
  });

  if (!closedTrade) {
    throw new Error(
      "Closed Trade could not be found"
    );
  }

  console.log("\nFinal Trade:");
  console.log({
    id: closedTrade.id,
    quantity: closedTrade.quantity,
    entryPrice:
      closedTrade.entryPrice.toString(),
    exitPrice:
      closedTrade.exitPrice?.toString() ?? null,
    realizedPnL:
      closedTrade.realizedPnL.toString(),
    openedAt:
      closedTrade.openedAt,
    closedAt:
      closedTrade.closedAt,
  });

  // --------------------------------------------------
  // Verify Position
  // --------------------------------------------------

  const position =
    await prisma.position.findUnique({
      where: {
        accountId_instrumentId: {
          accountId: ACCOUNT_ID,
          instrumentId: instrument.id,
        },
      },
    });

  console.log("\nPosition after final SELL:");

  if (!position) {
    console.log(
      "No open position — position was completely closed."
    );
  } else {
    console.log({
      quantity: position.quantity,
      averageEntryPrice:
        position.averageEntryPrice.toString(),
    });
  }

  // --------------------------------------------------
  // Assertions
  // --------------------------------------------------

  if (tradeAfterBuy.quantity !== 2) {
    throw new Error(
      "BUY test failed: Trade quantity should be 2"
    );
  }

  if (
    tradeAfterPartialSell.quantity !== 1
  ) {
    throw new Error(
      "Partial SELL test failed: Trade quantity should be 1"
    );
  }

  if (closedTrade.quantity !== 0) {
    throw new Error(
      "Final SELL test failed: Trade quantity should be 0"
    );
  }

  if (!closedTrade.closedAt) {
    throw new Error(
      "Final SELL test failed: Trade should be closed"
    );
  }

  if (!closedTrade.exitPrice) {
    throw new Error(
      "Final SELL test failed: exit price is missing"
    );
  }

  console.log(
    "\n========================================"
  );
  console.log(
    "TRADE SERVICE TEST PASSED"
  );
  console.log(
    "========================================"
  );
}

main()
  .catch((error) => {
    console.error(
      "\nTRADE SERVICE TEST FAILED"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
