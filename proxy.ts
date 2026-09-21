import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "tradecraft_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not defined");
  }

  return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSecretKey()
    );

    return (
      typeof payload.userId === "string" &&
      payload.userId.length > 0
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authenticated = await isAuthenticated(request);

  /*
   * The login page is public.
   *
   * If the user is already logged in and tries to open /login,
   * send them back to the dashboard.
   */
  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return NextResponse.next();
  }

  /*
   * Everything else matched by this Proxy requires authentication.
   */
  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);

    /*
     * Remember where the user originally wanted to go.
     * We can use this later to return them there after login.
     */
    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run Proxy on application pages, but not API routes,
     * Next.js internals, or common static files.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
