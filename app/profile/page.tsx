"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

type Account = {
  id: string;
  currency: string;
  cashBalance: number;
  isSimulated: boolean;
  createdAt: string;
};

type Stats = {
  openPositions: number;
  orders: number;
  lessonsCompleted: number;
};

type ProfileResponse = {
  success: boolean;
  profile: Profile;
  account: Account | null;
  stats: Stats;
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [account, setAccount] =
    useState<Account | null>(null);

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [displayName, setDisplayName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch("/api/v1/profile", {
            cache: "no-store",
          });

        const data =
          (await response.json()) as ProfileResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Failed to load profile"
          );
        }

        setProfile(data.profile);
        setAccount(data.account);
        setStats(data.stats);

        setDisplayName(
          data.profile.displayName
        );

        setUsername(
          data.profile.username
        );

        setBio(
          data.profile.bio ?? ""
        );
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/v1/profile",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              displayName:
                displayName.trim(),
              username:
                username.trim(),
              bio: bio.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to update profile"
        );
      }

      setProfile(data.profile);

      setDisplayName(
        data.profile.displayName
      );

      setUsername(
        data.profile.username
      );

      setBio(
        data.profile.bio ?? ""
      );

      setSuccess(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#111827] lg:ml-64">
      <section className="min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Account
              </div>

              <h1 className="text-lg font-bold tracking-tight">
                Profile
              </h1>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
              {profile?.displayName
                ?.slice(0, 2)
                .toUpperCase() ?? "DT"}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8">
          {/* Page heading */}
          <section className="mb-7">
            <p className="mb-2 text-sm font-medium text-slate-500">
              Account settings
            </p>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your Profile
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your TradeCraft identity and
              review your simulated trading account.
            </p>
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="h-[360px] animate-pulse rounded-2xl bg-white" />

              <div className="h-[500px] animate-pulse rounded-2xl bg-white" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                {/* Profile summary */}
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-bold">
                        Profile
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Your public TradeCraft identity.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                          {(
                            profile?.displayName ??
                            "DT"
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="text-lg font-bold">
                            {profile?.displayName}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            @{profile?.username}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Email
                        </div>

                        <div className="mt-2 text-sm font-medium">
                          {profile?.email}
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Member since
                        </div>

                        <div className="mt-2 text-sm font-medium">
                          {profile
                            ? formatDate(
                                profile.createdAt
                              )
                            : "—"}
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Bio
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {profile?.bio ||
                            "No bio added yet."}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Account */}
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-bold">
                        Trading Account
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Current simulated account information.
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <AccountRow
                        label="Account type"
                        value={
                          account?.isSimulated
                            ? "Simulated"
                            : "Live"
                        }
                      />

                      <AccountRow
                        label="Currency"
                        value={
                          account?.currency ??
                          "INR"
                        }
                      />

                      <AccountRow
                        label="Available cash"
                        value={
                          account
                            ? formatINR(
                                account.cashBalance
                              )
                            : "—"
                        }
                      />

                      <AccountRow
                        label="Account created"
                        value={
                          account
                            ? formatDate(
                                account.createdAt
                              )
                            : "—"
                        }
                      />
                    </div>
                  </section>
                </div>

                {/* Edit + statistics */}
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-bold">
                        Edit Profile
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Update the information associated with
                        your account.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSave}
                      className="p-5"
                    >
                      <div className="space-y-5">
                        <div>
                          <label
                            htmlFor="displayName"
                            className="text-xs font-semibold text-slate-600"
                          >
                            Display name
                          </label>

                          <input
                            id="displayName"
                            value={displayName}
                            onChange={(event) =>
                              setDisplayName(
                                event.target.value
                              )
                            }
                            maxLength={100}
                            disabled={saving}
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="username"
                            className="text-xs font-semibold text-slate-600"
                          >
                            Username
                          </label>

                          <input
                            id="username"
                            value={username}
                            onChange={(event) =>
                              setUsername(
                                event.target.value
                              )
                            }
                            maxLength={30}
                            disabled={saving}
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                          />

                          <p className="mt-1.5 text-[11px] text-slate-400">
                            Letters, numbers, and underscores
                            only.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="text-xs font-semibold text-slate-600"
                          >
                            Email
                          </label>

                          <input
                            id="email"
                            value={
                              profile?.email ?? ""
                            }
                            disabled
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                          />

                          <p className="mt-1.5 text-[11px] text-slate-400">
                            Email changes will be handled by
                            authentication settings later.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="bio"
                            className="text-xs font-semibold text-slate-600"
                          >
                            Bio
                          </label>

                          <textarea
                            id="bio"
                            value={bio}
                            onChange={(event) =>
                              setBio(
                                event.target.value
                              )
                            }
                            maxLength={500}
                            rows={5}
                            disabled={saving}
                            placeholder="Tell us a little about yourself..."
                            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                          />

                          <div className="mt-1 text-right text-[11px] text-slate-400">
                            {bio.length}/500
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving
                            ? "Saving..."
                            : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </section>

                  {/* Statistics */}
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-bold">
                        Activity Summary
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        A quick view of your TradeCraft activity.
                      </p>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-3">
                      <SummaryCard
                        label="Open Positions"
                        value={String(
                          stats?.openPositions ?? 0
                        )}
                        description="Active holdings"
                      />

                      <SummaryCard
                        label="Orders"
                        value={String(
                          stats?.orders ?? 0
                        )}
                        description="Recorded orders"
                      />

                      <SummaryCard
                        label="Lessons"
                        value={String(
                          stats?.lessonsCompleted ?? 0
                        )}
                        description="Completed lessons"
                      />
                    </div>
                  </section>

                  {/* Account actions */}
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-bold">
                        Account
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Other account-related areas.
                      </p>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <Link
                        href="/portfolio"
                        className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="text-sm font-bold">
                          Portfolio
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Review holdings, allocation, and
                          performance.
                        </div>
                      </Link>

                      <Link
                        href="/learn"
                        className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="text-sm font-bold">
                          Learning Path
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Continue your structured trading
                          education.
                        </div>
                      </Link>
                    </div>
                  </section>
                </div>
              </div>

              {/* Educational note */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    TradeCraft Account
                  </div>

                  <h3 className="mt-2 text-lg font-bold">
                    Learn, practice, review, improve.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Your TradeCraft profile connects your
                    learning progress with your simulated
                    trading activity. Use the platform to
                    practice execution and build disciplined
                    decision-making habits.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </section>

      {/* Mobile navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          <MobileNav
            href="/"
            label="Home"
          />

          <MobileNav
            href="/markets"
            label="Markets"
          />

          <MobileNav
            href="/trade"
            label="Trade"
          />

          <MobileNav
            href="/portfolio"
            label="Portfolio"
          />

          <MobileNav
            href="/learn"
            label="Learn"
          />
        </div>
      </div>
    </main>
  );
}

function AccountRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-slate-500">
        {description}
      </div>
    </div>
  );
}

function MobileNav({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-slate-500"
    >
      {label}
    </Link>
  );
}
