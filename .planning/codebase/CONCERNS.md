<!-- refreshed: 2026-11-15 -->
# Codebase Concerns

**Analysis Date:** 2026-11-15

## Tech Debt

### 1. No Automated Testing Infrastructure
- **Issue:** Zero test files found. No Jest, Vitest, or other test runner configured. No CI pipeline for testing.
- **Files:** `package.json` (no test scripts), missing `jest.config.*`/`vitest.config.*`
- **Impact:** No regression protection. Any refactor risks breaking auth, submissions, or admin features silently.
- **Fix approach:** Add Vitest (fast, native TS support) with `@testing-library/react` for components. Target critical paths first: auth (login, registration, verification), submission CRUD, admin actions.

### 2. TypeScript Strict Mode Disabled
- **Issue:** `"strict": false` in `tsconfig.json` (line 11). Allows implicit `any`, loose null checks, and unsafe operations.
- **Files:** `tsconfig.json`
- **Impact:** Runtime type errors possible. E.g., `getUserSession()` returns `Promise<any | null>` (line 38, `lib/auth.ts`) instead of proper `SessionUser | null`.
- **Fix approach:** Enable `"strict": true`, then fix cascading errors. Start with `lib/auth.ts` return types and API route response typing.

### 3. Massive Client Components with Inline Styles
- **Issue:** `StudentDashboardClient.tsx` (990 lines), `AdminDashboardClient.tsx` (841 lines), `FacultyDashboardClient.tsx` (665 lines) — all single-file components with embedded CSS animations via `<style jsx global>`.
- **Files:** `components/StudentDashboardClient.tsx`, `components/AdminDashboardClient.tsx`, `components/FacultyDashboardClient.tsx`
- **Impact:** Hard to maintain, test, or reuse. Style collisions possible via global CSS-in-JS. Bundle size inflated.
- **Fix approach:** Extract reusable UI primitives (Button, Card, Modal, Table, Badge, Avatar) into `components/ui/`. Move animations to Tailwind config or CSS modules. Split dashboards into sub-components (`StudentSidebar`, `SubmissionsTable`, `ProfileForm`, etc.).

### 4. Duplicated Dashboard Layout Logic
- **Issue:** `StudentDashboardClient`, `FacultyDashboardClient`, and `AdminDashboardClient` each reimplement: sidebar with mobile drawer, header with avatar, tab navigation, logout link, animated backgrounds.
- **Files:** Three dashboard client components (see above)
- **Impact:** Bug fixes (e.g., mobile menu z-index) must be applied in 3 places. Inconsistent UX likely.
- **Fix approach:** Create `DashboardLayout` wrapper component accepting `navigationItems`, `user`, `role`, `children`. Extract `MobileDrawer`, `SidebarNav`, `UserAvatar` as shared components.

### 5. In-Memory ZipStreamBuilder with No Backpressure Handling
- **Issue:** `ZipStreamBuilder` (in `utils/zip.ts`) writes directly to `ReadableStreamDefaultController` without checking `desiredSize` or awaiting `drain`. On slow clients or large files, this buffers unbounded in memory.
- **Files:** `utils/zip.ts` (lines 190-376), `app/api/faculty/download-submissions/route.ts` (lines 576-650)
- **Impact:** Memory spikes under load. Vercel 54s timeout may kill requests mid-stream, leaving partial ZIPs.
- **Fix approach:** Implement backpressure: `if (controller.desiredSize <= 0) await new Promise(r => controller.signal.addEventListener('drain', r))` or use `writableStrategy.highWaterMark`. Consider offloading ZIP generation to a background job (e.g., queue + signed URL) for large batches.

### 6. Admin Credentials in Environment with Weak Default
- **Issue:** `app/api/admin/login/route.ts` lines 11-12 use fallback `"Admin@123456"` if `ADMIN_PASSWORD` not set.
- **Files:** `app/api/admin/login/route.ts`
- **Impact:** If env var missing in production, admin panel secured by known default password.
- **Fix approach:** Remove fallback. Throw on startup if `ADMIN_EMAIL`/`ADMIN_PASSWORD` unset. Consider OAuth/SSO for admin instead of shared password.

