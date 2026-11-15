# Code Review & Security Audit Report

**Date:** November 15, 2026  
**Scope:** Review of changed authentication, session management, and verification files.  
**Reviewed Files:**
1. `app/api/login/route.ts`
2. `app/api/resend-verification/route.ts`
3. `components/LoginForm.tsx`
4. `middleware.ts`

---

## 1. Executive Summary

This security audit and code quality review analyzed the authentication and email verification mechanisms recently added to the application. While the core workflow handles legitimate login and verification requests, several security vulnerabilities, denial-of-service risks, and race conditions were identified across the middleware, backend API routes, and client-side form logic.

### Findings Breakdown by Severity

| Severity | Count | Primary Impact |
| :--- | :---: | :--- |
| 🔴 **Critical** | **1** | Full middleware authentication bypass via dot (`.`) in request paths |
| 🟠 **High** | **3** | Unverified JWT signatures & missing expiry in Edge middleware, unthrottled resend endpoint (email quota exhaustion/DoS), and verification token invalidation race conditions |
| 🟡 **Medium** | **5** | Internal mailer error leaks to frontend, user enumeration, client-side missing cooldowns, stale UI feedback states, and protected API redirects returning HTML |
| 🔵 **Low / Quality** | **4** | Misleading re-registration guidance, database outages returning HTTP 401, non-string type handling, and destructive token rollback |

---

## 2. Findings Matrix

| ID | File | Severity | Title |
| :--- | :--- | :---: | :--- |
| **SEC-01** | `middleware.ts` | 🔴 **Critical** | Authentication bypass via `pathname.includes(".")` |
| **SEC-02** | `middleware.ts` | 🟠 **High** | Unverified JWT payload decoding & missing expiration check |
| **DOS-01** | `app/api/resend-verification/route.ts` | 🟠 **High** | Lack of rate limiting on email resend (Quota Exhaustion / DoS) |
| **BUG-01** | `app/api/resend-verification/route.ts` | 🟠 **High** | Rapid resend invalidates prior verification links (Token Invalidation Race) |
| **SEC-03** | `app/api/resend-verification/route.ts` | 🟡 **Medium** | Sensitive infrastructure and SMTP error disclosure |
| **PRIV-01**| `app/api/resend-verification/route.ts` | 🟡 **Medium** | Account status & email enumeration through inconsistent responses |
| **UX-01**  | `components/LoginForm.tsx` | 🟡 **Medium** | Missing client-side cooldown timer on Resend button |
| **UI-01**  | `components/LoginForm.tsx` | 🟡 **Medium** | Stale success/error alerts retained during mode transition |
| **ROUT-01**| `middleware.ts` | 🟡 **Medium** | Trailing slash redirects on `/verify-email/` and HTML redirects for API requests |
| **BUG-02** | `components/LoginForm.tsx` | 🔵 **Low** | "Re-register" recommendation fails due to database duplicate key constraint |
| **ERR-01** | `app/api/login/route.ts` | 🔵 **Low** | Database connection errors misclassified as HTTP 401 Unauthorized |
| **INP-01** | `app/api/resend-verification/route.ts` | 🔵 **Low** | Non-string email payload causes uncaught `TypeError` |
| **DATA-01**| `app/api/resend-verification/route.ts` | 🔵 **Low** | Destructive token rollback erases existing valid token |

---

## 3. Detailed Findings & Recommended Fixes

### 🔴 Critical Severity

#### [SEC-01] Authentication Bypass via `pathname.includes(".")`
* **File:** `middleware.ts` (Lines 28–44)
* **Vulnerability Description:**
  The middleware checks if the requested path contains a period (`.`) to exempt static assets:
  ```typescript
  const isStaticOrPublicAsset =
    // ...
    pathname.includes(".") || // files like favicon.ico, images
    pathname === "/verify-email";
  ```
  Any request containing a `.` (e.g., `/adminDashboard/.`, `/adminDashboard/data.json`, or `/facultyDashboard/page.js`) will be marked as a static asset. The middleware allows the request through without verifying session credentials or user roles.
* **Impact:** Direct access to protected application paths, bypassing middleware role and session enforcement.
* **Recommended Fix:**
  Replace `pathname.includes(".")` with a strict file extension regex:
  ```typescript
  const isStaticAsset = /\.(ico|png|jpg|jpeg|svg|css|js|webp|woff|woff2|ttf|txt)$/i.test(pathname);
  ```

---

### 🟠 High Severity

