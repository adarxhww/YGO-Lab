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
  "72545447-c133-4316-b7ad-05a9a63c2180";

async function main() {
  console.log("Starting safe Trade test cleanup...");

  const trade = await prisma.trade.findUnique({
    where: {
      id: TEST_TRADE_ID,
    },
  });

  if (!trade) {
    console.log("Test trade not found.");
    return;
  }

  console.log("Found test trade:", {
    id: trade.id,
    accountId: trade.accountId,
    instrumentId: trade.instrumentId,
    realizedPnL: trade.realizedPnL.toString(),
  });

  const testOrders = await prisma.order.findMany({
    where: {
      idempotencyKey: {
        startsWith: "trade-test-",
      },
    },
    select: {
      id: true,
      idempotencyKey: true,
    },
  });

  console.log(`Found ${testOrders.length} test orders.`);

  const orderIds = testOrders.map((order) => order.id);

  if (orderIds.length > 0) {
    const executions = await prisma.execution.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
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
    }

    await prisma.execution.deleteMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    console.log("Deleted test executions.");

    await prisma.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });

    console.log("Deleted test orders.");
  }

  await prisma.trade.delete({
    where: {
      id: TEST_TRADE_ID,
    },
  });

  console.log("Deleted test trade.");

  console.log("========================================");
  console.log("TRADE TEST CLEANUP COMPLETE");
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