### 7. No Rate Limiting on Auth Endpoints
- **Issue:** `/api/login`, `/api/register`, `/api/forgot-password`, `/api/resend-verification` have no rate limiting. `resend-verification` has 60s cooldown but client-enforced only.
- **Files:** Multiple API routes in `app/api/`
- **Impact:** Brute-force, credential stuffing, email enumeration, and DoS via email sending (costs money on providers).
- **Fix approach:** Add middleware (e.g., `@vercel/kv` + sliding window) or edge middleware. Apply to all auth endpoints. Return `429` with `Retry-After` header.

### 8. Google Drive Download Logic Fragile and Complex
- **Issue:** `app/api/faculty/download-submissions/route.ts` (lines 44-165) contains 120+ lines of HTML parsing, form action extraction, confirm token handling, and fallback strategies for Google Drive virus-scan pages.
- **Files:** `app/api/faculty/download-submissions/route.ts`
- **Impact:** Breaks when Google changes HTML. No tests. Silent fallback to `.url` shortcuts loses file content. Timeout handling incomplete (only initial response).
- **Fix approach:** Use official Google Drive API with service account (requires domain-wide delegation) for reliable downloads. If not possible, extract to separate module with unit tests against saved HTML fixtures. Add circuit breaker.

### 9. Submission Update Allows Changing Faculty/Subject Implicitly
- **Issue:** `app/api/submissions/update/route.ts` (lines 27-67) verifies `assignmentsEnabled` but does not re-verify that the student still belongs to that faculty's class (year/section/subject match). A student could potentially update a submission for a class they no longer belong to if faculty disabled assignments after submission.
- **Files:** `app/api/submissions/update/route.ts`
- **Impact:** Data integrity issue. Student could modify submissions for classes they've been removed from.
- **Fix approach:** Re-validate `user.yearOfStudy`, `user.section` against `faculty.teaching` match on every update. Or store `matchedTeaching` snapshot on submission create.

### 10. No Database Indexes Defined
- **Issue:** Mongoose models (`models/userModel.ts`, `models/submissionModel.ts`) define no explicit indexes. Queries like `Submission.find({ studentId, facultyId, subject })` (line 42, `app/api/assignments/submit/route.ts`) and `User.findOne({ email })` rely on implicit `_id` index only.
- **Files:** `models/userModel.ts`, `models/submissionModel.ts`
- **Impact:** Full collection scans as data grows. Slow queries on `facultyId + studentYear + studentSection + subject` (download endpoint).
- **Fix approach:** Add compound indexes:
  - `User`: `email` (unique exists), `role + isVerified`
  - `Submission`: `{ studentId: 1, facultyId: 1, subject: 1 }`, `{ facultyId: 1, studentYear: 1, studentSection: 1, subject: 1 }`

---

## Known Bugs

### 1. Admin Dashboard "Delete User" Removes Submissions Without Warning
- **Bug:** `app/api/admin/users/delete/route.ts` (lines 50-53) deletes ALL submissions where `studentId` OR `facultyId` matches. If deleting a faculty, their students' submissions vanish.
- **Trigger:** Admin clicks "Delete" on unverified faculty user.
- **Workaround:** None. Check submissions count before delete.
- **Fix:** Soft-delete users (`deletedAt` field) or cascade only student's own submissions. Show confirmation with submission count impact.

### 2. Student Profile Update Triggers Full Page Reload
- **Bug:** `components/StudentDashboardClient.tsx` line 144 and `components/FacultyDashboardClient.tsx` line 106 use `window.location.reload()` after profile save.
- **Trigger:** Any profile edit (name, year, section, branch).
- **Impact:** Loses client state (open tabs, scroll position). Flicker. Defeats SPA benefits.
- **Fix:** Use `router.refresh()` (Next.js 15) to re-fetch server data without full reload. Update `currentUser` state from response.

### 3. Faculty Classes List `assignmentsMap` State Not Synced with Server on Load
- **Bug:** `FacultyClassesList.tsx` lines 29-35 initializes `assignmentsMap` from initial `classes` prop. If another faculty member toggles same class (not possible currently) or server state changes, UI stale.
- **Impact:** Toggle switch shows wrong state until page refresh.
- **Fix:** Fetch assignments status on mount or use server-fetched `teaching` array directly (already has `assignmentsEnabled`).

