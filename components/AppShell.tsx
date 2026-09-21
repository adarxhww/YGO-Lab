"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppSidebar from "@/components/AppSidebar";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [authState, setAuthState] =
    useState<AuthState>("loading");

  const isAuthPage = pathname === "/login";

  useEffect(() => {
    if (isAuthPage) {
      setAuthState("authenticated");
      return;
    }

    let cancelled = false;

    async function checkAuthentication() {
      try {
        const response = await fetch(
          "/api/v1/auth/me",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setAuthState("unauthenticated");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          setAuthState("unauthenticated");
          router.replace("/login");
          return;
        }

        setAuthState("authenticated");
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        if (!cancelled) {
          setAuthState("unauthenticated");
          router.replace("/login");
        }
      }
    }

    checkAuthentication();

    return () => {
      cancelled = true;
    };
  }, [isAuthPage, router]);

  /*
   * Login page does not use the application shell.
   */
  if (isAuthPage) {
    return <>{children}</>;
  }

  /*
   * Don't render protected application content
   * until authentication has been checked.
   */
  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  /*
   * While redirecting to login, don't expose
   * protected application content.
   */
  if (authState === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <p className="text-sm text-slate-500">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <>
      <AppSidebar />

      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}
