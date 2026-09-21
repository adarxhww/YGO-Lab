import {
  Prisma,
  PrismaClient,
  TransactionType,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function recordTransaction(
  db: DbClient,
  data: {
    accountId: string;
    type: TransactionType;
    amount: Prisma.Decimal | number | string;
    description: string;
    executionId?: string;
  }
) {
  const account = await db.account.findUnique({
    where: {
      id: data.accountId,
    },
  });

  if (!account) {
    throw new Error("Trading account not found");
  }

  const currentBalance = new Prisma.Decimal(account.cashBalance);
  const amount = new Prisma.Decimal(data.amount);

  const newBalance = currentBalance.plus(amount);

  if (newBalance.isNegative()) {
    throw new Error("Insufficient simulated cash");
  }

  const transaction = await db.transaction.create({
    data: {
      accountId: data.accountId,
      executionId: data.executionId,
      type: data.type,
      amount,
      balanceAfter: newBalance,
      description: data.description,
    },
  });

  await db.account.update({
    where: {
      id: data.accountId,
    },
    data: {
      cashBalance: newBalance,
    },
  });

  return transaction;
}