# AssignHub — Assignment Submission Platform

A modern, secure, and responsive web-based platform for managing academic assignment submissions. Built with Next.js 15 (App Router), React 19, TypeScript, and MongoDB.

Students can easily submit assignments (e.g. video links, Google Drive files), while faculty members can manage classrooms, toggle submission availability, and download student submissions in bulk as a structured ZIP file.

---

## 🚀 Tech Stack

* **Framework:** Next.js 15 (App Router), React 19 (Server & Client Components)
* **Language:** TypeScript
* **Database:** MongoDB Atlas, Mongoose ODM
* **Styling:** Tailwind CSS, PostCSS, Google Fonts (*Plus Jakarta Sans*)
* **Authentication:** JSON Web Tokens (JWT) stored in secure, HttpOnly session cookies
* **Mailing:** Nodemailer (Gmail SMTP integration)
* **Tooling:** npm, Node.js

---

## 📂 Project Structure

```text
assignment-submission
├── app/                           # Next.js App Router root
│   ├── api/                       # API Route Handlers
│   │   ├── assignments/
│   │   │   └── submit/route.ts    # Student assignment submission
│   │   ├── faculty/
│   │   │   ├── assignments-toggle/ # Toggle submission status
│   │   │   ├── download-submissions/ # Compile & download submissions as ZIP
│   │   │   └── register/route.ts  # Faculty registration handler
│   │   ├── login/route.ts         # User login handler
│   │   ├── logout/route.ts        # User logout handler
│   │   └── register/route.ts      # Student registration handler
│   ├── faculty/
│   │   └── register/page.tsx      # Faculty registration form page
│   ├── facultyDashboard/
│   │   └── page.tsx               # Faculty portal dashboard view
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── registration/
│   │   └── page.tsx               # Student registration form page
│   ├── studentDashboard/
│   │   └── page.tsx               # Student portal dashboard view
│   ├── submit-video/[facultyId]/
│   │   └── page.tsx               # Video/link submission form
│   ├── verify-email/
│   │   └── page.tsx               # Verification token landing handler
│   ├── globals.css                # Tailwind global styles
│   ├── layout.tsx                 # Root layout, theme config, fonts
│   └── page.tsx                   # Main landing page
│
├── components/                    # Reusable React UI components
│   ├── FacultyClassesList.tsx     # Class administration list for educators
│   ├── FacultyRegistrationForm.tsx# Form component for faculty sign-up
│   ├── LoginForm.tsx              # Shared login form
│   ├── StudentRegistrationForm.tsx# Form component for student sign-up
│   └── SubmitAssignmentForm.tsx   # Assignment submission form
│
├── lib/                           # Server-side configuration utilities
│   ├── auth.ts                    # JWT token signatures, verification & user session getters
│   └── db.ts                      # Cached MongoDB connection utility for serverless/development
│
├── models/                        # Mongoose database models
│   ├── submissionModel.ts         # Student submission metadata & files schema
│   └── userModel.ts               # Student & faculty profile schemas (including teaching details)
│
├── services/                      # Decoupled business logic services
│   ├── facultyService.ts          # Core database queries for faculty matching
│   └── studentService.ts          # Grouping students by class section and mapping submissions
│
├── utils/                         # Helper utilities
│   ├── createUser.ts              # Payload sanitization and profile initialization
│   ├── loginUser.ts               # Credentials verification helper
│   ├── sendEmail.ts               # Nodemailer transporter and HTML templates
│   └── zip.ts                     # In-memory custom ZIP creation archive stream generator
│
├── public/                        # Static assets (images, icons)
├── .env                           # Environment variables configuration
├── next.config.js                 # Next.js bundler and build configuration
├── tailwind.config.js             # Tailwind utility configuration
└── tsconfig.json                  # TypeScript compiler settings
```

---

## ⚙️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/assignment-submission.git
   cd assignment-submission
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---



## ▶️ Running the Application

* **Start the development server:**
  ```bash
  npm run dev
  ```
  *(Then open your browser to `http://localhost:3000`)*

* **Build the production package (compiles App Router routes & TypeScript declarations):**
  ```bash
  npm run build
  ```

* **Start the production server:**
  ```bash
  npm run start
  ```

---

## 🛡️ System Architecture & Key Flows

### 1. Unified App Router & Authentication Flow
* JWT sessions are stored in an HttpOnly cookie named `session` for safety against XSS attacks.
* User verification status (`isVerified`) is validated at server rendering time. Next.js Server Components parse headers, check session cookies, and route authenticated users directly, preventing layout flashes.

### 2. Dynamically Controlled Submission Flow
* Faculty members have full administrative access on their dashboard to toggle the submission window (`assignmentsEnabled`) for each specific class section (e.g. Year 3 - Sec B) they teach.
* Students can only submit video assignment payloads if the respective faculty member has enabled submissions for their class section.

### 3. Submissions ZIP Downloader with Google Drive Integration
* The download endpoint (`/api/faculty/download-submissions`) queries all submissions for a selected year and section.
* The API fetches each submission file concurrently using `Promise.all` with a 15-second abort timer to prevent socket hang ups.
* **Google Drive Link Resolution:** If a student submits a Google Drive document/sheet/slide/file URL, the API automatically parses the file ID and resolves it to a direct export stream (converting docs to `.docx`, sheets to `.xlsx`, slides to `.pptx`, and binary files to direct downloads).
* **Failover URL Shortcuts:** If a download fails or points to an HTML-based media page (like YouTube), the utility automatically compiles a fallback `.url` Internet Shortcut file.
* **Custom ZIP Builder (`utils/zip.ts`):** Instead of depending on external zip executables, a custom in-memory ZIP builder computes CRC32 checksums, maps headers, compiles a summary file (`summary.txt`), and generates a `Uint8Array` stream back to the browser.

### 4. Account Security & Sanitization
* **Pre-processing:** Sanitizes incoming educator registrations to remove blank nested fields before saving to MongoDB, preventing schema errors.
* **Email Verification:** Utilizes a secure, expiring token dispatched via Nodemailer to verify user emails.
* **Client UI:** Integrates password visibility toggles on both student and faculty registration views.
