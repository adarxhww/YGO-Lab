import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const instruments =
      await prisma.instrument.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          symbol: "asc",
        },
        select: {
          id: true,
          symbol: true,
          name: true,
          exchange: true,
          type: true,
          lotSize: true,
          tickSize: true,
          prices: {
            orderBy: {
              timestamp: "desc",
            },
            take: 1,
            select: {
              lastPrice: true,
              timestamp: true,
            },
          },
        },
      });

    const formattedInstruments =
      instruments.map((instrument) => {
        const latestPrice =
          instrument.prices[0];

        return {
          id: instrument.id,
          symbol: instrument.symbol,
          name: instrument.name,
          exchange: instrument.exchange,
          type: instrument.type,
          lotSize: instrument.lotSize,
          tickSize:
            instrument.tickSize.toString(),
          lastPrice: latestPrice
            ? latestPrice.lastPrice.toString()
            : "0",
          timestamp:
            latestPrice?.timestamp
              ? latestPrice.timestamp.toISOString()
              : null,
        };
      });

    return NextResponse.json({
      success: true,
      instruments:
        formattedInstruments,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/instruments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch instruments",
      },
      { status: 500 }
    );
  }
}
