import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "medsimplify_fallback_secret_key_minimum_32_chars";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("medsimplify_session")?.value;
  const { pathname } = request.nextUrl;

  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // Root route "/" redirection
  if (pathname === "/") {
    if (isValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isValid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and navigating to auth pages, redirect to dashboard
  if ((pathname === "/login" || pathname === "/signup") && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/signup"],
};
