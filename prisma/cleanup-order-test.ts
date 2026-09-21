import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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
  const account = await prisma.account.findFirst();

  if (!account) {
    throw new Error("No trading account found");
  }

  const testOrders = await prisma.order.findMany({
    where: {
      accountId: account.id,
      idempotencyKey: {
        startsWith: "test-",
      },
    },
    include: {
      executions: {
        include: {
          transactions: true,
        },
      },
      instrument: true,
    },
  });

  if (testOrders.length === 0) {
    console.log("No test orders found.");
    return;
  }

  let restoreAmount = 0;

  for (const order of testOrders) {
    for (const execution of order.executions) {
      for (const transaction of execution.transactions) {
        restoreAmount -= Number(transaction.amount);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.position.deleteMany({
      where: {
        accountId: account.id,
        instrument: {
          symbol: "RELIANCE",
        },
      },
    });

    for (const order of testOrders) {
      for (const execution of order.executions) {
        await tx.transaction.deleteMany({
          where: {
            executionId: execution.id,
          },
        });

        await tx.execution.delete({
          where: {
            id: execution.id,
          },
        });
      }

      await tx.order.delete({
        where: {
          id: order.id,
        },
      });
    }

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
  });

  const updatedAccount = await prisma.account.findUnique({
    where: {
      id: account.id,
    },
  });

  console.log("Test data cleaned successfully.");
  console.log(
    "Restored cash:",
    updatedAccount?.cashBalance.toString()
  );
}

main()
  .catch((error) => {
    console.error("CLEANUP FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });