import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Failed to fetch notifications:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch notifications",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId
        : null;

    const markAll = body.markAll === true;

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: user.id,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error(
      "Failed to update notification:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update notification",
      },
      {
        status: 500,
      }
    );
  }
}
