<!-- refreshed: 2026-11-15 -->
# Testing Patterns

**Analysis Date:** 2026-11-15

## Test Framework

**Runner:** Not configured

**Assertion Library:** Not configured

**Run Commands:**
```bash
# No test commands configured in package.json
# No test scripts found
```

**Test Files Found:** None in project source (only in `node_modules/`)

## Test File Organization

**Location:** No test files in project source

**Naming:** Not applicable

**Structure:** Not applicable

## Test Structure

No test suite organization patterns exist in this codebase.

## Mocking

**Framework:** Not configured

**Patterns:** Not applicable

**What to Mock (Recommended):**
- External API calls: `nodemailer`, `fetch` to Brevo/Resend APIs
- Database: `mongoose` connection and model methods
- Authentication: `jsonwebtoken` sign/verify, `cookies()` from `next/headers`
- Next.js: `next/navigation` (`useRouter`), `next/headers` (`cookies`)

**What NOT to Mock (Recommended):**
- Business logic in utilities (`createUser`, `loginUser`, `zip.ts` streaming logic)
- React component rendering (test behavior, not implementation)
- Mongoose schema validation (test via integration)

## Fixtures and Factories

**Test Data:** No fixtures/factories exist

**Location:** Not applicable

**Recommended Patterns:**
```typescript
// Example factory for User
const createTestUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  fullname: "Test User",
  email: "test@example.com",
  password: "hashedpassword",
  role: "student" as const,
  rollNumber: "21CS1001",
  yearOfStudy: 2,
  semester: 1,
  section: "A",
  branch: "CSE",
  isVerified: true,
  ...overrides
});

// Example factory for Submission
const createTestSubmission = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  studentId: new mongoose.Types.ObjectId(),
  studentName: "Test Student",
  studentRollNumber: "21CS1001",
  studentYear: 2,
  studentSection: "A",
  facultyId: new mongoose.Types.ObjectId(),
  subject: "Data Structures",
  title: "Assignment 1",
  videoUrl: "https://example.com/video.mp4",
  description: "Test submission",
  ...overrides
});
```

## Coverage

**Requirements:** None enforced

**View Coverage:** Not applicable

## Test Types

**Unit Tests:** Not implemented
- Recommended for: `utils/createUser.ts`, `utils/loginUser.ts`, `utils/zip.ts`, `lib/auth.ts`

**Integration Tests:** Not implemented
- Recommended for: API routes (`app/api/**/route.ts`), database operations

**E2E Tests:** Not implemented
- Recommended for: Critical user flows (login, registration, submission, download)
- Framework options: Playwright, Cypress

## Common Patterns

**Async Testing (Recommended):**
```typescript
// Using Vitest/Jest
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("createUser", () => {
  it("normalizes email to lowercase and trims whitespace", () => {
    const input = { email: "  TEST@EXAMPLE.COM  ", fullname: "Test", password: "pass", rollNumber: "123", branch: "CSE", yearOfStudy: "2", semester: "1", section: "A" };
    const result = createUser(input);
    expect(result.email).toBe("test@example.com");
  });

  it("converts yearOfStudy and semester to numbers", () => {
    const input = { email: "test@example.com", fullname: "Test", password: "pass", rollNumber: "123", branch: "CSE", yearOfStudy: "3", semester: "2", section: "B" };
    const result = createUser(input);
    expect(result.yearOfStudy).toBe(3);
    expect(result.semester).toBe(2);
  });

  it("filters empty teaching entries", () => {
    const input = { email: "test@example.com", fullname: "Test", password: "pass", role: "faculty" as const, teaching: [{ year: "1", section: "A", subject: "Math" }, { year: "", section: "", subject: "" }] };
    const result = createUser(input);
    expect(result.teaching).toHaveLength(1);
  });
});
```

**Error Testing (Recommended):**
```typescript
describe("loginUser", () => {
  it("throws 'User not found' for non-existent email", async () => {
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    await expect(loginUser("nonexistent@example.com", "password")).rejects.toThrow("User not found");
  });

  it("throws 'Invalid password' for wrong password", async () => {
    const user = { password: await bcrypt.hash("correct", 10) };
    vi.spyOn(User, "findOne").mockResolvedValue(user);
    await expect(loginUser("test@example.com", "wrong")).rejects.toThrow("Invalid password");
  });
});
```

**API Route Testing (Recommended):**
```typescript
// Using Next.js test utilities or supertest
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/login/route";

describe("/api/login", () => {
  it("returns 401 for invalid credentials", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { email: "test@example.com", password: "wrong" },
    });
    
    await POST(req as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchObject({ success: false });
  });

  it("sets session cookie on successful login", async () => {
    // Mock getUserSession, connectDB, loginUser, signToken
    const { req, res } = createMocks({
      method: "POST",
      body: { email: "test@example.com", password: "correct" },
    });
    
    await POST(req as any);
    expect(res._getStatusCode()).toBe(200);
    const cookies = res.getHeaders()["set-cookie"];
    expect(cookies).toBeDefined();
  });
});
```

**React Component Testing (Recommended):**
```typescript
// Using React Testing Library
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/components/LoginForm";

describe("LoginForm", () => {
  it("shows error when login fails", async () => {
    // Mock fetch to return error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("shows verification view when email not verified", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ code: "EMAIL_NOT_VERIFIED", message: "Email not verified" }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
    });
  });
});
```

**Streaming ZIP Testing (Recommended):**
```typescript
describe("ZipStreamBuilder", () => {
  it("creates valid ZIP with single file", async () => {
    const stream = new ReadableStream({
      start(controller) {
        const builder = new ZipStreamBuilder(controller);
        builder.addFile("test.txt", "Hello World");
        builder.finalize();
      },
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);
    
    // Verify ZIP structure
    expect(zipBuffer.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04])); // Local file header signature
    expect(zipBuffer.toString()).toContain("Hello World");
  });

  it("streams large file with data descriptor", async () => {
    const largeContent = "x".repeat(100000);
    const fileStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(largeContent));
        controller.close();
      },
    });

    const stream = new ReadableStream({
      start(controller) {
        const builder = new ZipStreamBuilder(controller);
        builder.addFileStream("large.txt", fileStream);
        builder.finalize();
      },
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);
    
    // Verify data descriptor present (0x08074b50)
    expect(zipBuffer.toString()).toContain("large.txt");
  });
});
```

## Recommended Test Setup

**Framework:** Vitest (fast, Vite-compatible, TypeScript-native)
- Install: `npm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/node`
- Config: `vitest.config.ts` with `environment: "jsdom"`, `setupFiles: ["./test/setup.ts"]`

**Test Directory Structure:**
```
test/
├── setup.ts              # Global test setup (mock fetch, extend expect)
├── factories/
│   ├── user.ts           # User test factories
│   └── submission.ts     # Submission test factories
├── utils/
│   ├── createUser.test.ts
│   ├── loginUser.test.ts
│   └── zip.test.ts
├── lib/
│   └── auth.test.ts
├── api/
│   ├── login.test.ts
│   ├── register.test.ts
│   └── submissions.test.ts
└── components/
    ├── LoginForm.test.tsx
    └── StudentDashboardClient.test.tsx
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Global Setup (test/setup.ts):**
```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.JWT_SECRET = "test-secret";
process.env.MONGO_DB_URI = "mongodb://localhost:27017/test";
process.env.BASE_URL = "http://localhost:3000";
```

---

*Testing analysis: 2026-11-15*