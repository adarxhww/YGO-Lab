import {
  OrderSide,
  Prisma,
  PrismaClient,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type UpdateTradeInput = {
  accountId: string;
  instrumentId: string;
  side: OrderSide;
  quantity: number;
  executionPrice: Prisma.Decimal | number | string;
};

export async function updateTrade(
  db: DbClient,
  input: UpdateTradeInput
) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be a positive whole number");
  }

  const executionPrice = new Prisma.Decimal(
    input.executionPrice
  );

  /*
   * We keep one open Trade for an account + instrument.
   *
   * BUY:
   * - Create a new Trade if none is open.
   * - Otherwise increase quantity and recalculate
   *   the weighted average entry price.
   *
   * SELL:
   * - Reduce the open Trade quantity.
   * - Calculate realized P&L.
   * - Close the Trade when quantity reaches zero.
   */

  const openTrade = await db.trade.findFirst({
    where: {
      accountId: input.accountId,
      instrumentId: input.instrumentId,
      closedAt: null,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  // --------------------------------------------------
  // BUY
  // --------------------------------------------------

  if (input.side === OrderSide.BUY) {
    if (!openTrade) {
      return db.trade.create({
        data: {
          accountId: input.accountId,
          instrumentId: input.instrumentId,
          side: OrderSide.BUY,
          quantity: input.quantity,
          entryPrice: executionPrice,
          realizedPnL: new Prisma.Decimal(0),
        },
      });
    }

    const oldQuantity = openTrade.quantity;

    const newQuantity =
      oldQuantity + input.quantity;

    const oldValue =
      openTrade.entryPrice.mul(oldQuantity);

    const newValue =
      executionPrice.mul(input.quantity);

    const newAverageEntryPrice =
      oldValue
        .plus(newValue)
        .div(newQuantity);

    return db.trade.update({
      where: {
        id: openTrade.id,
      },
      data: {
        quantity: newQuantity,
        entryPrice: newAverageEntryPrice,
      },
    });
  }

  // --------------------------------------------------
  // SELL
  // --------------------------------------------------

  if (!openTrade) {
    throw new Error(
      "Cannot sell because there is no open trade"
    );
  }

  if (input.quantity > openTrade.quantity) {
    throw new Error(
      "Cannot sell more quantity than the open trade"
    );
  }

  const realizedPnL = executionPrice
    .minus(openTrade.entryPrice)
    .mul(input.quantity);

  const newQuantity =
    openTrade.quantity - input.quantity;

  const newRealizedPnL =
    openTrade.realizedPnL.plus(realizedPnL);

  // --------------------------------------------------
  // Trade completely closed
  // --------------------------------------------------

  if (newQuantity === 0) {
    return db.trade.update({
      where: {
        id: openTrade.id,
      },
      data: {
        quantity: 0,
        exitPrice: executionPrice,
        realizedPnL: newRealizedPnL,
        closedAt: new Date(),
      },
    });
  }

  // --------------------------------------------------
  // Trade partially closed
  // --------------------------------------------------

  return db.trade.update({
    where: {
      id: openTrade.id,
    },
    data: {
      quantity: newQuantity,
      realizedPnL: newRealizedPnL,
    },
  });
}