#### [SEC-02] Unverified JWT Decoding & Missing Expiration Check in Middleware
* **File:** `middleware.ts` (Lines 5–22, 46–47)
* **Vulnerability Description:**
  The `decodeJwt` function only decodes the Base64URL string of the JWT payload using `atob()`. It does not cryptographically verify the signature against `JWT_SECRET`, nor does it inspect `decoded.exp`:
  ```typescript
  function decodeJwt(token: string): { _id: string; email: string; role: string; exp?: number } | null {
    // Only parses base64 payload - signature is never verified
  }
  ```
* **Impact:** 
  1. Attackers can forge a cookie with `{ "role": "admin" }` to bypass the middleware checks.
  2. Tokens that have expired days or months ago will still be treated as valid by the middleware.
* **Important Edge Runtime Note:**
  Next.js middleware runs in the **Edge Runtime**, where Node.js core modules (such as `crypto` used by `jsonwebtoken`) are unavailable. Attempting to `import jwt from "jsonwebtoken"` will crash the build.
* **Recommended Fix:**
  * **Option A (Lightweight & Safe):** Validate token expiration in middleware and rely on Node.js Server Components (`getUserSession()` with `jwt.verify`) for signature validation:
    ```typescript
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    ```
  * **Option B (Complete Edge Verification):** Use the Edge-compatible `jose` library:
    ```typescript
    import { jwtVerify } from "jose";
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    ```

#### [DOS-01] Lack of Rate Limiting on Verification Resend (DoS & Quota Exhaustion)
* **File:** `app/api/resend-verification/route.ts` (Lines 9–61)
* **Vulnerability Description:**
  The `POST /api/resend-verification` endpoint can be called repeatedly without any throttle, rate limit, or cooldown window. Each request triggers database writes and calls external email dispatch services (Gmail SMTP, Brevo, Resend).
* **Impact:**
  * Exhaustion of third-party transactional email quotas.
  * Risk of sending IP/domain blacklisting due to high-volume automated requests.
  * Application-level denial of service.
* **Recommended Fix:**
  Enforce a minimum 60-second cooldown on the server before issuing a new email:
  ```typescript
  if (user.verificationTokenExpires) {
    const timeSinceIssue = 3600000 - (user.verificationTokenExpires.getTime() - Date.now());
    if (timeSinceIssue < 60000) {
      return NextResponse.json(
        { success: false, message: "Please wait at least 60 seconds before requesting another verification email." },
        { status: 429 }
      );
    }
  }
  ```

#### [BUG-01] Token Invalidation Race Condition on Repeated Clicks
* **File:** `app/api/resend-verification/route.ts` (Lines 41–45) & `components/LoginForm.tsx`
* **Vulnerability Description:**
  Whenever a user requests a resend, a new random token is generated and stored in MongoDB, immediately replacing the previous token. If an email takes 10–15 seconds to arrive and the user clicks "Resend" again:
  1. Token 1 is overwritten by Token 2 in the database.
  2. The user opens Email 1 and clicks the link with Token 1.
  3. `app/verify-email/page.tsx` searches for Token 1, fails to find it, and displays "Verification Link Expired".
* **Impact:** Users become stuck in an endless loop where every email link they click is already invalid by the time it reaches their inbox.
* **Recommended Fix:**
  If an existing `user.verificationToken` is still valid and unexpired (e.g. issued < 5 minutes ago), reuse that token instead of generating a new one, or enforce the 60-second cooldown.

---

### 🟡 Medium Severity

#### [SEC-03] Internal SMTP & Provider Errors Exposed to Client
* **File:** `app/api/resend-verification/route.ts` (Lines 55, 65)
* **Vulnerability Description:**
  When `sendVerificationEmail` fails (e.g., invalid SMTP credentials, timeout, or missing provider API keys), the raw technical message from Nodemailer/Brevo/Resend is caught and returned directly in the response:
  ```typescript
  return NextResponse.json(
    { success: false, message: error.message || "Failed to send verification email." },
    { status: 500 }
  );
  ```
* **Impact:** Attackers or external users can probe the endpoint and read server network timeouts, SMTP hostnames, or authentication errors directly in the browser.
* **Recommended Fix:**
  Log the full error on the server (`console.error`), but return a sanitized message to the client:
  ```typescript
  return NextResponse.json(
    { success: false, message: "Unable to dispatch verification email at this time. Please try again later." },
    { status: 500 }
  );
  ```

#### [PRIV-01] Account & Verification Status Enumeration
* **File:** `app/api/resend-verification/route.ts` (Lines 24–38)
* **Vulnerability Description:**
  The endpoint provides different responses based on account state:
  * Non-existent email: `"If the email is registered and not verified, a verification email has been sent."`
  * Existing, verified email: `"This account is already verified. You can log in directly."`
  * Existing, unverified email: `"Verification email sent! Check your inbox."`
* **Impact:** Allows anyone to confirm whether an email address exists in the system and whether the user has verified their account.
* **Recommended Fix:**
  Return a unified, non-enumerating message regardless of whether the email exists or is already verified:
  ```typescript
  return NextResponse.json({
    success: true,
    message: "If the email is registered and pending verification, a verification email has been sent."
  });
  ```

#### [UX-01] Missing Client-Side Cooldown Timer on Resend Button
* **File:** `components/LoginForm.tsx` (Lines 63–87, 291–297)
* **Vulnerability Description:**
  After the resend API finishes, the submit button is re-enabled immediately. Without client-side visual feedback, users repeatedly click the button.
* **Recommended Fix:**
  Introduce a countdown timer (`cooldownSeconds`) that disables the button for 60 seconds with a label such as `Resend available in 45s`.

#### [UI-01] Stale Success/Error Alerts Retained During Mode Transitions
* **File:** `components/LoginForm.tsx` (Lines 46–50)
* **Vulnerability Description:**
  When a login attempt fails with `code === "EMAIL_NOT_VERIFIED"`, the form sets `setIsVerificationNeeded(true)`, but does not clear `resendSuccess` or `resendError`. Any prior state from a previous session persists on screen.
* **Recommended Fix:**
  In `handleLoginSubmit`, explicitly call `setResendSuccess(null)` and `setResendError(null)` before entering the verification view.

#### [ROUT-01] Strict Pathname Match on `/verify-email` and API 307 Redirects
* **File:** `middleware.ts` (Lines 40, 74–80)
* **Vulnerability Description:**
  * Line 40 checks `pathname === "/verify-email"`. If an email client appends a trailing slash (`/verify-email/`), it fails this check and redirects the user to `/login` because it is missing from `isPublicPage`.
  * Unauthenticated requests to protected API endpoints receive a 307 redirect to `/login` HTML rather than a `401 Unauthorized` JSON response.
* **Recommended Fix:**
  * Use `pathname.startsWith("/verify-email")` and add it to `isPublicPage`.
  * For protected API paths (`pathname.startsWith("/api/")`), return `NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })`.

---

### 🔵 Low Severity & Code Quality

#### [BUG-02] Confusing "Re-register" Advice
* **File:** `components/LoginForm.tsx` (Lines 247, 316–320)
* **Description:** The verification banner advises users: *"Unverified accounts are deleted periodically. Please verify your email or re-register if needed."* However, `User` enforces a unique MongoDB index on `email`. Re-registering immediately triggers an `E11000 duplicate key error`.
* **Fix:** Update the copy to reflect that users should contact an administrator to clear pending unverified registrations.

#### [ERR-01] Database Outages Misclassified as HTTP 401 Unauthorized
* **File:** `app/api/login/route.ts` (Lines 46–52)
* **Description:** The `catch` block catches all exceptions (including MongoDB connection dropouts from `connectDB()`) and returns status 401 with `error.message`.
* **Fix:** Check if the error is an operational authentication failure; otherwise return status 500 with a generic server error message.

#### [INP-01] Non-String Email Input Handling
* **File:** `app/api/resend-verification/route.ts` (Line 14)
* **Description:** If a non-string payload is sent (e.g. `{ "email": 123 }`), calling `email.trim()` throws an unhandled `TypeError: email.trim is not a function`, leading to a 500 error.
* **Fix:** Guard with `if (typeof email !== "string" || !email.trim())`.

#### [DATA-01] Destructive Rollback of Active Verification Token
* **File:** `app/api/resend-verification/route.ts` (Lines 51–54)
* **Description:** When email sending fails, the token is set to `null`. If the user already had an active token from an earlier email, setting it to `null` permanently invalidates their previously working link.
* **Fix:** Retain the previous token value in memory and restore it upon error, or only persist the new token after email dispatch confirms success.

---

## 4. Implementation Safety Checklist

Applying these fixes will **not** disrupt normal operations (student login, faculty login, admin dashboards, or email verification), provided the following guidelines are followed:

1. **Do not import `jsonwebtoken` into `middleware.ts`**: Keep JWT parsing lightweight or use `jose` to avoid Edge Runtime incompatibilities.
2. **Keep the static asset regex comprehensive**: Ensure file extensions (`.png`, `.svg`, `.ico`, `.css`, `.js`) remain unblocked by middleware.
3. **Keep the resend cooldown at 60 seconds**: This provides sufficient protection against quota exhaustion while avoiding user friction.
4. **Preserve error logging on the server**: Continue logging detailed error traces with `console.error` while serving sanitized responses to end users.
