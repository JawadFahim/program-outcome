# CLAUDE.md — Project Context for AI Assistance

> This file is written for AI assistants (Claude, Copilot, etc.) to understand this project deeply before editing, debugging, or extending it. Read this first before touching any file.

---

## 1. What This Project Is

**Program Outcome Tracker** — a web application for **Bangladesh University of Professionals (BUP)** built on the **OBE (Outcome-Based Education)** framework. It lets:

- **Teachers** define Course Objectives (COs) for their assigned courses, link those COs to Program Outcomes (POs), and enter student scores for each assessment tied to each CO.
- **Admins** manage academic sessions, teacher accounts, course offerings, and student enrollment.

The system then automatically aggregates scores and reports pass/fail status per CO per student, which feeds into institutional accreditation reporting (engineering programs typically follow ABET / national equivalents with 12 standard Program Outcomes).

The 12 POs are fixed in `src/lib/constants.ts` and represent standard engineering accreditation outcomes (PO1–PO12: Engineering Knowledge through Life-long Learning).

---

## 2. Tech Stack (exact versions)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 15.5.x |
| Language | TypeScript | 5.x |
| UI Library | React | 19 |
| Database | MongoDB (Atlas) | 6.x driver |
| Auth | jose (JWT) + js-cookie | latest |
| Password hashing | bcrypt / bcryptjs | available but **NOT used** (see Known Issues) |
| Email (OTP) | Nodemailer | — |
| Charts | Chart.js + react-chartjs-2 | — |
| File handling | ExcelJS, jsPDF, jspdf-autotable, react-dropzone | — |
| Icons | react-icons | — |
| Styling | Tailwind CSS v4, PostCSS, custom CSS | — |
| Linting | ESLint 9, eslint-config-next | — |

Path alias: `@/*` → `./src/*` (configured in `tsconfig.json`)

---

## 3. Routing Architecture

This project uses **two Next.js routers simultaneously** — a known hybrid pattern:

### Pages Router (Primary — all product UI lives here)
```
src/pages/
├── _app.tsx              # Global wrapper: imports globals.css, mounts FeedbackPanel FAB on selected routes, patches console.*
├── _document.tsx         # HTML shell; loads Inter font from Google Fonts
├── login.tsx             # Teacher login (POST /api/login)
├── forgot-password.tsx   # OTP-based password reset
├── homepage.tsx          # Teacher dashboard: CO editor, course/session selector
├── assessment_score.tsx  # Teacher: enter student scores per CO per assessment
├── score_summary.tsx     # Teacher: view aggregated pass/fail summary with PieChart
└── admin/
    ├── login.tsx         # Admin login (POST /api/admin/login)
    ├── homepage.tsx      # Admin dashboard: metrics, session management
    ├── teacher-details.tsx # Admin: view/add teachers, assign courses
    ├── course-offer.tsx  # Admin: offer courses for a session
    ├── student-entry.tsx # Admin: upload/move students via Excel
    └── student.tsx       # Admin: single student detail view
```

### App Router (Scaffold only — do NOT use for new product features)
```
src/app/
├── layout.tsx   # Root layout with Geist font (only for App Router subtree)
├── page.tsx     # Default Next.js starter page at "/" — not the product
└── globals.css  # Tailwind v4 entry (@import "tailwindcss") for App Router
```

> **Important:** `/` redirects to `/login` via middleware because unauthenticated users hit the App Router page, which falls through. The actual product starts at `/homepage` (teacher) or `/admin/homepage` (admin).

---

## 4. Auth & Middleware Flow

### Middleware (`src/middleware.ts`)
- Runs on all routes **except** `/api/*`, `/_next/*`, `/favicon.ico`
- Reads two cookies: `auth_token` (teacher), `admin_auth_token` (admin)
- Verifies JWT with `verifyJwt` (from `src/lib/jwt.ts` using `jose`)
- Teacher paths: valid token with `role !== 'admin'` → allow; otherwise → redirect `/login`
- Admin paths (`/admin/**`): valid token with `role === 'admin'` → allow; otherwise → redirect `/admin/login`
- On redirect, **both cookies are cleared**

