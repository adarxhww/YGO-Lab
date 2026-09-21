import { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type RiskScoreInput = {
  accountId: string;
};

type RiskScoreResult = {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  factors: {
    concentration: number;
    leverage: number;
    cashBuffer: number;
    positionCount: number;
  };
  summary: string;
};

export async function calculateRiskScore(
  db: DbClient,
  input: RiskScoreInput
): Promise<RiskScoreResult> {
  const account = await db.account.findUnique({
    where: {
      id: input.accountId,
    },
    include: {
      positions: true,
    },
  });

  if (!account) {
    throw new Error("Trading account not found");
  }

  const positions = account.positions;

  let holdingsValue = new Prisma.Decimal(0);

  for (const position of positions) {
    const marketPrice = await db.marketPrice.findFirst({
      where: {
        instrumentId: position.instrumentId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    const currentPrice =
      marketPrice?.lastPrice ??
      position.averageEntryPrice;

    holdingsValue = holdingsValue.plus(
      currentPrice.mul(position.quantity)
    );
  }

  const portfolioValue =
    account.cashBalance.plus(holdingsValue);

  if (portfolioValue.lte(0)) {
    return {
      score: 100,
      level: "VERY_HIGH",
      factors: {
        concentration: 100,
        leverage: 100,
        cashBuffer: 100,
        positionCount: 100,
      },
      summary: "Portfolio value is too low to calculate a healthy risk profile.",
    };
  }

  /*
   * 1. Concentration Risk
   *
   * Measures how much of the portfolio is concentrated
   * in the largest individual position.
   */
  let largestPositionValue = new Prisma.Decimal(0);

  for (const position of positions) {
    const marketPrice = await db.marketPrice.findFirst({
      where: {
        instrumentId: position.instrumentId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    const currentPrice =
      marketPrice?.lastPrice ??
      position.averageEntryPrice;

    const positionValue = currentPrice.mul(
      position.quantity
    );

    if (positionValue.gt(largestPositionValue)) {
      largestPositionValue = positionValue;
    }
  }

  const concentrationRatio = largestPositionValue
    .div(portfolioValue)
    .toNumber();

  const concentrationRisk = Math.min(
    100,
    concentrationRatio * 100
  );

  /*
   * 2. Leverage Risk
   *
   * This platform currently uses cash-only simulated trading,
   * so there is no borrowing/margin.
   *
   * Therefore leverage risk is currently zero.
   */
  const leverageRisk = 0;

  /*
   * 3. Cash Buffer Risk
   *
   * Less available cash means greater portfolio risk.
   */
  const cashRatio = account.cashBalance
    .div(portfolioValue)
    .toNumber();

  const cashBufferRisk = Math.max(
    0,
    Math.min(100, (1 - cashRatio) * 100)
  );

  /*
   * 4. Position Count Risk
   *
   * Having only one position creates more concentration risk.
   * Diversification improves this factor.
   */
  let positionCountRisk = 100;

  if (positions.length >= 5) {
    positionCountRisk = 0;
  } else if (positions.length === 4) {
    positionCountRisk = 20;
  } else if (positions.length === 3) {
    positionCountRisk = 40;
  } else if (positions.length === 2) {
    positionCountRisk = 65;
  } else if (positions.length === 1) {
    positionCountRisk = 85;
  }

  /*
   * Weighted overall score.
   */
  const rawScore =
    concentrationRisk * 0.4 +
    leverageRisk * 0.2 +
    cashBufferRisk * 0.25 +
    positionCountRisk * 0.15;

  const score = Math.round(
    Math.max(0, Math.min(100, rawScore))
  );

  let level: RiskScoreResult["level"];

  if (score <= 25) {
    level = "LOW";
  } else if (score <= 50) {
    level = "MODERATE";
  } else if (score <= 75) {
    level = "HIGH";
  } else {
    level = "VERY_HIGH";
  }

  let summary = "";

  if (level === "LOW") {
    summary =
      "Your portfolio currently has a relatively low risk profile.";
  } else if (level === "MODERATE") {
    summary =
      "Your portfolio has a moderate level of concentration or exposure.";
  } else if (level === "HIGH") {
    summary =
      "Your portfolio has significant concentration or exposure risk.";
  } else {
    summary =
      "Your portfolio has a very high risk profile and may be heavily concentrated.";
  }

  return {
    score,
    level,
    factors: {
      concentration: Math.round(concentrationRisk),
      leverage: Math.round(leverageRisk),
      cashBuffer: Math.round(cashBufferRisk),
      positionCount: Math.round(positionCountRisk),
    },
    summary,
  };
}
