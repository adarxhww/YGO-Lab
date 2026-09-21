import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const user = await requireCurrentUser();

    const { postId } = await context.params;

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "Post ID is required",
        },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    const existingLike =
      await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      });

    if (existingLike) {
      await prisma.postLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      const likeCount =
        await prisma.postLike.count({
          where: {
            postId,
          },
        });

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
      });
    }

    await prisma.postLike.create({
      data: {
        postId,
        userId: user.id,
      },
    });

    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "POST_LIKE",
          message: `${user.displayName} liked your post.`,
        },
      });
    }

    const likeCount =
      await prisma.postLike.count({
        where: {
          postId,
        },
      });

    return NextResponse.json({
      success: true,
      liked: true,
      likeCount,
    });
  } catch (error) {
    console.error(
      "POST /api/v1/community/[postId]/like error:",
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
        error: "Failed to update like",
      },
      { status: 500 }
    );
  }
}
