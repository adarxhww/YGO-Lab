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

const prices = [
  {
    symbol: "RELIANCE",
    price: "1400",
  },
  {
    symbol: "TCS",
    price: "3200",
  },
  {
    symbol: "INFY",
    price: "1500",
  },
  {
    symbol: "HDFCBANK",
    price: "1800",
  },
];

async function main() {
  for (const item of prices) {
    const instrument = await prisma.instrument.findUnique({
      where: {
        symbol: item.symbol,
      },
    });

    if (!instrument) {
      throw new Error(`Instrument not found: ${item.symbol}`);
    }

    await prisma.marketPrice.create({
      data: {
        instrumentId: instrument.id,
        lastPrice: item.price,
        high: item.price,
        low: item.price,
        close: item.price,
        volume: BigInt(1000000),
      },
    });

    console.log(`${item.symbol}: ₹${item.price}`);
  }

  console.log("Simulated market prices seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });