<!-- refreshed: 2026-11-15 -->
# Coding Conventions

**Analysis Date:** 2026-11-15

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `LoginForm.tsx`, `StudentDashboardClient.tsx`)
- Client components: Suffix with `Client` (e.g., `StudentDashboardClient.tsx`, `FacultyDashboardClient.tsx`, `AdminDashboardClient.tsx`)
- Utility functions: camelCase with `.ts` extension (e.g., `createUser.ts`, `loginUser.ts`, `sendEmail.ts`, `zip.ts`)
- API routes: `route.ts` under `app/api/<resource>/` directory
- Mongoose models: PascalCase with `Model` suffix in filename (e.g., `userModel.ts`, `submissionModel.ts`)
- Types/interfaces: PascalCase (e.g., `IUser`, `ISubmission`, `SessionUser`, `CreateUserInput`)

**Functions:**
- Named exports for utilities: camelCase (e.g., `createUser`, `loginUser`, `sendVerificationEmail`, `signToken`, `verifyToken`, `getUserSession`)
- React components: PascalCase function declarations (e.g., `function LoginForm()`, `function StudentDashboardClient()`)
- API route handlers: Named exports matching HTTP method (e.g., `export async function GET()`, `export async function POST()`, `export async function PUT()`)
- Mongoose pre-save hooks: Anonymous functions with descriptive comments

**Variables:**
- State variables: camelCase with descriptive names (e.g., `isForgotMode`, `isVerificationNeeded`, `forgotLoading`, `cooldownSeconds`)
- React hooks: camelCase prefixed with `use` for custom hooks (none observed)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `JWT_SECRET`, `MONGO_DB_URI`, `BATCH_SIZE`)
- Form state objects: camelCase keys matching API payload (e.g., `profileForm`, `submissionForm`, `addClassForm`)

**Types:**
- Interfaces: PascalCase with `I` prefix for Mongoose documents (e.g., `IUser`, `ISubmission`, `ITeaching`)
- Type aliases: PascalCase (e.g., `SessionUser`, `UserType`, `CreateUserInput`, `FacultyItem`, `StudentItem`)
- Props interfaces: PascalCase with `Props` suffix (e.g., `StudentDashboardClientProps`, `FacultyDashboardClientProps`, `AdminDashboardClientProps`)

## Code Style

**Formatting:**
- No Prettier/ESLint config detected in project root
- TypeScript configured with `strict: false` in `tsconfig.json`
- Path aliases: `@/*` maps to `./*`
- Indentation: 2 spaces (consistent across files)
- Semicolons: Used consistently
- Quotes: Single quotes for strings, double quotes for JSX attributes
- Trailing commas: Used in multiline objects/arrays

**Linting:**
- No ESLint config file in project root (only in node_modules)
- No Biome config detected

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party libraries)
2. Internal aliases (`@/lib/`, `@/models/`, `@/utils/`, `@/components/`)
3. Relative imports (`../../../lib/db`, `../../models/userModel`)

**Path Aliases:**
- `@/*` → `./*` (configured in `tsconfig.json`)
- Usage observed: `@/lib/auth`, `@/lib/db`, `@/models/userModel`, `@/utils/createUser`, etc.

**Example from `app/api/login/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "../../../lib/db";
import { loginUser } from "../../../utils/loginUser";
import { signToken } from "../../../lib/auth";
```

## Error Handling

**Patterns:**
- API routes use try/catch with structured error responses
- Success response format: `{ success: true, ...data }`
- Error response format: `{ success: false, message: string, code?: string }`
- Status codes:
  - `400` - Validation errors (missing/invalid fields)
  - `401` - Authentication errors (invalid credentials, unauthorized)
  - `403` - Authorization errors (email not verified)
  - `429` - Rate limiting (resend verification cooldown)
  - `500` - System errors (DB connection, email failures)

**Error Classification (from `app/api/login/route.ts`):**
```typescript
const isAuthError = error.message && (
  error.message.includes("Invalid") ||
  error.message.includes("not found") ||
  error.message.includes("incorrect") ||
  error.message.includes("credentials") ||
  error.message.includes("unauthorized")
);
```

**Async Error Handling:**
- All async operations wrapped in try/catch
- `console.error` used for logging with descriptive prefix (e.g., `"Login API Error:"`, `"Student Registration API Error:"`)
- Specific error messages returned to client; stack traces not exposed

