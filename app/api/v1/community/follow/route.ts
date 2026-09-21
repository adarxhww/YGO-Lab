import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const targetUserId =
      typeof body?.userId === "string"
        ? body.userId.trim()
        : "";

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot follow yourself",
        },
        { status: 400 }
      );
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          displayName: true,
        },
      });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const existingFollow =
      await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetUserId,
          },
        },
      });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });

      return NextResponse.json({
        success: true,
        following: false,
      });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "NEW_FOLLOWER",
        message: `${user.displayName} started following you.`,
      },
    });

    return NextResponse.json({
      success: true,
      following: true,
    });
  } catch (error) {
    console.error(
      "POST /api/v1/community/follow error:",
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
        error: "Failed to update follow",
      },
      { status: 500 }
    );
  }
}
