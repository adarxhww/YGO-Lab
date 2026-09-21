import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or less"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message ??
        "Please check your registration details";

      return NextResponse.json(
        {
          success: false,
          error: firstError,
        },
        { status: 400 }
      );
    }

    const {
      email,
      username,
      displayName,
      password,
    } = validation.data;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: normalizedEmail,
          },
          {
            username: normalizedUsername,
          },
        ],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "That username is already taken",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            username: normalizedUsername,
            displayName: displayName.trim(),
            passwordHash,
          },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        });

        await tx.account.create({
          data: {
            userId: user.id,
            currency: "INR",
            cashBalance: 100000,
            reservedMargin: 0,
            isSimulated: true,
          },
        });

        return user;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    await createSession(result.id);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/auth/register error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create your account",
      },
      { status: 500 }
    );
  }
}
