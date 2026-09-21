"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  badge?: number;
};

type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

function NavItem({
  href,
  label,
  icon,
  exact = false,
  badge,
}: NavItemProps) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        {label}
      </span>

      {badge !== undefined && badge > 0 && (
        <span
          className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            isActive
              ? "bg-white text-slate-900"
              : "bg-red-500 text-white"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function MarketsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15V9" />
      <path d="M10 17V7" />
      <path d="M13 13V5" />
      <path d="M16 16V8" />
      <path d="M19 11V4" />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7h10" />
      <path d="m13 3 4 4-4 4" />
      <path d="M17 17H7" />
      <path d="m11 13-4 4 4 4" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h18" />
      <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
      />
      <path d="M15 13h3" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect
        x="7"
        y="13"
        width="3"
        height="4"
        rx="0.5"
      />
      <rect
        x="12"
        y="9"
        width="3"
        height="8"
        rx="0.5"
      />
      <rect
        x="17"
        y="5"
        width="3"
        height="12"
        rx="0.5"
      />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 8-3 8 3-8 3-8-3Z" />
      <path d="M6 9v5c0 2 2.7 4 6 4s6-2 6-4V9" />
      <path d="M20 7v6" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChallengesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10" />
      <path d="M7 4v3a5 5 0 0 0 10 0V4" />
      <path d="M5 4H3v2a4 4 0 0 0 4 4" />
      <path d="M19 4h2v2a4 4 0 0 1-4 4" />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

function getInitials(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "U";
  }

  const parts = trimmedName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
}

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  async function loadCurrentUser() {
    try {
      const response = await fetch(
        "/api/v1/auth/me",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        return;
      }

      setCurrentUser(data.user);
    } catch (error) {
      console.error(
        "Failed to load current user:",
        error
      );
    }
  }

  async function loadUnreadNotifications() {
    try {
      const response = await fetch(
        "/api/v1/notifications",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (!data.success) {
        return;
      }

      setUnreadNotifications(
        Number(data.unreadCount) || 0
      );
    } catch (error) {
      console.error(
        "Failed to load notification count:",
        error
      );
    }
  }

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    loadCurrentUser();
    loadUnreadNotifications();

    const interval = window.setInterval(() => {
      loadCurrentUser();
      loadUnreadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [pathname]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/v1/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Logout request failed"
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  if (pathname === "/login") {
    return null;
  }

  const displayName =
    currentUser?.displayName ?? "Loading...";

  const initials = currentUser
    ? getInitials(currentUser.displayName)
    : "…";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-[76px] items-center border-b border-slate-100 px-5">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
            <Image
              src="/logo.png"
              alt="YGO TradeLab"
              width={40}
              height={40}
              priority
              className="h-full w-full scale-[1.25] object-cover"
            />
          </div>

          <div>
            <div className="text-[15px] font-bold text-slate-900">
              YGO TradeLab
            </div>

            <div className="text-xs font-medium text-slate-400">
              Sim
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {/* Workspace */}
        <div>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            <NavItem
              href="/"
              label="Dashboard"
              exact
              icon={<DashboardIcon />}
            />

            <NavItem
              href="/markets"
              label="Markets"
              icon={<MarketsIcon />}
            />

            <NavItem
              href="/trade"
              label="Trade"
              icon={<TradeIcon />}
            />

            <NavItem
              href="/portfolio"
              label="Portfolio"
              icon={<PortfolioIcon />}
            />

            <NavItem
              href="/orders"
              label="Orders"
              icon={<OrdersIcon />}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="mt-7">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Insights
          </p>

          <div className="space-y-1">
            <NavItem
              href="/journal"
              label="Journal"
              icon={<JournalIcon />}
            />

            <NavItem
              href="/analytics"
              label="Analytics"
              icon={<AnalyticsIcon />}
            />

            <NavItem
              href="/learn"
              label="Learn"
              icon={<LearnIcon />}
            />
          </div>
        </div>

        {/* Community */}
        <div className="mt-7">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Community
          </p>

          <div className="space-y-1">
            <NavItem
              href="/community"
              label="Community"
              icon={<CommunityIcon />}
            />

            <NavItem
              href="/challenges"
              label="Challenges"
              icon={<ChallengesIcon />}
            />
          </div>
        </div>

        {/* Account */}
        <div className="mt-7">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <div className="space-y-1">
            <NavItem
              href="/notifications"
              label="Notifications"
              icon={<NotificationsIcon />}
              badge={unreadNotifications}
            />

            <NavItem
              href="/profile"
              label="Profile"
              icon={<ProfileIcon />}
            />
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
          {/* User initials / avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {currentUser?.avatarUrl ? (
              <Image
                src={currentUser.avatarUrl}
                alt={displayName}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* User information */}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayName}
            </p>

            <p className="truncate text-xs text-slate-400">
              Simulated account
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <LogoutIcon />
          </span>

          <span>
            {isLoggingOut
              ? "Logging out..."
              : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
}
