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
  const instruments = [
    {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      exchange: "NSE",
      type: "EQUITY",
      lotSize: 1,
      tickSize: 0.05,
    },
    {
      symbol: "TCS",
      name: "Tata Consultancy Services",
      exchange: "NSE",
      type: "EQUITY",
      lotSize: 1,
      tickSize: 0.05,
    },
    {
      symbol: "INFY",
      name: "Infosys",
      exchange: "NSE",
      type: "EQUITY",
      lotSize: 1,
      tickSize: 0.05,
    },
    {
      symbol: "HDFCBANK",
      name: "HDFC Bank",
      exchange: "NSE",
      type: "EQUITY",
      lotSize: 1,
      tickSize: 0.05,
    },
  ];

  for (const instrument of instruments) {
    await prisma.instrument.upsert({
      where: {
        symbol: instrument.symbol,
      },
      update: {
        name: instrument.name,
        exchange: instrument.exchange,
        type: instrument.type,
        lotSize: instrument.lotSize,
        tickSize: instrument.tickSize,
      },
      create: instrument,
    });
  }

   const user = await prisma.user.upsert({
    where: {
      email: "demo@tradecraft.local",
    },
    update: {
      username: "demo_trader",
      displayName: "Demo Trader",
    },
    create: {
      email: "demo@tradecraft.local",
      passwordHash: "DEV_ONLY_PASSWORD_HASH",
      username: "demo_trader",
      displayName: "Demo Trader",
    },
  });

  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        currency: "INR",
        cashBalance: "100000",
        reservedMargin: "0",
        isSimulated: true,
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log(`Inserted/updated ${instruments.length} instruments.`);
  console.log(`Demo user: ${user.username}`);}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });