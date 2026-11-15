import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to decode JWT payload in Next.js Edge Runtime
function decodeJwt(token: string): { _id: string; email: string; role: string; exp?: number } | null {
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
  const isStaticAsset = /\.(ico|png|jpg|jpeg|svg|css|js|webp|woff|woff2|ttf|txt)$/i.test(pathname);

  const isStaticOrPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/faculty/register") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/forgot-password") ||
    pathname.startsWith("/api/reset-password") ||
    pathname.startsWith("/api/resend-verification") ||
    pathname.startsWith("/reset-password") ||
    isStaticAsset ||
    pathname.startsWith("/verify-email");

  if (isStaticOrPublicAsset) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  const decoded = sessionCookie ? decodeJwt(sessionCookie) : null;

  // Check token expiration if decoded
  if (decoded && decoded.exp && Date.now() >= decoded.exp * 1000) {
    // Token expired - redirect to login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

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
    pathname === "/admin/login" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/verify-email");

  // Case 1: User is NOT logged in.
  if (!decoded) {
    if (!isPublicPage) {
      // For API routes, return 401 JSON instead of HTML redirect
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
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
