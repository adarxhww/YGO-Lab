import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

const DEMO_EMAIL = "demo@tradecraft.local";
const DEMO_PASSWORD = "demo12345";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.update({
    where: {
      email: DEMO_EMAIL,
    },
    data: {
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  console.log("Demo password configured successfully.");
  console.log({
    ...user,
    password: DEMO_PASSWORD,
  });
}

main()
  .catch((error) => {
    console.error("Failed to configure demo password:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
