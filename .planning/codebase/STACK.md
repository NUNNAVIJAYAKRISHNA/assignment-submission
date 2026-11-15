# Technology Stack

**Analysis Date:** 2026-11-15

## Languages

**Primary:**
- **TypeScript** 5.9.3 - All application code (App Router, API routes, components, utilities)
- **JavaScript** (ESNext) - Config files, some utilities

## Runtime

**Environment:**
- **Node.js** - Target: ES5 (per tsconfig), runtime: Node.js 18+ (Next.js 15 requirement)
- **Next.js Edge Runtime** - Middleware uses Edge-compatible JWT decoding

**Package Manager:**
- **npm** 10+ (inferred from package-lock.json)
- Lockfile: **package-lock.json** present

## Frameworks

**Core:**
- **Next.js** 15.5.20 - App Router architecture, Server Components, API Routes, Middleware
- **React** 19.2.7 - UI library with Server Components
- **React DOM** 19.2.7 - Client-side rendering

**Database/ORM:**
- **Mongoose** 9.3.0 - MongoDB ODM with schema validation, hooks, TypeScript interfaces
- **MongoDB Driver** (transitive via Mongoose) - Native driver

**Authentication:**
- **jsonwebtoken** 9.0.3 - JWT signing/verification (HS256, 1-day expiry)
- **bcrypt** 6.0.0 - Password hashing (cost factor 10)

**Email:**
- **nodemailer** 8.0.5 - Primary SMTP transport (Gmail or custom SMTP)
- **Brevo** (via REST API & SMTP Relay) - Fallback email provider
- **Resend** (via REST API) - Additional fallback email provider

**File Processing:**
- **Native Node.js APIs** - Streaming ZIP generation (`zlib.crc32`, `ReadableStream`, `fetch`)
- **Custom ZIP implementation** - `utils/zip.ts` (streaming, data descriptors, CRC-32)

**Styling:**
- **Tailwind CSS** 3.4.19 - Utility-first CSS framework
- **PostCSS** 8.5.8 - CSS processing
- **Autoprefixer** 10.4.27 - Vendor prefixing

**Build/Dev:**
- **TypeScript** 5.9.3 - Type checking (strict: false, incremental builds)
- **Next.js built-in** - Turbopack (dev), SWC (production build)
- **ESLint/Prettier** - Not configured (no config files detected)

## Key Dependencies

**Critical:**
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.20 | Full-stack React framework (App Router) |
| react / react-dom | 19.2.7 | UI runtime |
| mongoose | 9.3.0 | MongoDB ODM with TypeScript support |
| jsonwebtoken | 9.0.3 | Session token management |
| bcrypt | 6.0.0 | Password hashing |
| nodemailer | 8.0.5 | Email delivery (SMTP) |

**Infrastructure:**
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 3.4.19 | Styling |
| typescript | 5.9.3 | Type checking |
| @types/* | various | TypeScript definitions |

## Configuration

**Environment Variables (from `.env` and code references):**

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_DB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `BASE_URL` | Yes | Base URL for email links (production) |
| `EMAIL_USER` | Yes | SMTP username / sender email |
| `EMAIL_PASS` | Yes | SMTP password / app password |
| `SMTP_HOST` | No | Custom SMTP host (defaults to Gmail) |
| `SMTP_PORT` | No | Custom SMTP port (defaults to 587) |
| `SMTP_SECURE` | No | Use TLS (defaults to false) |
| `BREVO_API_KEY` / `BREV0_API_KEY` | No | Brevo API key (REST or SMTP relay) |
| `RESEND_API_KEY` | No | Resend API key |
| `RESEND_FROM_EMAIL` | No | Sender for Resend emails |
| `VERCEL` | Auto | Detects Vercel deployment (sets runtime limits) |

**Build Config Files:**
- `next.config.js` - Minimal (reactStrictMode only)
- `tsconfig.json` - Path aliases (`@/*`), ESNext modules, incremental builds
- `tailwind.config.js` - Content paths for App Router + components
- `postcss.config.js` - PostCSS plugins (Tailwind + Autoprefixer)

## Platform Requirements

**Development:**
- Node.js 18+
- MongoDB instance (local or cloud - MongoDB Atlas)
- SMTP credentials (Gmail App Password or transactional email service)

**Production:**
- **Deployment Target:** Vercel (detected via `process.env.VERCEL === "1"`)
- **Runtime Limits:** 60s max duration (Hobby), streaming responses supported
- **Environment:** Node.js 18+ runtime
- **Database:** MongoDB Atlas or self-hosted MongoDB
- **Email:** Gmail SMTP, Brevo, or Resend (multi-provider fallback)

---

*Stack analysis: 2026-11-15*