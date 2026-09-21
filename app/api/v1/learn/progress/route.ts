import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

const progressSchema = z.object({
  lessonId: z
    .string()
    .trim()
    .min(1, "Lesson ID is required"),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        id: true,
        lessonId: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/learn/progress error:",
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
        error: "Failed to load learning progress",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const parsed = progressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ??
            "Invalid request",
        },
        { status: 400 }
      );
    }

    const { lessonId } = parsed.data;

    const progress =
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId,
          completedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(
      "POST /api/v1/learn/progress error:",
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
        error: "Failed to save learning progress",
      },
      { status: 500 }
    );
  }
}
