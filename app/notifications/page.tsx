"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  if (type === "LIKE") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg text-red-500">
        ♥
      </div>
    );
  }

  if (type === "COMMENT") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
        💬
      </div>
    );
  }

  if (type === "FOLLOW") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg">
        👤
      </div>
    );
  }

  if (type === "CHALLENGE") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-lg">
        🏆
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
      🔔
    </div>
  );
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [markingAll, setMarkingAll] =
    useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/v1/notifications",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load notifications"
        );
      }

      setNotifications(
        data.notifications ?? []
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setError(
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(
    notificationId: string
  ) {
    try {
      const response = await fetch(
        "/api/v1/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            notificationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update notification"
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark notification:",
        error
      );
    }
  }

  async function markAllAsRead() {
    if (markingAll) {
      return;
    }

    setMarkingAll(true);

    try {
      const response = await fetch(
        "/api/v1/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            markAll: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to mark notifications"
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Activity
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Stay updated with activity from
              your TradeCraft account.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingAll
                ? "Marking..."
                : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Unread summary */}
        {!loading &&
          !error &&
          notifications.length > 0 && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Notification center
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {unreadCount === 0
                    ? "You're all caught up."
                    : `${unreadCount} unread ${
                        unreadCount === 1
                          ? "notification"
                          : "notifications"
                      }`}
                </p>
              </div>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-bold text-white">
                {unreadCount}
              </div>
            </div>
          )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          notifications.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                🔔
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No notifications yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When someone interacts with
                your posts, follows you, or you
                complete an activity, you'll see
                it here.
              </p>

              <Link
                href="/community"
                className="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Explore Community
              </Link>
            </div>
          )}

        {/* Notifications */}
        {!loading &&
          !error &&
          notifications.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {notifications.map(
                (notification, index) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(
                          notification.id
                        );
                      }
                    }}
                    className={`flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-slate-50 ${
                      index !==
                      notifications.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    } ${
                      notification.read
                        ? "bg-white"
                        : "bg-blue-50/40"
                    }`}
                  >
                    <NotificationIcon
                      type={
                        notification.type
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-6 ${
                          notification.read
                            ? "font-medium text-slate-600"
                            : "font-semibold text-slate-900"
                        }`}
                      >
                        {
                          notification.message
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatTime(
                          notification.createdAt
                        )}
                      </p>
                    </div>

                    {!notification.read && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </button>
                )
              )}
            </div>
          )}
      </main>
    </div>
  );
}
