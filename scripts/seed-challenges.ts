import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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

const challenges = [
  {
    title: "First Steps",
    description: "Complete your first paper trade.",
    badgeIcon: "🏁",
    targetType: "COMPLETE_TRADES",
    targetValue: 1,
    durationDays: 7,
  },
  {
    title: "Active Trader",
    description: "Complete 5 paper trades.",
    badgeIcon: "📈",
    targetType: "COMPLETE_TRADES",
    targetValue: 5,
    durationDays: 14,
  },
  {
    title: "Trading Explorer",
    description: "Complete 10 paper trades.",
    badgeIcon: "🚀",
    targetType: "COMPLETE_TRADES",
    targetValue: 10,
    durationDays: 30,
  },
  {
    title: "Journal Keeper",
    description: "Create 5 trading journal entries.",
    badgeIcon: "📓",
    targetType: "JOURNAL_STREAK",
    targetValue: 5,
    durationDays: 14,
  },
  {
    title: "Disciplined Trader",
    description:
      "Complete 10 trades while maintaining your trading discipline.",
    badgeIcon: "🎯",
    targetType: "COMPLETE_TRADES",
    targetValue: 10,
    durationDays: 30,
  },
];

async function main() {
  console.log("Seeding challenges...");

  for (const challenge of challenges) {
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        title: challenge.title,
      },
    });

    if (existingChallenge) {
      await prisma.challenge.update({
        where: {
          id: existingChallenge.id,
        },
        data: challenge,
      });

      console.log(`Updated: ${challenge.title}`);
    } else {
      await prisma.challenge.create({
        data: challenge,
      });

      console.log(`Created: ${challenge.title}`);
    }
  }

  console.log("Challenge seeding completed.");
}

main()
  .catch((error) => {
    console.error("Challenge seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
