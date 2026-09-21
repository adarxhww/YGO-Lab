import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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

const TEST_TRADE_ID =
  "973201f9-a18c-49a6-8e4c-15dfae8b8154";

const TEST_ORDER_ID =
  "fb41555d-0957-47a6-a4b1-1c460357eb79";

async function main() {
  console.log("Starting safe Journal test cleanup...");

  const journalEntry =
    await prisma.journalEntry.findUnique({
      where: {
        tradeId: TEST_TRADE_ID,
      },
    });

  if (journalEntry) {
    await prisma.journalEntry.delete({
      where: {
        id: journalEntry.id,
      },
    });

    console.log("Deleted test journal entry.");
  } else {
    console.log("Test journal entry not found.");
  }

  const executions =
    await prisma.execution.findMany({
      where: {
        orderId: TEST_ORDER_ID,
      },
      select: {
        id: true,
      },
    });

  const executionIds = executions.map(
    (execution) => execution.id
  );

  if (executionIds.length > 0) {
    await prisma.transaction.deleteMany({
      where: {
        executionId: {
          in: executionIds,
        },
      },
    });

    console.log("Deleted test transactions.");

    await prisma.execution.deleteMany({
      where: {
        id: {
          in: executionIds,
        },
      },
    });

    console.log("Deleted test executions.");
  } else {
    console.log("Test executions not found.");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: TEST_ORDER_ID,
    },
  });

  if (order) {
    await prisma.order.delete({
      where: {
        id: TEST_ORDER_ID,
      },
    });

    console.log("Deleted test order.");
  } else {
    console.log("Test order not found.");
  }

  const trade = await prisma.trade.findUnique({
    where: {
      id: TEST_TRADE_ID,
    },
  });

  if (trade) {
    await prisma.trade.delete({
      where: {
        id: TEST_TRADE_ID,
      },
    });

    console.log("Deleted test trade.");
  } else {
    console.log("Test trade not found.");
  }

  console.log("");
  console.log("========================================");
  console.log("JOURNAL TEST CLEANUP COMPLETE");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("CLEANUP FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
