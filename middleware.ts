import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to decode JWT payload in Next.js Edge Runtime
function decodeJwt(token: string): { _id: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define paths to bypass middleware checks
  const isStaticOrPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/faculty/register") ||
    pathname.startsWith("/api/logout") ||
    pathname.includes(".") || // files like favicon.ico, images
    pathname === "/verify-email";

  if (isStaticOrPublicAsset) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  const decoded = sessionCookie ? decodeJwt(sessionCookie) : null;

  // Protected student-only paths
  const isStudentPath =
    pathname.startsWith("/studentDashboard") ||
    pathname.startsWith("/submit-video");

  // Protected faculty-only paths
  const isFacultyPath =
    pathname.startsWith("/facultyDashboard") ||
    (pathname.startsWith("/api/faculty") && pathname !== "/api/faculty/register");

  // Protected admin-only paths
  const isAdminPath =
    pathname.startsWith("/adminDashboard") ||
    (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login");

  // Public pages that unauthenticated users can visit
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/registration" ||
    pathname === "/faculty/register" ||
    pathname === "/admin/login";

  // Case 1: User is NOT logged in.
  if (!decoded) {
    if (!isPublicPage) {
      if (isAdminPath) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Case 2: Logged in as Admin
  if (decoded.role === "admin") {
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/adminDashboard", req.url));
    }
    if (isStudentPath || isFacultyPath) {
      return NextResponse.redirect(new URL("/adminDashboard", req.url));
    }
    return NextResponse.next();
  }

  // Case 3: Non-admin user trying to access Admin resources
  if (isAdminPath) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Case 4: Student trying to access Faculty-only resources
  if (isFacultyPath && decoded.role !== "faculty") {
    return NextResponse.redirect(new URL("/studentDashboard", req.url));
  }

  // Case 5: Faculty trying to access Student-only resources
  if (isStudentPath && decoded.role !== "student") {
    return NextResponse.redirect(new URL("/facultyDashboard", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except public statics and asset folders
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
