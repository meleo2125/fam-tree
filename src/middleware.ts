import { NextRequest, NextResponse } from "next/server";
import { isValidSessionCookie } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/manifest.json") || pathname.startsWith("/icon")) {
    return NextResponse.next();
  }
  const cookie = request.cookies.get("family_tree_session")?.value;
  if (!(await isValidSessionCookie(cookie))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
