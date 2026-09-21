import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .max(100)
    .optional(),

  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),

  bio: z
    .string()
    .max(500)
    .optional(),
});

export async function GET() {
  try {
    const authenticatedUser =
      await requireCurrentUser();

    const user =
      await prisma.user.findUnique({
        where: {
          id: authenticatedUser.id,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          accounts: {
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              id: true,
              currency: true,
              cashBalance: true,
              isSimulated: true,
              createdAt: true,
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const account =
      user.accounts[0] ?? null;

    const [
      positionCount,
      orderCount,
      completedLessons,
    ] = await Promise.all([
      account
        ? prisma.position.count({
            where: {
              accountId: account.id,
              quantity: {
                gt: 0,
              },
            },
          })
        : 0,

      account
        ? prisma.order.count({
            where: {
              accountId: account.id,
            },
          })
        : 0,

      prisma.lessonProgress.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      profile: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt:
          user.createdAt.toISOString(),
      },

      account: account
        ? {
            id: account.id,
            currency: account.currency,
            cashBalance:
              Number(
                account.cashBalance
              ),
            isSimulated:
              account.isSimulated,
            createdAt:
              account.createdAt.toISOString(),
          }
        : null,

      stats: {
        openPositions:
          positionCount,
        orders: orderCount,
        lessonsCompleted:
          completedLessons,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/v1/profile error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const authenticatedUser =
      await requireCurrentUser();

    const body =
      await request.json();

    const validation =
      updateProfileSchema.safeParse(
        body
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid profile data",
          details:
            validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (validation.data.username) {
      const usernameOwner =
        await prisma.user.findFirst({
          where: {
            username:
              validation.data.username,
            NOT: {
              id: authenticatedUser.id,
            },
          },
          select: {
            id: true,
          },
        });

      if (usernameOwner) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Username is already taken",
          },
          { status: 409 }
        );
      }
    }

    const user =
      await prisma.user.update({
        where: {
          id: authenticatedUser.id,
        },

        data: {
          ...(validation.data
            .displayName !== undefined
            ? {
                displayName:
                  validation.data
                    .displayName,
              }
            : {}),

          ...(validation.data
            .username !== undefined
            ? {
                username:
                  validation.data
                    .username,
              }
            : {}),

          ...(validation.data
            .bio !== undefined
            ? {
                bio:
                  validation.data.bio,
              }
            : {}),
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

    return NextResponse.json({
      success: true,
      message:
        "Profile updated successfully",

      profile: {
        ...user,
        createdAt:
          user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "PATCH /api/v1/profile error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