### JWT Utility (`src/lib/jwt.ts`)
- `verifyJwt(token)` — server-side + middleware, uses `jose.jwtVerify`
- `getTeacherIdFromAuth()` — **client-side only**, decodes (does NOT verify) the JWT payload from `js-cookie` to extract `teacherId`. Used in teacher pages to know who is logged in.
- `removeAuthTokenCookie()` — clears teacher cookie on logout
- Token TTL: 30 minutes

### Token shape
```ts
// Teacher token payload
{ teacherId: string, role: "teacher" }

// Admin token payload
{ role: "admin" }  // no admin ID embedded
```

---

## 5. File Structure — Complete Map

```
program-outcome/
├── CLAUDE.md                    ← this file
├── README.md                    ← user-facing setup guide
├── JIRA_WORKFLOW.md             ← team workflow notes (non-code)
├── test.json                    ← loose scratch file (safe to ignore)
├── package.json                 ← dependencies and scripts
├── next.config.ts               ← minimal Next.js config (no custom options)
├── tsconfig.json                ← strict TS, "jsx": "preserve", @/* alias
├── postcss.config.mjs           ← Tailwind v4 PostCSS plugin only
├── eslint.config.mjs            ← ESLint 9 flat config
├── .gitignore                   ← ignores .env*, node_modules, .next
│
├── public/                      ← static assets (mostly CNA defaults)
│   ├── file.svg
│   ├── vercel.svg
│   └── window.svg
│
├── demo/                        ← static HTML prototypes (non-functional, reference only)
│   ├── login.html
│   ├── course_objective.html
│   ├── assessment_score.html
│   └── score_summary.html
│
└── src/
    ├── middleware.ts             ← Route protection (see section 4)
    │
    ├── assets/                  ← (Referenced but may be missing from repo)
    │   ├── bup.jpg              ← Used in login.tsx as background
    │   └── bup_logo.png         ← Used in login.tsx as logo
    │
    ├── app/                     ← App Router scaffold (do not use for product)
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    │
    ├── pages/                   ← All product UI (see section 3)
    │   ├── _app.tsx
    │   ├── _document.tsx
    │   ├── login.tsx
    │   ├── forgot-password.tsx
    │   ├── homepage.tsx         ← LARGEST page: CO editor (~785 lines)
    │   ├── assessment_score.tsx ← LARGEST page: score entry (~714 lines)
    │   ├── score_summary.tsx
    │   └── admin/
    │       ├── login.tsx
    │       ├── homepage.tsx
    │       ├── teacher-details.tsx
    │       ├── course-offer.tsx
    │       ├── student-entry.tsx
    │       └── student.tsx
    │
    ├── pages/api/               ← All backend logic (Next.js API routes)
    │   ├── login.ts             ← Teacher login — issues JWT (PLAINTEXT passwords!)
    │   ├── request-otp.ts       ← Sends OTP email for password reset
    │   ├── reset-password.ts    ← Validates OTP and updates password
    │   ├── send-feedback.ts     ← Emails feedback from FeedbackPanel
    │   ├── getCourseObjectives.ts   ← GET objectives for course+session+teacher
    │   ├── courseObjectives.ts      ← POST/PUT save/update COs
    │   ├── getStudentList.ts        ← GET enrolled students for a course
    │   ├── getStudentListFromScores.ts ← GET students who have score records
    │   ├── getAssessmentsForCO.ts   ← GET assessment types for a CO
    │   ├── getSavedScores.ts        ← GET saved scores for an assessment
    │   ├── saveScores.ts            ← POST save student scores
    │   ├── score_summary.ts         ← GET aggregated pass/fail summary
    │   ├── get_sessions.ts          ← GET available academic sessions
    │   ├── teachers/
    │   │   └── [teacherId].ts       ← GET teacher info + courses taught
    │   └── admin/
    │       ├── login.ts             ← Admin login — issues admin JWT
    │       ├── sessions.ts          ← GET/POST academic sessions
    │       ├── dashboard.ts         ← GET dashboard metrics
    │       ├── teachers.ts          ← GET all teachers
    │       ├── add-teacher.ts       ← POST create teacher account
    │       ├── add-courses-to-teacher.ts ← POST assign courses to teacher
    │       ├── get-program-info.ts  ← GET program metadata
    │       ├── get-course-programs.ts   ← GET programs for a course
    │       ├── get-courses-for-program.ts ← GET courses in a program
    │       ├── get-offered-courses-details.ts ← GET offered courses with detail
    │       ├── offer-courses.ts     ← POST offer a course for a session
    │       ├── get-students.ts      ← GET student list
    │       ├── student.ts           ← GET single student detail
    │       ├── move-students.ts     ← POST bulk move students between sessions
    │       └── upload-student-list.ts ← POST Excel upload for student enrollment
    │
    ├── components/
    │   ├── Layout.tsx           ← Teacher page wrapper: Navbar + main slot + FeedbackPanel (duplicates FAB from _app.tsx — be careful)
    │   ├── Navbar.tsx           ← Teacher navigation bar
    │   ├── FeedbackPanel.tsx    ← Floating modal form, POSTs to /api/send-feedback
    │   ├── PieChart.tsx         ← Chart.js pie: passed/failed/absent counts
    │   └── admin/
    │       └── AdminNavbar.tsx  ← Admin navigation bar
    │
    ├── lib/
    │   ├── mongodb.ts           ← Singleton MongoClient; ⚠️ HARDCODED connection string (see Known Issues)
    │   ├── jwt.ts               ← JWT sign/verify/cookie helpers
    │   ├── constants.ts         ← PROGRAM_OUTCOMES (PO1–PO12) + DB_NAME ("BUP_obe")
    │   ├── otpStore.ts          ← In-memory OTP map (dev-only; resets on server restart)
    │   └── mailer.ts            ← Nodemailer; ⚠️ SMTP credentials in source (see Known Issues)
    │
    └── styles/
        ├── globals.css          ← Master CSS: design tokens (CSS vars), .btn, .card, .navbar, tables, toast, modal, multiselect, feedback widget, homepage compact blocks
        ├── homepage.css         ← Homepage-specific styles
        ├── login.css            ← Login-specific styles
        └── admin/
            ├── AdminNavbar.css  ← Admin navbar styles
            └── teacher-details.css ← Teacher details page styles
```

---

## 6. MongoDB Collections (inferred from API routes)

Database name: **`BUP_obe`** (from `src/lib/constants.ts`)

| Collection | Used in | Key fields |
|---|---|---|
| `teachers` | login, teacher CRUD | `teacherId`, `password` (plaintext!), `name`, `coursesTaught[]` |
| `sessions` | sessions API, homepage | session name/id, year, term |
| `programs` | admin program APIs | program code, name |
| `courses` | course-related APIs | `course_id`, `courseName`, program link |
| `course_objectives` | CO APIs | `teacherId`, `course_id`, `session`, objectives array with PO mappings |
| `scores` | score APIs | `teacherId`, `course_id`, `session`, `co_no`, `assessmentType`, per-student marks |
| `students` | student APIs | `studentId`, `name`, enrollment data |

---

## 7. State Management Pattern

**No global state manager.** Everything is local `useState` + `useEffect` per page.

Each major page follows this pattern:
1. On mount: read `teacherId` from cookie via `getTeacherIdFromAuth()`
2. Fetch teacher data → populate course dropdown
3. On course/session selection: fetch COs or scores
4. User edits local state
5. Save button → POST to API → show toast notification

**Modal/Toast state** is managed inline in each page (not a shared component), duplicating the same ~6 `useState` calls across `homepage.tsx` and `assessment_score.tsx`.

---

## 8. Styling System

The project has **4 overlapping styling layers** — this is a known complexity:

1. **`src/styles/globals.css`** — Imported in `_app.tsx`. The master design system: CSS custom properties (`--primary-color`, `--card-bg`, etc.), `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.navbar`, `.modal`, `.toast`, `.multiselect-dropdown`, and page-specific utility classes. This is what drives the visual look.

2. **`src/app/globals.css`** — Tailwind v4 entry (`@import "tailwindcss"`, `@theme inline`). Only applies to App Router routes (not product pages). Contains some duplicate utility classes like `.selection-container`.

3. **Tailwind utility classes** — Mixed in JSX: `bg-gray-50`, `min-h-screen`, `flex`, etc. Used inconsistently; some pages use them, some rely on the custom CSS above.

4. **Page-level `<style jsx global>`** — Login page defines its own CSS variables and layout rules inline.

**Fonts:** Teacher/admin pages use **Inter** (loaded in `_document.tsx` from Google Fonts). App Router pages use **Geist** (loaded in `src/app/layout.tsx`).

