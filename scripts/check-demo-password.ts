import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: "demo@tradecraft.local",
    },
    select: {
      passwordHash: true,
    },
  });

  console.log("User found:", !!user);

  if (!user) {
    return;
  }

  const matches = await bcrypt.compare(
    "demo12345",
    user.passwordHash
  );

  console.log("Password matches:", matches);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
