import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_COMMENT_LENGTH = 500;

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireCurrentUser();

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

    const comments =
      await prisma.comment.findMany({
        where: {
          postId,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/community/[postId]/comments error:",
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
        error: "Failed to load comments",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
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

    const body = await request.json();

    const content =
      typeof body?.content === "string"
        ? body.content.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Comment content is required",
        },
        { status: 400 }
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
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

    const comment =
      await prisma.comment.create({
        data: {
          postId,
          userId: user.id,
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "POST_COMMENT",
          message: `${user.displayName} commented on your post.`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/community/[postId]/comments error:",
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
        error: "Failed to create comment",
      },
      { status: 500 }
    );
  }
}