**Utility Functions:**
- Throw `Error` with descriptive messages (e.g., `throw new Error("User not found")`, `throw new Error("Invalid password")`)
- Callers responsible for catching and converting to HTTP responses

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.error` for errors with context prefix: `console.error("Login API Error:", error)`
- `console.warn` for fallback attempts: `console.warn("Nodemailer SMTP dispatch failed, trying fallback services:", smtpErr)`
- `console.log` for success/debug: `console.log(`[Nodemailer SMTP] Email sent successfully to ${email}`)`
- No log levels, no structured JSON logging

## Comments

**When to Comment:**
- JSDoc-style comments for complex utility functions (e.g., `ZipStreamBuilder` class in `utils/zip.ts`)
- Inline comments for non-obvious logic (e.g., CRC-32 implementation details, bit flag explanations)
- Section headers in large components (e.g., `/* --- STANDARD LOGIN VIEW --- */` in `LoginForm.tsx`)
- No TSDoc/JSDoc on standard React components or API routes

**JSDoc/TSDoc:**
- Used extensively in `utils/zip.ts` for `ZipStreamBuilder` class and methods
- Used for Mongoose schema definitions (e.g., `userModel.ts` interfaces)
- Not used for React components or API route handlers

## Function Design

**Size:**
- API route handlers: 30-80 lines (focused on single operation)
- Utility functions: 10-50 lines (single responsibility)
- React components: 150-500 lines (large client components with multiple state pieces)

**Parameters:**
- Destructuring for objects: `export function createUser({ fullname, email, password, ... }: CreateUserInput)`
- Optional parameters with defaults: `role = "student"`, `rollNumber = null`
- TypeScript interfaces for complex parameter objects

**Return Values:**
- API routes: `NextResponse.json()` with consistent shape
- Utilities: Typed return values (Promise for async, direct for sync)
- React components: JSX.Element

## Module Design

**Exports:**
- Named exports for utilities: `export function createUser()`, `export const sendVerificationEmail = async ...`
- Default exports for Mongoose models: `export default User`
- Default exports for React components: `export default function LoginForm()`
- Named exports for types: `export interface IUser`, `export type UserType = ...`

**Barrel Files:**
- No index.ts barrel files detected
- Direct imports from source files

## React Patterns

**Client Components:**
- `"use client"` directive at top of file
- Props interfaces defined locally or imported
- Initial data passed via props (`initialUser`, `initialFacultyList`, `classes`)
- State managed with `useState`, `useEffect`
- Event handlers prefixed with `handle` (e.g., `handleLoginSubmit`, `handleProfileSubmit`)

**State Management:**
- Local component state only (no Redux, Zustand, Context observed)
- Multiple `useState` calls for related state groups
- Optimistic UI updates with rollback on error (e.g., `FacultyClassesList.tsx` toggle)
- Form state as single object with `setForm({ ...form, field: value })` pattern

**Data Fetching:**
- Client-side `fetch()` calls to API routes
- Loading/error/success state triads for each operation
- `useEffect` for initial data load
- Manual refetch functions (e.g., `fetchSubmissions()`, `fetchData()`)

**Event Handling:**
- `e.preventDefault()` on form submits
- Inline arrow functions for simple handlers
- Named async functions for complex handlers
- `disabled` prop on buttons during loading

## API Route Patterns

**Structure:**
```
app/api/<resource>/<action>/route.ts
```

**Common Patterns:**
- `export const dynamic = "force-dynamic"` for auth-protected routes
- `await connectDB()` at start of handler
- `await getUserSession()` for authentication
- Role checks: `user.role !== "student"` → 401
- Mongoose `.populate()` for references
- `.sort({ updatedAt: -1 })` for recent-first ordering

**Request Parsing:**
- `const body = await req.json()` or `const { field } = await req.json()`
- Validation before database operations
- Early returns for validation failures

## Database Patterns

**Mongoose:**
- Models in `models/` directory
- Interfaces extend `Document`
- Schema definitions with TypeScript generics: `Schema<IUser>`
- Pre-save middleware for password hashing
- `timestamps: true` for createdAt/updatedAt
- Subdocuments with `_id: false` for nested arrays
- `mongoose.models.Model || mongoose.model()` pattern for hot-reload safety

**Connection Management:**
- Cached connection in `global.mongoose` (see `lib/db.ts`)
- `bufferCommands: false` to fail fast
- Single `connectDB()` function exported as default

## Authentication Patterns

**JWT:**
- `jsonwebtoken` package
- Token payload: `{ _id, email, role }`
- 1-day expiry
- Stored in httpOnly cookie named `session`
- Middleware decodes JWT without verification (edge runtime compatible)

**Session:**
- `getUserSession()` in `lib/auth.ts` reads cookie, verifies token, fetches user
- Admin users handled specially (no DB lookup)
- Role-based redirects in middleware

**Middleware:**
- Single `middleware.ts` at root
- Path-based protection with `matcher` config
- Public paths allowlisted
- Role-specific path protection
- Token expiry check with redirect to login

## Email Patterns

**Multi-provider Fallback (from `utils/sendEmail.ts`):**
1. Primary: Nodemailer SMTP (Gmail or custom)
2. Fallback 1: Brevo (SMTP Relay or REST API)
3. Fallback 2: Resend API
- IPv4 DNS preference forced: `dns.setDefaultResultOrder("ipv4first")`
- Connection/socket timeouts (5s)
- Detailed error aggregation for final failure

## File Upload/Download Patterns

**Streaming ZIP (from `utils/zip.ts`):**
- `ZipStreamBuilder` class for memory-efficient streaming
- Data descriptors for streamed files (CRC/size after data)
- CRC-32 incremental calculation
- STORE compression only (no DEFLATE)
- ReadableStream integration for large files

---

*Convention analysis: 2026-11-15*