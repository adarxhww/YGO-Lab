import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const instruments = await prisma.instrument.findMany({
      where: {
        isActive: true,
      },
      include: {
        prices: {
          orderBy: {
            timestamp: "desc",
          },
          take: 2,
        },
      },
      orderBy: {
        symbol: "asc",
      },
    });

    const markets = instruments.map((instrument) => {
      const latestPrice = instrument.prices[0];
      const previousPrice = instrument.prices[1];

      const currentPrice = latestPrice
        ? Number(latestPrice.lastPrice)
        : 0;

      const previousClose = previousPrice
        ? Number(previousPrice.lastPrice)
        : currentPrice;

      const change = currentPrice - previousClose;

      const changePercent =
        previousClose > 0
          ? (change / previousClose) * 100
          : 0;

      return {
        id: instrument.id,
        symbol: instrument.symbol,
        name: instrument.name,
        exchange: instrument.exchange,
        type: instrument.type,
        lotSize: instrument.lotSize,
        tickSize: instrument.tickSize.toString(),

        price: {
          current: currentPrice,
          previous: previousClose,
          change,
          changePercent,
          timestamp:
            latestPrice?.timestamp ?? null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      markets,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/markets failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market data",
      },
      {
        status: 500,
      }
    );
  }
}
