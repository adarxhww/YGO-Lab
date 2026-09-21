import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function getAuthenticatedUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user;
}

export async function getAuthenticatedAccount() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return account;
}

export async function requireAuthenticatedAccount() {
  const account = await getAuthenticatedAccount();

  if (!account) {
    throw new Error("Authenticated trading account not found");
  }

  return account;
}