---

## 9. Known Issues & Security Warnings

> These exist in the codebase as of the last analysis. Do not introduce workarounds that mask them — fix them properly or note them.

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Plaintext passwords** — `teacher.password !== password` comparison | `src/pages/api/login.ts` | 🔴 Critical |
| 2 | **Hardcoded MongoDB URI** — connection string inlined in source | `src/lib/mongodb.ts` | 🔴 Critical |
| 3 | **SMTP credentials in source** — email/password hardcoded | `src/lib/mailer.ts` | 🔴 Critical |
| 4 | **In-memory OTP store** — resets on server restart; not production-safe | `src/lib/otpStore.ts` | 🟡 Medium |
| 5 | **Client-side JWT decode without verification** — `getTeacherIdFromAuth()` | `src/lib/jwt.ts` | 🟡 Medium |
| 6 | **No API route authentication** — admin API routes don't re-verify the JWT server-side | `src/pages/api/admin/*` | 🔴 Critical |
| 7 | **Missing image assets** — `src/assets/bup.jpg` and `bup_logo.png` may be absent from repo | `src/pages/login.tsx` | 🟡 Medium |
| 8 | **Duplicate FeedbackPanel** — mounted in both `_app.tsx` and `Layout.tsx` simultaneously on teacher pages | `_app.tsx`, `Layout.tsx` | 🟢 Low |
| 9 | **Modal/toast state duplicated** — same pattern in homepage.tsx and assessment_score.tsx instead of shared component | multiple pages | 🟢 Low |

---

## 10. Environment Variables Required

Create `.env.local` (never commit this file):

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/BUP_obe
JWT_SECRET=<long-random-secret-minimum-32-chars>
EMAIL_USER=<smtp-email-address>
EMAIL_PASS=<smtp-password>
```

> Currently `src/lib/mongodb.ts` and `src/lib/mailer.ts` have these hardcoded — they must be moved to env vars before any deployment.

---

## 11. Domain Glossary

| Term | Meaning |
|---|---|
| **OBE** | Outcome-Based Education — the academic framework this system implements |
| **PO** | Program Outcome — one of 12 standard engineering competency goals (fixed in `constants.ts`) |
| **CO** | Course Objective — a specific learning goal for one course, mapped to one PO |
| **Session** | Academic term (e.g. "Jan-Jun 2024") |
| **Assessment** | An exam or evaluation event (Quiz, Midterm, Final, etc.) tied to a CO |
| **Pass Mark** | Minimum score to pass a CO assessment (set by teacher per assessment) |
| **Bloom's Taxonomy** | Cognitive level categorization (Remember, Understand, Apply, Analyze, Evaluate, Create) applied to COs |
| **Knowledge Profile** | Engineering knowledge type classification applied to COs |
| **Complex Engineering Problem / Activity** | WA (Washington Accord) attribute tags applied to COs |
| **BUP** | Bangladesh University of Professionals — the institution this system is built for |

---

## 12. Data Flow Walkthrough

### Teacher entering scores
1. Teacher logs in → `/api/login` → JWT cookie set
2. `/homepage` loads → `getTeacherIdFromAuth()` from cookie → `GET /api/teachers/[teacherId]` → teacher name + coursesTaught
3. Teacher selects course + session → `GET /api/getCourseObjectives?courseId=&session=&teacherId=` → CO list
4. Teacher edits COs → `POST /api/courseObjectives` → saved to MongoDB
5. Teacher navigates to `/assessment_score`
6. Selects course + session + CO → `GET /api/getStudentList` → student names
7. Creates assessment panel → enters scores → `POST /api/saveScores` → stored per-student per-assessment per-CO
8. Teacher views `/score_summary` → `GET /api/score_summary` → aggregated pass/fail per CO → rendered with PieChart

### Admin session/teacher management
1. Admin logs in → `/api/admin/login` → `admin_auth_token` cookie
2. `/admin/homepage` → `GET /api/admin/dashboard` → metrics, session list
3. `/admin/teacher-details` → `GET /api/admin/teachers` → list; `POST /api/admin/add-teacher` → new teacher
4. `/admin/course-offer` → `POST /api/admin/offer-courses` → link course to session
5. `/admin/student-entry` → `POST /api/admin/upload-student-list` (Excel) or `POST /api/admin/move-students`