### 4. Verification Token Reuse Logic Race Condition
- **Bug:** `app/api/resend-verification/route.ts` lines 33-63 checks `verificationTokenExpires > now && (expires - now) > 300000` (5 min remaining). If token has 4 min left, it's considered expired and new token generated. But if email send fails (line 80-90), it rolls back to `previousToken` which may have been the new token just generated, not the original.
- **Trigger:** Email provider failure after new token generated.
- **Fix:** Save original token before generating new one. Roll back to original on failure.

### 5. Submission Edit Modal Doesn't Validate Video URL Format
- **Bug:** `StudentDashboardClient.tsx` lines 922-930 accepts any string for `videoUrl`. No validation for YouTube, Drive, or valid URL.
- **Impact:** Broken links stored. Download ZIP fails with `MALFORMED_URL` fallback.
- **Fix:** Add client + server validation (regex or `new URL()` check). Allow known providers.

---

## Security Considerations

### 1. JWT Secret Fallback in Development
- **Risk:** `lib/auth.ts` line 6: `process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "secret_key")`. In development, uses hardcoded `"secret_key"`.
- **Files:** `lib/auth.ts`
- **Current mitigation:** Only affects dev. Production requires env var.
- **Recommendation:** Remove fallback entirely. Require `JWT_SECRET` in all environments. Generate strong secret: `openssl rand -hex 32`.

### 2. No Password Complexity Requirements
- **Risk:** `app/api/register/route.ts` and `app/api/faculty/register/route.ts` only check `password?.trim()`. No min length, complexity, or breach check (HaveIBeenPwned).
- **Files:** Registration routes
- **Impact:** Weak passwords (e.g., "123456") accepted.
- **Recommendation:** Enforce min 12 chars. Add `zxcvbn` or `haveibeenpwned` check. Reject common passwords.

### 3. Admin Login Uses Direct Password Comparison (No Bcrypt)
- **Risk:** `app/api/admin/login/route.ts` line 18: `password !== expectedPassword`. Admin password stored in plaintext in env. No hashing.
- **Files:** `app/api/admin/login/route.ts`
- **Impact:** If env leaked, admin password exposed. No protection against timing attacks (string comparison).
- **Recommendation:** Store bcrypt hash of admin password in env or DB. Use `bcrypt.compare`. Add constant-time comparison.

### 4. Email Verification Token in Query String (URL)
- **Risk:** `utils/sendEmail.ts` line 175: `verificationLink = `${baseUrl}/verify-email?token=${token}``. Token exposed in browser history, referrer headers, server logs.
- **Files:** `utils/sendEmail.ts`, `app/verify-email/page.tsx`
- **Impact:** Token theft via Referer header when user clicks external links on verify page. Should use POST or short-lived one-time codes.
- **Recommendation:** Use short-lived (15 min) one-time code via POST to `/api/verify-email` with token in body. Or store token in secure httpOnly cookie.

