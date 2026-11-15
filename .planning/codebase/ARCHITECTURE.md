<!-- refreshed: 2026-11-15 -->
# Architecture

**Analysis Date:** 2026-11-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router (v15)                 │
├──────────────────┬──────────────────┬───────────────────────┤
│   Public Pages   │   Protected UI   │    API Routes         │
│  `app/page.tsx`  │  `app/*Dashboard/ │  `app/api/*/route.ts`│
│  `app/login/...` │   page.tsx`      │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware (Edge Runtime)                │
│  `middleware.ts` - JWT validation, role-based routing       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  `services/studentService.ts`  `services/facultyService.ts` │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  `lib/db.ts` (Mongoose connection pooling)                  │
│  `models/userModel.ts`  `models/submissionModel.ts`         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Middleware** | JWT validation, role-based route protection, token expiration check | `middleware.ts` |
| **Auth Library** | JWT signing/verification, session retrieval from cookies | `lib/auth.ts` |
| **DB Connection** | Mongoose connection pooling with global cache | `lib/db.ts` |
| **User Model** | Student/Faculty schema, password hashing, verification tokens | `models/userModel.ts` |
| **Submission Model** | Assignment submissions linking students to faculty | `models/submissionModel.ts` |
| **Student Service** | Query students for faculty dashboard with submission status | `services/studentService.ts` |
| **Faculty Service** | Query faculty teaching assignments for student dashboard | `services/facultyService.ts` |
| **Email Utility** | Multi-provider email dispatch (SMTP, Brevo, Resend) | `utils/sendEmail.ts` |
| **ZIP Utility** | Streaming ZIP builder for faculty submission downloads | `utils/zip.ts` |
| **Student Dashboard** | Course view, submission management, profile editing | `components/StudentDashboardClient.tsx` |
| **Faculty Dashboard** | Class management, student listing, assignment toggle | `components/FacultyDashboardClient.tsx` |
| **Admin Dashboard** | User directory, verification, deletion, filtering | `components/AdminDashboardClient.tsx` |

## Pattern Overview

**Overall:** Next.js App Router with Server Components + Client Components hybrid

**Key Characteristics:**
- **Server-first rendering**: Dashboard pages are Server Components that fetch data via `getUserSession()` and pass serialized props to Client Components
- **Middleware-driven auth**: All auth checks happen at Edge Runtime in `middleware.ts` before reaching page components
- **Role-based access control**: Three roles (student, faculty, admin) with distinct route protections
- **JWT in httpOnly cookies**: Session stored in `session` cookie, decoded in middleware and `lib/auth.ts`
- **Mongoose models with TypeScript interfaces**: Strong typing across data layer

## Layers

### Presentation Layer
- **Purpose**: UI rendering, user interaction, client-side state
- **Location**: `components/`, `app/*/page.tsx` (Server Components)
- **Contains**: React components, forms, dashboards, modals
- **Depends on**: Service layer via API routes
- **Used by**: Browser

### API Layer (Route Handlers)
- **Purpose**: HTTP endpoints for mutations and data fetching
- **Location**: `app/api/*/route.ts`
- **Contains**: RESTful handlers (GET, POST, PUT, DELETE)
- **Depends on**: Service layer, auth library, DB connection
- **Used by**: Client Components via `fetch()`

### Service Layer
- **Purpose**: Business logic, data aggregation, cross-model queries
- **Location**: `services/*.ts`
- **Contains**: `getStudentsForFaculty()`, `getFacultyForStudent()`
- **Depends on**: Models, DB connection
- **Used by**: API routes, Server Components

### Data Layer
- **Purpose**: Database connection, schema definitions, ORM
- **Location**: `lib/db.ts`, `models/*.ts`
- **Contains**: Mongoose connection pooling, User/Submission schemas
- **Depends on**: MongoDB driver, mongoose
- **Used by**: Service layer, API routes

### Utility Layer
- **Purpose**: Cross-cutting concerns (email, file processing, auth helpers)
- **Location**: `utils/*.ts`, `lib/auth.ts`
- **Contains**: `sendEmail`, `zip.ts`, `loginUser`, `createUser`, `signToken`
- **Depends on**: External SDKs (nodemailer, jsonwebtoken, bcrypt)
- **Used by**: All layers

## Data Flow

### Primary Request Path: Student Login → Dashboard

1. **Login Submission** (`app/api/login/route.ts:9-71`)
   - Validates credentials via `utils/loginUser.ts`
   - Checks `user.isVerified` (blocks unverified users)
   - Signs JWT via `lib/auth.ts:signToken()`
   - Sets httpOnly `session` cookie

2. **Middleware Validation** (`middleware.ts:24-128`)
   - Decodes JWT from cookie on every request
   - Checks token expiration
   - Enforces role-based route access (student/faculty/admin)
   - Redirects unauthorized users to appropriate login page

3. **Dashboard Data Fetch** (`app/studentDashboard/page.tsx:8-54`)
   - Server Component calls `getUserSession()` from `lib/auth.ts`
   - Fetches faculty list via `services/facultyService.ts`
   - Serializes data to plain objects for Client Component

4. **Client Rendering** (`components/StudentDashboardClient.tsx`)
   - Receives initial props, manages UI state
   - Fetches submissions via `/api/submissions` (GET)
   - Handles submission updates via `/api/submissions/update` (PUT)

### Secondary Flow: Faculty Download Submissions (Streaming ZIP)

1. **Request** (`app/api/faculty/download-submissions/route.ts:419-670`)
   - Validates faculty ownership of class
   - Supports pagination/batching for large classes
   - Returns `ReadableStream` with `application/zip`

2. **Stream Processing** (`utils/zip.ts:190-376`)
   - `ZipStreamBuilder` writes ZIP incrementally to stream controller
   - Small files (<20MB) buffered in memory via `addFile()`
   - Large files streamed via `addFileStream()` with data descriptors
   - CRC-32 computed incrementally via `CRC32Hasher`

3. **URL Resolution** (`app/api/faculty/download-submissions/route.ts:258-415`)
   - Google Drive URLs → virus-scan confirmation resolution
   - Google Docs/Sheets/Slides → export as DOCX/XLSX/PPTX
   - YouTube → `.url` shortcut fallback
   - Direct URLs → fetched with timeout

## Key Abstractions

**SessionUser Interface** (`lib/auth.ts:12-16`):
- Purpose: Typed JWT payload for authenticated requests
- Fields: `_id`, `email`, `role` ("student" | "faculty" | "admin")
- Used by: `verifyToken()`, `getUserSession()`, middleware

**ITeaching Interface** (`models/userModel.ts:4-10`):
- Purpose: Faculty teaching assignment configuration
- Fields: `year`, `section`, `subject`, `branch?`, `assignmentsEnabled?`
- Embedded in User document as array

**GroupedStudents Interface** (`services/studentService.ts:4-11`):
- Purpose: Faculty dashboard data structure
- Fields: `year`, `section`, `subject`, `branch`, `assignmentsEnabled`, `students[]`
- Each student includes nested `submission` object if exists

**ResolvedSubmission Union** (`app/api/faculty/download-submissions/route.ts:37-41`):
- Purpose: Represents outcome of URL resolution for ZIP
- Variants: `buffered`, `stream`, `fallback` (`.url` shortcut)

## Entry Points

| Entry Point | Location | Triggers | Responsibilities |
|-------------|----------|----------|------------------|
| **Home Page** | `app/page.tsx` | GET `/` | Marketing landing page with registration links |
| **Student Login** | `app/api/login/route.ts` | POST `/api/login` | Credential validation, JWT issuance |
| **Admin Login** | `app/api/admin/login/route.ts` | POST `/api/admin/login` | Env-based admin auth, JWT issuance |
| **Student Register** | `app/api/register/route.ts` | POST `/api/register` | Validation, user creation, verification email |
| **Faculty Register** | `app/api/faculty/register/route.ts` | POST `/api/faculty/register` | Security code check, user creation, verification email |
| **Email Verification** | `app/verify-email/page.tsx` | GET `/verify-email?token=` | Token validation, account activation |
| **Student Dashboard** | `app/studentDashboard/page.tsx` | GET `/studentDashboard` | Server fetch → Client render |
| **Faculty Dashboard** | `app/facultyDashboard/page.tsx` | GET `/facultyDashboard` | Server fetch → Client render |
| **Admin Dashboard** | `app/adminDashboard/page.tsx` | GET `/adminDashboard` | Server fetch → Client render |

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; no worker threads used
- **Global State:** Mongoose connection cached in `global.mongoose` (`lib/db.ts:23-27`); no other module-level singletons
- **Circular Imports:** None detected
- **Edge Runtime:** Middleware runs in Edge Runtime (no Node.js APIs); uses custom JWT decode (`middleware.ts:5-22`) instead of `jsonwebtoken`
- **Cookie-Based Auth:** JWT stored in httpOnly cookie; not in localStorage
- **Role Enforcement:** Middleware is single source of truth for route protection; API routes also check role for defense in depth

## Anti-Patterns

### Inline SVG Icons in Components
**What happens:** Components like `StudentDashboardClient.tsx` embed SVG icons directly in JSX (`components/StudentDashboardClient.tsx:211-213`)
**Why it's wrong:** Duplicates markup, increases bundle size, hard to maintain consistency
**Do this instead:** Extract to reusable `Icon` component or use `lucide-react` / `react-icons`

### Repeated Sidebar/Navigation Logic
**What happens:** `StudentDashboardClient`, `FacultyDashboardClient`, `AdminDashboardClient` each implement nearly identical sidebar, mobile drawer, navigation logic
**Why it's wrong:** Code duplication (~400 lines each), inconsistent behavior risk, maintenance burden
**Do this instead:** Extract shared `Sidebar`, `MobileDrawer`, `Navigation` components to `components/layout/`

### Inline Styles with CSS-in-JS (`<style jsx global>`)
**What happens:** Animation keyframes defined in each Client Component (`StudentDashboardClient.tsx:971-987`)
**Why it's wrong:** Duplicate CSS, no sharing, harder to debug
**Do this instead:** Move to `app/globals.css` or Tailwind `@keyframes` in `tailwind.config.js`

### Inconsistent Error Handling in API Routes
**What happens:** Some routes return 401 for auth errors, others 403; some use `error.message`, others hardcoded strings
**Why it's wrong:** Unpredictable client behavior, harder debugging
**Do this instead:** Create `lib/apiError.ts` with `ApiError` class and standard handlers

### Direct Mongoose in API Routes
**What happens:** Some API routes call `User.findById()` directly instead of using service layer (`app/api/admin/users/verify/route.ts:31`)
**Why it's wrong:** Bypasses service layer abstraction, scatters query logic
**Do this instead:** Route all DB access through `services/` or model static methods

## Error Handling

**Strategy:** Layered with middleware as first line, API routes as second, client as third

**Patterns:**
- **Middleware** (`middleware.ts:84-99`): Returns 401 JSON for API routes, redirects for pages
- **API Routes**: Try/catch with `isAuthError` detection (`app/api/login/route.ts:50-69`) returning 401 vs 500
- **Services**: Throw errors; callers handle HTTP status mapping
- **Client Components**: `try/catch` with `setError()` state for toast/modal display
- **Email Utility** (`utils/sendEmail.ts:33-168`): Multi-provider fallback chain with detailed error categorization

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` with `[ZIP]`, `[Nodemailer SMTP]` prefixes for traceability (`utils/sendEmail.ts:49`, `app/api/faculty/download-submissions/route.ts:362`)

**Validation:**
- **Middleware**: Path-based allowlist + JWT decode
- **API Routes**: Zod-free manual validation with early returns
- **Models**: Mongoose schema validation (required, enum, unique)

**Authentication:** JWT in httpOnly cookie, 1-day expiry, role claim; verified in middleware and `lib/auth.ts:verifyToken()`

**Authorization:** Three-role system (student, faculty, admin) with route prefixes (`/studentDashboard`, `/facultyDashboard`, `/adminDashboard`) protected by middleware

---

*Architecture analysis: 2026-11-15*