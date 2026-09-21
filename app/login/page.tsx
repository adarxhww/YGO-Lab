"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");

    setEmail("");
    setPassword("");
    setUsername("");
    setDisplayName("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/v1/auth/login"
          : "/api/v1/auth/register";

      const body =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              email,
              username,
              displayName,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ??
            (mode === "login"
              ? "Login failed"
              : "Registration failed")
        );

        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isRegistering = mode === "register";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">

          {/* Brand panel */}
          <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">

                {/* Desktop Logo */}
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
                  <Image
                    src="/logo.png"
                    alt="YGO TradeLab"
                    width={44}
                    height={44}
                    priority
                    className="h-full w-full scale-[1.25] object-cover"
                  />
                </div>

                <div>
                  <div className="text-sm font-bold">
                    YGO TradeLab
                  </div>

                  <div className="text-xs text-slate-400">
                    Paper Trading
                  </div>
                </div>
              </div>

              <div className="mt-20 max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Trading & Learning
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight">
                  Learn trading by actually practicing it.
                </h1>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  YGO TradeLab combines paper trading,
                  portfolio tracking, risk education, and
                  trading journals in one simulated environment.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-5 text-xs text-slate-400">
              Educational simulation only. No real money is
              involved.
            </div>
          </section>

          {/* Authentication panel */}
          <section className="p-7 sm:p-10">
            <div className="mx-auto max-w-md">

              {/* Mobile brand */}
              <div className="mb-10 flex items-center gap-3 lg:hidden">

                {/* Mobile Logo */}
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
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
                  <div className="text-sm font-bold text-slate-900">
                    YGO TradeLab
                  </div>

                  <div className="text-xs text-slate-500">
                    Paper Trading
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {isRegistering
                    ? "Start your journey"
                    : "Welcome back"}
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {isRegistering
                    ? "Create your account"
                    : "Sign in to your account"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isRegistering
                    ? "Create a free simulated trading account and start learning."
                    : "Continue your simulated trading and learning journey."}
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {isRegistering && (
                  <>
                    <div>
                      <label
                        htmlFor="displayName"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Display name
                      </label>

                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(event) =>
                          setDisplayName(event.target.value)
                        }
                        placeholder="Your name"
                        autoComplete="name"
                        required
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="username"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Username
                      </label>

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        placeholder="your_username"
                        autoComplete="username"
                        minLength={3}
                        maxLength={30}
                        required
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Letters, numbers, and underscores only.
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder={
                      isRegistering
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                    autoComplete={
                      isRegistering
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={
                      isRegistering ? 8 : undefined
                    }
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />

                  {isRegistering && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Use at least 8 characters.
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? isRegistering
                      ? "Creating account..."
                      : "Signing in..."
                    : isRegistering
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>

              {/* Mode switch */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  {isRegistering
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    switchMode(
                      isRegistering
                        ? "login"
                        : "register"
                    )
                  }
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50"
                >
                  {isRegistering
                    ? "Sign in instead"
                    : "Create an account"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
