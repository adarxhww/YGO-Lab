import "dotenv/config";

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

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
  const account = await prisma.account.findFirst({
    where: {
      isSimulated: true,
    },
  });

  if (!account) {
    throw new Error("Simulated account not found");
  }

  console.log("Current cash:", account.cashBalance.toString());

  const orders = await prisma.order.findMany({
    where: {
      idempotencyKey: {
        startsWith: "buy-sell-test-",
      },
    },
    include: {
      executions: true,
    },
  });

  console.log("Test orders found:", orders.length);

  const executionIds = orders.flatMap((order) =>
    order.executions.map((execution) => execution.id)
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      executionId: {
        in: executionIds,
      },
    },
    select: {
      amount: true,
    },
  });

  let restoreAmount = new Prisma.Decimal(0);

  for (const transaction of transactions) {
    restoreAmount = restoreAmount.minus(transaction.amount);
  }

  await prisma.$transaction(
    async (tx) => {
      // Remove any leftover RELIANCE test position.
      await tx.position.deleteMany({
        where: {
          accountId: account.id,
          instrument: {
            symbol: "RELIANCE",
          },
        },
      });

      // Delete test ledger transactions.
      await tx.transaction.deleteMany({
        where: {
          executionId: {
            in: executionIds,
          },
        },
      });

      // Delete test executions.
      await tx.execution.deleteMany({
        where: {
          id: {
            in: executionIds,
          },
        },
      });

      // Delete test orders.
      await tx.order.deleteMany({
        where: {
          idempotencyKey: {
            startsWith: "buy-sell-test-",
          },
        },
      });

      // Restore the cash that those test transactions removed/added.
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

  const finalAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  console.log("Restored amount:", restoreAmount.toString());
  console.log("Final cash:", finalAccount?.cashBalance.toString());

  if (
    finalAccount &&
    new Prisma.Decimal(finalAccount.cashBalance).equals(
      new Prisma.Decimal(100000)
    )
  ) {
    console.log("CLEANUP PASSED.");
  } else {
    console.log("WARNING: Final cash is not ₹100000.");
  }
}

main()
  .catch((error) => {
    console.error("CLEANUP FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });