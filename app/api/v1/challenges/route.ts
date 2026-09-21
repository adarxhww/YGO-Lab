import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { updateChallengeProgress } from "@/lib/challenges/progress-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    /*
     * Recalculate progress before returning the challenges.
     */
    await updateChallengeProgress(prisma, user.id);

    const challenges = await prisma.challenge.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        userChallenges: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            progress: true,
            completed: true,
            completedAt: true,
            startedAt: true,
          },
        },
      },
    });

    const now = new Date();

    const formattedChallenges = challenges.map(
      (challenge) => {
        const userChallenge =
          challenge.userChallenges[0] ?? null;

        let expired = false;
        let expiresAt: Date | null = null;

        if (userChallenge) {
          expiresAt = new Date(
            userChallenge.startedAt.getTime() +
              challenge.durationDays *
                24 *
                60 *
                60 *
                1000
          );

          expired =
            !userChallenge.completed &&
            now >= expiresAt;
        }

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          badgeIcon: challenge.badgeIcon,
          targetType: challenge.targetType,
          targetValue: challenge.targetValue,
          durationDays: challenge.durationDays,

          progress: userChallenge?.progress ?? 0,

          completed:
            userChallenge?.completed ?? false,

          completedAt:
            userChallenge?.completedAt ?? null,

          started:
            userChallenge !== null,

          startedAt:
            userChallenge?.startedAt ?? null,

          expiresAt,

          expired,

          userChallengeId:
            userChallenge?.id ?? null,
        };
      }
    );

    return NextResponse.json({
      success: true,
      challenges: formattedChallenges,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/challenges error:",
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
        error: "Failed to load challenges",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const challengeId =
      typeof body?.challengeId === "string"
        ? body.challengeId.trim()
        : "";

    if (!challengeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Challenge ID is required",
        },
        { status: 400 }
      );
    }

    const challenge =
      await prisma.challenge.findUnique({
        where: {
          id: challengeId,
        },
      });

    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: "Challenge not found",
        },
        { status: 404 }
      );
    }

    const existingUserChallenge =
      await prisma.userChallenge.findUnique({
        where: {
          userId_challengeId: {
            userId: user.id,
            challengeId,
          },
        },
      });

    if (existingUserChallenge) {
      const expiresAt = new Date(
        existingUserChallenge.startedAt.getTime() +
          challenge.durationDays *
            24 *
            60 *
            60 *
            1000
      );

      const expired =
        !existingUserChallenge.completed &&
        new Date() >= expiresAt;

      if (expired) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This challenge has already expired.",
            expired: true,
            expiresAt,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Challenge is already started",
        userChallenge: existingUserChallenge,
      });
    }

    /*
     * startedAt is automatically populated by Prisma.
     */
    const userChallenge =
      await prisma.userChallenge.create({
        data: {
          userId: user.id,
          challengeId,
          progress: 0,
          completed: false,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Challenge started",
        userChallenge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/challenges error:",
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
        error: "Failed to start challenge",
      },
      { status: 500 }
    );
  }
}
