import { Prisma, PrismaClient, OrderSide } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type UpdatePositionInput = {
  accountId: string;
  instrumentId: string;
  side: OrderSide;
  quantity: number;
  executionPrice: Prisma.Decimal | number | string;
};

export async function updatePosition(
  db: DbClient,
  input: UpdatePositionInput
) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be a positive whole number");
  }

  const executionPrice = new Prisma.Decimal(input.executionPrice);

  const existingPosition = await db.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: input.accountId,
        instrumentId: input.instrumentId,
      },
    },
  });

  // BUY
  if (input.side === OrderSide.BUY) {
    if (!existingPosition) {
      return db.position.create({
        data: {
          accountId: input.accountId,
          instrumentId: input.instrumentId,
          quantity: input.quantity,
          averageEntryPrice: executionPrice,
          unrealizedPnL: 0,
          realizedPnL: 0,
        },
      });
    }

    const oldQuantity = existingPosition.quantity;
    const newQuantity = oldQuantity + input.quantity;

    const oldValue =
      existingPosition.averageEntryPrice.mul(oldQuantity);

    const newValue = executionPrice.mul(input.quantity);

    const newAveragePrice = oldValue
      .plus(newValue)
      .div(newQuantity);

    return db.position.update({
      where: {
        id: existingPosition.id,
      },
      data: {
        quantity: newQuantity,
        averageEntryPrice: newAveragePrice,
      },
    });
  }

  // SELL
  if (!existingPosition) {
    throw new Error("Cannot sell an instrument that is not owned");
  }

  if (input.quantity > existingPosition.quantity) {
    throw new Error(
      "Cannot sell more quantity than currently owned"
    );
  }

  const realizedPnL = executionPrice
    .minus(existingPosition.averageEntryPrice)
    .mul(input.quantity);

  const newQuantity =
    existingPosition.quantity - input.quantity;

  // Position completely closed
  if (newQuantity === 0) {
    return db.position.delete({
      where: {
        id: existingPosition.id,
      },
    });
  }

  return db.position.update({
    where: {
      id: existingPosition.id,
    },
    data: {
      quantity: newQuantity,
      realizedPnL: existingPosition.realizedPnL.plus(realizedPnL),
    },
  });
}