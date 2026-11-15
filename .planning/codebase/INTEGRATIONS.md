# External Integrations

**Analysis Date:** 2026-11-15

## APIs & External Services

### Email Delivery (Multi-Provider Fallback Chain)
- **Primary: Nodemailer SMTP** (`nodemailer` 8.0.5)
  - Used for: Verification emails, password reset emails
  - Configuration: `EMAIL_USER`, `EMAIL_PASS`, optional `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
  - Default: Gmail SMTP (smtp.gmail.com:587, STARTTLS)
  - IPv4-first DNS resolution forced for cloud compatibility (Render/Vercel)

- **Fallback 1: Brevo** (formerly Sendinblue)
  - SDK/Client: REST API (`fetch` to `api.brevo.com/v3/smtp/email`) or SMTP Relay
  - Auth: `BREVO_API_KEY` (REST: `xkeysib-*`, SMTP Relay: `xsmtpsib-*`)
  - Used when primary SMTP fails

- **Fallback 2: Resend**
  - SDK/Client: REST API (`fetch` to `api.resend.com/emails`)
  - Auth: `RESEND_API_KEY`
  - Used when both Nodemailer and Brevo fail
  - From address: `RESEND_FROM_EMAIL` or default `onboarding@resend.dev`

**Location:** `utils/sendEmail.ts` - `dispatchEmail()` function with 3-tier fallback

### Google Drive / Google Workspace
- **Service:** Google Drive file download & Google Docs/Sheets/Slides export
- **Integration:** Direct HTTP `fetch` calls (no official SDK)
- **Purpose:** Download student submissions (video URLs, documents) for faculty ZIP exports
- **Features:**
  - Handles Google Drive virus-scan confirmation pages
  - Exports Google Docs → DOCX, Sheets → XLSX, Slides → PPTX
  - Extracts file IDs from multiple URL formats
  - User-Agent spoofing for compatibility
  - 30-second per-file timeout

**Location:** `app/api/faculty/download-submissions/route.ts` - `resolveSubmission()`, `resolveGDriveConfirmation()`

### YouTube
- **Integration:** URL detection only (no API calls)
- **Purpose:** Detect YouTube links in submissions, create `.url` shortcut files instead of downloading
- **Location:** `app/api/faculty/download-submissions/route.ts` (line 268-270)

---

## Data Storage

### Primary Database: MongoDB
- **Provider:** MongoDB Atlas (cloud) or self-hosted
- **Connection:** `MONGO_DB_URI` environment variable
- **Client/ORM:** Mongoose 9.3.0
- **Connection Management:** Cached singleton in `lib/db.ts` (prevents connection exhaustion in serverless)
- **Models:**
  - `User` (`models/userModel.ts`) - Students, Faculty, Admins with roles, teaching assignments, verification tokens
  - `Submission` (`models/submissionModel.ts`) - Student video/document submissions linked to faculty/classes

### File Storage
- **Type:** **External URLs only** (Google Drive, YouTube, direct links)
- **No local file storage** - Application stores URLs in MongoDB, streams files on-demand during ZIP export
- **ZIP Generation:** In-memory streaming via `utils/zip.ts` (no temp files)

### Caching
- **None configured** - No Redis, no in-memory cache beyond Mongoose connection cache
- **Next.js Cache:** Default fetch caching (can be overridden per route)

---

## Authentication & Identity

### Custom JWT-Based Authentication
- **Provider:** **Custom implementation** (no Auth.js, Clerk, Supabase Auth, etc.)
- **Token:** HS256 signed JWT, 1-day expiry
- **Storage:** HTTP-only cookie named `session`
- **Secret:** `JWT_SECRET` environment variable
- **Payload:** `{ _id, email, role }` where role ∈ `student | faculty | admin`
- **Verification:** `lib/auth.ts` - `verifyToken()`, `getUserSession()`
- **Middleware:** `middleware.ts` - Edge-compatible JWT decode (no crypto dependency)

### Password Security
- **Hashing:** bcrypt cost factor 10
- **Reset Flow:** Token-based (crypto.randomBytes 32 hex), 1-hour expiry, stored in User document

### Email Verification
- **Flow:** Registration → verification token emailed → `/verify-email` page → token validated → `isVerified: true`
- **Token:** crypto.randomBytes 32 hex, 1-hour expiry
- **Middleware Gate:** Unverified users blocked from dashboard routes (see `middleware.ts`)

---

## Monitoring & Observability

### Error Tracking
- **None configured** - No Sentry, Datadog, LogRocket, etc.
- **Logging:** `console.log` / `console.error` / `console.warn` throughout API routes
- **Structured Logging:** Consistent prefixes like `[ZIP]`, `[Nodemailer SMTP]`, `[Brevo API]`

### Logs
- **Approach:** Standard output (Vercel/Node.js stdout/stderr)
- **No log aggregation service** detected

---

## CI/CD & Deployment

### Hosting Platform
- **Target:** **Vercel** (detected via `process.env.VERCEL === "1"`)
- **Evidence:** Runtime limit handling (54s safe limit on Vercel Hobby), streaming ZIP response

### CI Pipeline
- **Not detected** - No GitHub Actions, GitLab CI, CircleCI configs in repo root
- **Build Command:** `next build` (package.json)
- **Dev Command:** `next dev`

---

## Environment Configuration

### Required Environment Variables
| Variable | Description | Used In |
|----------|-------------|---------|
| `MONGO_DB_URI` | MongoDB connection string | `lib/db.ts` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | `lib/auth.ts` |
| `BASE_URL` | Production base URL for email links | `utils/sendEmail.ts` |
| `EMAIL_USER` | SMTP username / sender email | `utils/sendEmail.ts` |
| `EMAIL_PASS` | SMTP password / app password | `utils/sendEmail.ts` |

### Optional Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | Custom SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | Custom SMTP port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `BREVO_API_KEY` / `BREV0_API_KEY` | Brevo API key | — |
| `RESEND_API_KEY` | Resend API key | — |
| `RESEND_FROM_EMAIL` | Resend sender address | `onboarding@resend.dev` |
| `VERCEL` | Auto-set by Vercel | — |

### Secrets Location
- **Development:** `.env` file (gitignored)
- **Production:** Vercel Environment Variables dashboard
- **No `.env.example` or `.env.template` found** - Create from above table

---

## Webhooks & Callbacks

### Incoming Webhooks
- **None configured** - No webhook endpoints in API routes

### Outgoing Webhooks / Callbacks
- **None configured** - No outbound webhook calls

### Email Links (User-Facing Callbacks)
| Endpoint | Purpose | Trigger |
|----------|---------|---------|
| `/verify-email?token=` | Email verification | Registration |
| `/reset-password?token=&email=` | Password reset | Forgot password flow |

---

## Security Considerations

### Network Calls
| Direction | Target | Auth | Notes |
|-----------|--------|------|-------|
| Outbound | MongoDB | URI credentials | TLS by default (Atlas) |
| Outbound | SMTP (Gmail/Brevo) | User/Pass | STARTTLS |
| Outbound | Brevo API | API Key | HTTPS |
| Outbound | Resend API | Bearer Token | HTTPS |
| Outbound | Google Drive/Docs | None (public/cookie auth) | User-Agent spoofed, no OAuth |
| Outbound | YouTube | None | URL detection only |

### Data Privacy
- **Student submissions:** Video URLs stored in MongoDB, fetched on-demand for faculty download
- **No PII sent to external APIs** except email addresses for transactional emails
- **Google Drive access:** Only downloads publicly accessible or faculty-accessible links (no OAuth tokens stored)

---

*Integration audit: 2026-11-15*