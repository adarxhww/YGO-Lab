import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      _count: post._count,
      likedByCurrentUser: post.likes.length > 0,
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error(
      "Failed to fetch community posts:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch community posts",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Post content is required",
        },
        {
          status: 400,
        }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Post content cannot exceed 1000 characters",
        },
        {
          status: 400,
        }
      );
    }

    const createdPost = await prisma.post.create({
      data: {
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const post = {
      id: createdPost.id,
      userId: createdPost.userId,
      content: createdPost.content,
      createdAt: createdPost.createdAt,
      updatedAt: createdPost.updatedAt,
      user: createdPost.user,
      _count: createdPost._count,
      likedByCurrentUser: false,
    };

    return NextResponse.json(
      {
        success: true,
        post,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create community post:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create community post",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser();

    const { searchParams } = new URL(request.url);

    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required",
        },
        {
          status: 400,
        }
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
          message: "Post not found",
        },
        {
          status: 404,
        }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only delete your own posts",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(
      "Failed to delete community post:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete community post",
      },
      {
        status: 500,
      }
    );
  }
}
