import { Prisma } from "@prisma/client";

type SlippageInput = {
  marketPrice: Prisma.Decimal | number | string;
  side: "BUY" | "SELL";
  quantity: number;
};

type ExecutionCost = {
  executionPrice: Prisma.Decimal;
  slippage: Prisma.Decimal;
  grossValue: Prisma.Decimal;
  fee: Prisma.Decimal;
  totalValue: Prisma.Decimal;
};

const SLIPPAGE_RATE = new Prisma.Decimal("0.0005");
const FEE_RATE = new Prisma.Decimal("0.001");

export function calculateExecutionCost(
  input: SlippageInput
): ExecutionCost {
  const marketPrice = new Prisma.Decimal(input.marketPrice);

  if (input.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const slippage = marketPrice
    .mul(SLIPPAGE_RATE)
    .mul(input.side === "BUY" ? 1 : -1);

  const executionPrice = marketPrice.plus(slippage);

  const grossValue = executionPrice.mul(input.quantity);

  const fee = grossValue.mul(FEE_RATE);

  const totalValue =
    input.side === "BUY"
      ? grossValue.plus(fee)
      : grossValue.minus(fee);

  return {
    executionPrice,
    slippage,
    grossValue,
    fee,
    totalValue,
  };
}