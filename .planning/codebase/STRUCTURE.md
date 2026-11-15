# Codebase Structure

**Analysis Date:** 2026-11-15

## Directory Layout

```
assignment-submission/
├── .claude/                    # Claude Code configuration & skills
├── .next/                      # Next.js build output (generated)
├── .planning/                  # GSD planning artifacts (generated)
├── app/                        # Next.js App Router pages & API routes
│   ├── api/                    # API route handlers
│   │   ├── admin/              # Admin-only endpoints
│   │   │   ├── data/route.ts          # Aggregated dashboard data
│   │   │   ├── login/route.ts         # Admin authentication
│   │   │   └── users/
│   │   │       ├── verify/route.ts    # Verify unverified user
│   │   │       └── delete/route.ts    # Delete unverified user
│   │   ├── assignments/
│   │   │   └── submit/route.ts        # Student submit assignment
│   │   ├── faculty/            # Faculty endpoints
│   │   │   ├── classes/route.ts       # CRUD teaching assignments
│   │   │   ├── assignments-toggle/route.ts  # Enable/disable submissions
│   │   │   ├── register/route.ts      # Faculty registration
│   │   │   └── download-submissions/route.ts  # Streaming ZIP download
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── login/route.ts         # Student login
│   │   │   ├── logout/route.ts        # Clear session cookie
│   │   │   ├── register/route.ts      # Student registration
│   │   │   ├── forgot-password/route.ts
│   │   │   ├── reset-password/route.ts
│   │   │   └── resend-verification/route.ts
│   │   ├── profile/update/route.ts    # Profile update (student/faculty)
│   │   └── submissions/
│   │       ├── route.ts               # GET student submissions
│   │       └── update/route.ts        # PUT update submission
│   ├── adminDashboard/page.tsx        # Admin dashboard (Server Component)
│   ├── admin/login/page.tsx           # Admin login page
│   ├── facultyDashboard/page.tsx      # Faculty dashboard (Server Component)
│   ├── faculty/register/page.tsx      # Faculty registration page
│   ├── login/page.tsx                 # Student login page
│   ├── registration/page.tsx          # Student registration page
│   ├── reset-password/page.tsx        # Password reset page
│   ├── studentDashboard/page.tsx      # Student dashboard (Server Component)
│   ├── submit-video/[facultyId]/page.tsx  # Assignment submission page
│   ├── verify-email/page.tsx          # Email verification page
│   ├── globals.css                    # Global styles + Tailwind
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Home page
├── components/                        # React components (Client Components)
│   ├── AdminDashboardClient.tsx       # Admin dashboard UI
│   ├── AitamLogo.tsx                  # Logo component
│   ├── FacultyClassesList.tsx         # Faculty class accordion view
│   ├── FacultyDashboardClient.tsx     # Faculty dashboard UI
│   ├── FacultyRegistrationForm.tsx    # Faculty registration form
│   ├── LoginForm.tsx                  # Login form
│   ├── StudentDashboardClient.tsx     # Student dashboard UI
│   ├── StudentRegistrationForm.tsx    # Student registration form
│   ├── SubmitAssignmentForm.tsx       # Assignment submission form
│   └── VirtualUrlBar.tsx              # Decorative URL bar
├── lib/                               # Core libraries
│   ├── auth.ts                        # JWT signing, verification, session
│   └── db.ts                          # Mongoose connection pooling
├── models/                            # Mongoose models
│   ├── submissionModel.ts             # Submission schema
│   └── userModel.ts                   # User schema (student/faculty)
├── public/                            # Static assets
├── services/                          # Business logic layer
│   ├── facultyService.ts              # Faculty query logic
│   └── studentService.ts              # Student query logic
├── utils/                             # Utility functions
│   ├── createUser.ts                  # User object factory
│   ├── loginUser.ts                   # Credential validation
│   ├── sendEmail.ts                   # Multi-provider email dispatch
│   └── zip.ts                         # Streaming ZIP builder
├── .env                               # Environment variables (NOT COMMITTED)
├── .gitignore
├── next.config.js                     # Next.js configuration
├── package.json                       # Dependencies & scripts
├── postcss.config.js                  # PostCSS config for Tailwind
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── README.md
```

## Directory Purposes

### `app/` - Next.js App Router
- **Purpose**: Pages and API routes using file-system routing
- **Contains**: Server Components (`page.tsx`), API Route Handlers (`route.ts`), layouts
- **Key files**: 
  - `app/layout.tsx` - Root layout with font configuration
  - `app/page.tsx` - Home page
  - `app/*Dashboard/page.tsx` - Protected dashboard entry points
  - `app/api/**/route.ts` - All backend endpoints

### `components/` - React Client Components
- **Purpose**: Interactive UI components with client-side state
- **Contains**: Dashboard clients, forms, modals, shared UI
- **Key files**:
  - `StudentDashboardClient.tsx` - Main student interface (990 lines)
  - `FacultyDashboardClient.tsx` - Main faculty interface (665 lines)
  - `AdminDashboardClient.tsx` - Admin panel (840 lines)
  - `FacultyClassesList.tsx` - Shared class accordion component
  - `*RegistrationForm.tsx`, `SubmitAssignmentForm.tsx`, `LoginForm.tsx` - Forms

### `lib/` - Core Infrastructure
- **Purpose**: Shared utilities for auth and database
- **Contains**:
  - `auth.ts` - JWT operations, session retrieval
  - `db.ts` - Mongoose connection singleton with caching

### `models/` - Mongoose Models
- **Purpose**: Database schemas and TypeScript interfaces
- **Contains**:
  - `userModel.ts` - User schema with teaching assignments, verification, password hashing
  - `submissionModel.ts` - Submission schema linking students to faculty

### `services/` - Business Logic
- **Purpose**: Data aggregation and cross-model queries
- **Contains**:
  - `studentService.ts` - `getStudentsForFaculty()` for faculty dashboard
  - `facultyService.ts` - `getFacultyForStudent()` for student dashboard

### `utils/` - Helper Functions
- **Purpose**: Reusable pure functions and complex utilities
- **Contains**:
  - `createUser.ts` - Normalizes registration input to User document shape
  - `loginUser.ts` - Validates credentials against bcrypt hash
  - `sendEmail.ts` - Multi-provider email (SMTP → Brevo → Resend fallback)
  - `zip.ts` - Streaming ZIP builder with CRC-32, data descriptors

## Key File Locations

### Entry Points
| Purpose | File |
|---------|------|
| Home page | `app/page.tsx` |
| Student login | `app/login/page.tsx` → `app/api/login/route.ts` |
| Admin login | `app/admin/login/page.tsx` → `app/api/admin/login/route.ts` |
| Student registration | `app/registration/page.tsx` → `app/api/register/route.ts` |
| Faculty registration | `app/faculty/register/page.tsx` → `app/api/faculty/register/route.ts` |
| Email verification | `app/verify-email/page.tsx` |
| Password reset | `app/reset-password/page.tsx` → `app/api/reset-password/route.ts` |
| Student dashboard | `app/studentDashboard/page.tsx` |
| Faculty dashboard | `app/facultyDashboard/page.tsx` |
| Admin dashboard | `app/adminDashboard/page.tsx` |

### Configuration
| Purpose | File |
|---------|------|
| Next.js config | `next.config.js` |
| TypeScript config | `tsconfig.json` (paths: `@/*` → `./*`) |
| Tailwind config | `tailwind.config.js` |
| PostCSS config | `postcss.config.js` |
| Environment | `.env` (not committed) |
| Dependencies | `package.json` |

### Core Logic
| Purpose | File |
|---------|------|
| JWT & Session | `lib/auth.ts` |
| DB Connection | `lib/db.ts` |
| User Schema | `models/userModel.ts` |
| Submission Schema | `models/submissionModel.ts` |
| Student Queries | `services/studentService.ts` |
| Faculty Queries | `services/facultyService.ts` |
| Email Dispatch | `utils/sendEmail.ts` |
| ZIP Streaming | `utils/zip.ts` |

## Naming Conventions

| Element | Convention | Examples |
|---------|------------|----------|
| **Pages** | kebab-case directories, `page.tsx` | `studentDashboard/page.tsx`, `submit-video/[facultyId]/page.tsx` |
| **API Routes** | kebab-case directories, `route.ts` | `api/faculty/classes/route.ts`, `api/admin/users/verify/route.ts` |
| **Components** | PascalCase, `Client` suffix for client components | `StudentDashboardClient.tsx`, `FacultyClassesList.tsx` |
| **Utilities** | camelCase, descriptive verb-noun | `createUser.ts`, `sendEmail.ts`, `loginUser.ts` |
| **Services** | camelCase, `Service` suffix | `studentService.ts`, `facultyService.ts` |
| **Models** | PascalCase, `Model` suffix | `userModel.ts`, `submissionModel.ts` |
| **Interfaces** | PascalCase, `I` prefix | `IUser`, `ITeaching`, `ISubmission` |
| **Types** | PascalCase, `Type` suffix | `UserType`, `SessionUser` |
| **Variables/Functions** | camelCase | `getUserSession`, `signToken`, `matchedTeaching` |
| **Constants** | UPPER_SNAKE_CASE | `JWT_SECRET`, `BUFFER_SIZE_THRESHOLD` |
| **CSS Classes** | Tailwind utility classes | `bg-indigo-600`, `rounded-xl`, `flex items-center` |

## Where to Add New Code

### New Feature (e.g., "Announcements")
| Layer | Location |
|-------|----------|
| API Routes | `app/api/announcements/` (create `route.ts` for GET/POST, `[id]/route.ts` for PUT/DELETE) |
| Service | `services/announcementService.ts` (if cross-model logic needed) |
| Model | `models/announcementModel.ts` (if new collection) |
| UI | `components/AnnouncementsClient.tsx` (if complex) or inline in dashboard |
| Server Component | `app/announcements/page.tsx` or integrate into existing dashboard |

### New Component/Module
| Type | Location |
|------|----------|
| Shared UI component | `components/` (e.g., `components/ui/Button.tsx`) |
| Layout component | `components/layout/` (create directory) |
| Form component | `components/forms/` (create directory) |
| Utility function | `utils/` (e.g., `utils/dateHelpers.ts`) |
| Business logic | `services/` (e.g., `services/announcementService.ts`) |

### Shared Helpers
| Category | Location |
|----------|----------|
| Type definitions | `types/` (create directory) or inline in models |
| Constants | `lib/constants.ts` (create file) |
| API error handling | `lib/apiError.ts` (create file) |
| Validation schemas | `lib/validators.ts` or `lib/schemas/` (create directory) |

## Special Directories

| Directory | Purpose | Generated | Committed |
|-----------|---------|-----------|-----------|
| `.next/` | Next.js build cache & compiled output | Yes | No |
| `.planning/` | GSD planning artifacts (this analysis) | Yes | Yes (per GSD workflow) |
| `node_modules/` | npm dependencies | Yes (via install) | No |
| `public/` | Static assets (images, fonts) | No | Yes |
| `scratch/` | Temporary/experimental files | No | No |

---

*Structure analysis: 2026-11-15*