import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { updateChallengeProgress } from "@/lib/challenges/progress-service";

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
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  console.log(
    `Updating challenge progress for ${users.length} user(s)...`
  );

  for (const user of users) {
    const updatedChallenges =
      await updateChallengeProgress(
        prisma,
        user.id
      );

    console.log(
      `Updated ${updatedChallenges.length} challenge(s) for ${user.email}`
    );
  }

  console.log("Challenge progress update completed.");
}

main()
  .catch((error) => {
    console.error(
      "Challenge progress update failed:",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