### 5. Password Reset Token in Query String
- **Risk:** `utils/sendEmail.ts` line 194: `resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}``. Both token and email in URL.
- **Files:** `utils/sendEmail.ts`, `app/reset-password/page.tsx`
- **Impact:** Same as above. Email enumeration via reset page.
- **Recommendation:** Same as verification. Use POST with token in body.

### 6. No CSRF Protection on State-Changing Endpoints
- **Risk:** All POST/PUT/DELETE endpoints (login, register, submissions, admin actions) accept requests from any origin. Cookies are `SameSite: "lax"` (line 36, `app/api/login/route.ts`) which allows top-level navigations.
- **Files:** All API routes
- **Impact:** CSRF attacks possible via malicious form submits. Admin actions (verify, delete users) vulnerable.
- **Recommendation:** Implement CSRF tokens (double-submit cookie pattern) or require custom header (`x-requested-with`) validated in middleware. Use `SameSite: "strict"` for session cookie.

### 7. Faculty Registration Code Compared Client-Side in API
- **Risk:** `app/api/faculty/register/route.ts` lines 24-31: `facultyCode.trim() !== cleanServerCode`. Code sent in request body, compared in plaintext.
- **Files:** `app/api/faculty/register/route.ts`
- **Impact:** If HTTPS terminated early (load balancer), code visible in logs. No rate limit on attempts.
- **Recommendation:** Hash `FACULTY_CODE` with bcrypt. Compare hash. Add rate limit (5 attempts/hour per IP).

### 8. Student Submissions Accessible via Predictable IDs
- **Risk:** `app/api/submissions/update/route.ts` line 28: `Submission.findOne({ _id: submissionId, studentId: user._id })`. But `_id` is MongoDB ObjectId (predictable-ish). No authorization check beyond ownership.
- **Files:** `app/api/submissions/update/route.ts`
- **Impact:** If ObjectId guessed, student could access other students' submissions? No, query filters by `studentId`. But faculty download endpoint uses `facultyId` + class filters.
- **Recommendation:** Current ownership check is correct. Ensure all endpoints validate ownership.

### 9. No Security Headers (CSP, HSTS, X-Frame-Options)
- **Risk:** `next.config.js` minimal. No CSP, no `X-Frame-Options`, no `Referrer-Policy`.
- **Files:** `next.config.js`
- **Impact:** Clickjacking, MIME sniffing, referrer leakage.
- **Recommendation:** Add `next.config.js` headers:
  ```js
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com https://api.brevo.com;" }
      ]
    }]
  }
  ```

---

## Performance Bottlenecks

### 1. Admin Data Endpoint Loads All Users Unpaginated
- **Problem:** `app/api/admin/data/route.ts` lines 21-46 fetches ALL faculty and ALL students, maps entire collections in memory. `studentsByYear` builds nested objects for every student.
- **Files:** `app/api/admin/data/route.ts`
- **Impact:** O(N) memory and CPU. Fails at ~10k users. Response size grows unbounded.
- **Improvement path:** Add pagination (`limit`, `offset`), filtering (`year`, `section`, `verified`), and cursor-based pagination for infinite scroll. Return counts separately.

### 2. Student Dashboard Fetches Submissions on Every Tab Switch
- **Problem:** `StudentDashboardClient.tsx` line 105-107: `useEffect(() => { fetchSubmissions() }, [activeTab])`. Re-fetches on every tab change.
- **Files:** `components/StudentDashboardClient.tsx`
- **Impact:** Unnecessary network requests. Loading spinner flashes.
- **Improvement path:** Cache submissions in state. Only refetch on explicit "Refresh" click or mutation (submit/update). Use SWR or React Query for caching.

### 3. Faculty Download Submissions Processes Files Sequentially with No Concurrency Control
- **Problem:** `app/api/faculty/download-submissions/route.ts` lines 584-625: `for (const sub of submissions) { await resolveSubmission(...) }`. Sequential. 8 files per batch but each file fetched serially.
- **Files:** `app/api/faculty/download-submissions/route.ts`
- **Impact:** Slow. 8 files × 30s timeout = 4 min max. Vercel kills at 54s.
- **Improvement path:** Use `Promise.allSettled` with concurrency limit (e.g., `p-limit` or custom pool of 3). Stream ZIP while downloads in progress.

### 4. Google Drive Downloads Fetch Entire File to Check Content-Type
- **Problem:** `resolveSubmission` (line 296) does `fetch(targetUrl)` then checks `content-type`. For large files, this downloads headers only (good), but if HTML returned, downloads full HTML body (`res.text()` line 316) before falling back.
- **Files:** `app/api/faculty/download-submissions/route.ts`
- **Impact:** Wasted bandwidth on virus-scan pages.
- **Improvement path:** Use `HEAD` request first to check `Content-Type`. Only `GET` if not HTML. Or range request `bytes=0-1023` to sniff.

### 5. No Database Connection Pooling Configuration
- **Problem:** `lib/db.ts` uses default Mongoose pool (100 connections). No `maxPoolSize` tuned for serverless (Vercel).
- **Files:** `lib/db.ts`
- **Impact:** Connection exhaustion under burst. Cold starts create new connections.
- **Improvement path:** Set `maxPoolSize: 10` for serverless. Use `bufferCommands: false` (already set). Consider MongoDB Atlas Data API for serverless.

---

## Fragile Areas

### 1. FacultyClassesList Download Modal State Machine Complex
- **Files:** `components/FacultyClassesList.tsx` lines 37-164 (`downloadModal` state, `startAutoDownload`, abort logic)
- **Why fragile:** Multiple async steps (meta fetch → batch loop → blob → download). Race conditions between abort, error, completion. `abortDownloadRef` mutable ref not in React state.
- **Safe modification:** Extract to custom hook `useBatchDownload`. Use state machine library (xstate) or explicit enum states. Add integration test with mocked fetch.

### 2. ZipStreamBuilder CRC32 Implementation Dual-Path
- **Files:** `utils/zip.ts` lines 36-60 (`CRC32Hasher` class with native `zlib.crc32` and JS fallback)
- **Why fragile:** Native `zlib.crc32` behavior differs across Node versions. Fallback must match exactly. Comment claims "both paths produce identical results" but untested.
- **Safe modification:** Add unit test vectors (known CRC32 values). Pin Node version in `package.json` `"engines": { "node": ">=22" }` to guarantee native.

### 3. Google Drive HTML Parsing Regex
- **Files:** `app/api/faculty/download-submissions/route.ts` lines 111-165 (`resolveGDriveConfirmation`)
- **Why fragile:** Regex on HTML. Google changes markup → silent fallback to `.url` files. No alerting.
- **Safe modification:** Add monitoring: log `GOOGLE_CONFIRMATION_FAILED` count. Alert if > threshold. Write integration test with saved HTML fixtures.

### 4. Submission Update Faculty Teaching Match Logic
- **Files:** `app/api/submissions/update/route.ts` lines 49-54, `app/api/assignments/submit/route.ts` lines 29-31
- **Why fragile:** Two different match algorithms:
  - Submit: `t.year === user.yearOfStudy && t.section === user.section` (ignores subject!)
  - Update: matches year + section + subject (case-insensitive)
- **Safe modification:** Centralize matching logic in `utils/getMatchedTeaching.ts`. Use same function everywhere. Add test cases.

### 5. Admin Dashboard Collapsible Sections State Keyed by String
- **Files:** `components/AdminDashboardClient.tsx` lines 60-68 (`isSectionOpen`, `toggleSection` using `${year}-${secKey}`)
- **Why fragile:** String keys. If section name has special chars, collision. No TypeScript enforcement.
- **Safe modification:** Use `Map<{year: number, section: string}, boolean>` or nested object `{ [year]: { [section]: boolean } }`. Type it.

---

## Scaling Limits

### 1. Vercel Hobby 60s Function Timeout
- **Current capacity:** `MAX_SAFE_RUNTIME_MS = 54_000` (line 20, download route). Batches of 8 submissions.
- **Limit:** ~8-16 submissions per ZIP download. Larger classes require multiple manual downloads.
- **Scaling path:** Move ZIP generation to background job (queue → worker → signed S3/R2 URL). Return job ID, poll for completion.

### 2. In-Memory Zip Building Limits Concurrent Downloads
- **Current capacity:** Each download holds file buffers/streams in Node memory.
- **Limit:** ~50MB per request before OOM on 1GB Vercel function. 10 concurrent = 500MB.
- **Scaling path:** Stream directly to object storage (R2/S3) using multipart upload. Return presigned URL.

### 3. Admin Dashboard Single-Page Load All Data
- **Current capacity:** Fetches all users. Works up to ~2k users.
- **Limit:** Response > 5MB, UI freezes rendering 2k rows.
- **Scaling path:** Virtualized tables (`@tanstack/react-virtual`). Server-side pagination/filtering.

### 4. Email Sending Sequential Fallback Chain
- **Current capacity:** `dispatchEmail` tries Nodemailer → Brevo SMTP → Brevo API → Resend sequentially.
- **Limit:** 4 × 5s timeout = 20s max per email. Under load, queue backs up.
- **Scaling path:** Fire-and-forget via queue (Redis/BullMQ). Return immediately. Track delivery status async.

---

## Dependencies at Risk

### 1. `next@15.5.20` - Pre-release/Canary Version
- **Risk:** Version `15.5.20` suggests canary/pre-release. Breaking changes likely. No LTS.
- **Impact:** Next.js 15 App Router APIs unstable. `cookies()` async (line 39, `lib/auth.ts`) changed in 15.
- **Migration plan:** Pin to latest stable (`14.2.x` or `15.0.x` when stable). Test all App Router features.

### 2. `mongoose@9.3.0` - Major Version 9
- **Risk:** Mongoose 9 dropped Node 18 support. Requires Node 20+. Breaking changes in `pre` hooks, `connect()`.
- **Impact:** `userSchema.pre("save")` (line 75, `userModel.ts`) may behave differently.
- **Migration plan:** Lock Node 22 in `package.json` `"engines"`. Test all model hooks.

### 3. `bcrypt@6.0.0` - Native Module
- **Risk:** Native addon. Fails on some serverless platforms (Vercel supports but cold start slower). Version 6 requires Node 18+.
- **Impact:** `npm install` fails if `python3`/`make` missing. Deployment issues.
- **Migration plan:** Consider `@node-rs/bcrypt` (Rust, no native build) or `bcryptjs` (pure JS, slower but universal).

### 4. `nodemailer@8.0.5` - Major Version 8
- **Risk:** Breaking API changes from v7. `createTransport` options changed.
- **Impact:** `utils/sendEmail.ts` uses `nodemailer.createTransport` (line 9, 66, 78). May break on upgrade.
- **Migration plan:** Pin version. Test email sending on upgrade.

---

## Missing Critical Features

### 1. Audit Logging for Admin Actions
- **Problem:** No record of admin verify/delete actions. `app/api/admin/users/verify/route.ts` and `delete/route.ts` only return success.
- **Blocks:** Compliance, debugging, accountability.
- **Needed:** `AuditLog` model: `{ adminId, action, targetUserId, timestamp, metadata }`. Write on every admin mutation.

### 2. Submission File Type Validation
- **Problem:** `videoUrl` accepts any string. No validation that URL points to video/document.
- **Blocks:** Faculty download ZIP gets `.url` shortcuts for invalid links. Waste of bandwidth.
- **Needed:** URL validation on submit. HEAD request to check `Content-Type` matches allowed (video/*, application/pdf, etc.).

### 3. Bulk Student Import (CSV/Excel)
- **Problem:** Students must register individually. No admin bulk create.
- **Blocks:** Onboarding large cohorts (100s of students).
- **Needed:** Admin upload CSV → parse → create unverified users → send verification emails in batch.

### 4. Assignment Deadlines / Scheduling
- **Problem:** `assignmentsEnabled` is boolean toggle. No start/end dates, no late submission handling.
- **Blocks:** Real-world usage where assignments have deadlines.
- **Needed:** Add `assignmentOpenAt`, `assignmentCloseAt` to teaching schema. Enforce on submit/update.

### 5. Email Template Customization
- **Problem:** Verification/reset emails hardcoded HTML in `sendEmail.ts` (lines 177-184, 196-204).
- **Blocks:** Branding, localization, custom instructions.
- **Needed:** Template system (Handlebars/React Email). Admin configurable templates.

---

## Test Coverage Gaps

### 1. Zero Unit Tests
- **What's not tested:** All utility functions (`createUser`, `loginUser`, `sendEmail`, `zip.ts`), auth logic, model hooks.
- **Files:** Entire codebase
- **Risk:** Any refactor breaks silently.
- **Priority:** High
- **Start with:** `utils/createUser.ts` (pure function), `utils/loginUser.ts`, `lib/auth.ts` (sign/verify), `utils/zip.ts` (CRC32, ZipStreamBuilder)

### 2. Zero Integration Tests
- **What's not tested:** API routes (login, register, submissions, admin), DB operations, email sending.
- **Files:** `app/api/**/*.ts`
- **Risk:** DB schema changes break endpoints. Auth flow broken.
- **Priority:** High
- **Start with:** `app/api/login/route.ts`, `app/api/register/route.ts`, `app/api/submissions/route.ts`

### 3. Zero E2E Tests
- **What's not tested:** Critical user journeys: student register → verify → login → submit → edit; faculty register → add class → toggle → download; admin login → verify user → delete user.
- **Files:** N/A
- **Risk:** Full flow regressions undetected.
- **Priority:** Medium
- **Tool:** Playwright or Cypress.

### 4. Google Drive Download Logic Untested
- **What's not tested:** `resolveGDriveConfirmation`, `determineFileExtension`, HTML parsing.
- **Files:** `app/api/faculty/download-submissions/route.ts`
- **Risk:** Silent fallback to `.url` files. No alerting.
- **Priority:** High
- **Approach:** Save real Google Drive HTML responses as fixtures. Test parser against them.

### 5. ZipStreamBuilder Edge Cases Untested
- **What's not tested:** Large file streaming, data descriptor correctness, CRC32 matching, truncated stream handling, empty ZIP, Unicode filenames.
- **Files:** `utils/zip.ts`
- **Risk:** Corrupt ZIPs downloaded by faculty.
- **Priority:** High
- **Approach:** Test with known ZIP test vectors. Verify with `unzip -t`.

---

*Concerns audit: 2026-11-15*