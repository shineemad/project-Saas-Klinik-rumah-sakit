import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_KEY } from "./lib/api";

const PROTECTED_PATHS = [
  "/dashboard",
  "/patients",
  "/queue",
  "/medical-records",
  "/pharmacy",
  "/billing",
  "/reports",
  "/settings",
];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_TOKEN_KEY)?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
