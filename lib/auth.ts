import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "tradecraft_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not defined");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Create a signed session cookie for the authenticated user.
 */
export async function createSession(userId: string) {
  const token = await new SignJWT({
    userId,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Return the user ID stored in the current session.
 *
 * Returns null when the user is not authenticated.
 */
export async function getSessionUserId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSecretKey()
    );

    if (
      typeof payload.userId !== "string" ||
      !payload.userId
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * Return the complete authenticated user.
 *
 * Returns null when the session is missing,
 * invalid, expired, or the user no longer exists.
 */
export async function getCurrentUser() {
  const userId =
    await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user =
    await prisma.user.findUnique({
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
        updatedAt: true,
      },
    });

  return user;
}

/**
 * Require an authenticated user.
 *
 * This is useful inside protected API routes.
 *
 * Throws when there is no valid authenticated user.
 */
export async function requireCurrentUser() {
  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      "Authentication required"
    );
  }

  return user;
}

/**
 * Clear the current session.
 */
export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
