Student Success Audit – SJPIIC CICT

A Quality Assurance (QA) audit system for the College of Information and Communications Technology (CICT), St. John Paul II College of Davao (SJPIIC). It audits the root causes behind student pass / fail / drop outcomes and evaluates the effectiveness of instructors' teaching and assessment strategies across the Prelim, Midterm, and Final examination periods.

Instructors upload eClass gradebook data, the app computes verified descriptive statistics in code, and Gemini produces a formal QA audit report (findings, scorecard, and a PDCA/CAPA improvement plan) based on those statistics and the institution's benchmarks.

Deployment note: The app is deployed on Vercel production instead of Google Cloud Run. API keys are stored as Vercel Environment Variables, not in the source code or the repository.

Features
Google sign-in (Firebase Authentication) with per-instructor data isolation
Instructor profile (program, subjects taught, teaching and assessment strategies)
Gradebook upload (eClass export parsing via xlsx) with student anonymization before analysis
Computed statistics: pass/fail/drop/incomplete rates, per-period mean, median, pass rate, score trajectory, and attendance / quiz / activity correlations
AI-generated QA audit report (Gemini) with scorecard and PDCA/CAPA plan, including a prompt-injection defense for uploaded policy text
At-risk student module and period progression charts (Recharts)
Consultation chat with the AI auditor
Audit history saved per instructor in Firestore
Benchmarks (Company Basis): institutional passing grade, grading weights, and attendance policy
Super Admin console with read-only consolidated access across all instructors
Tech Stack
Layer	Technology
Frontend	React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Motion, Lucide
Backend	Serverless functions in /api (Vercel); the same handlers run locally through a Vite dev middleware (src/server/apiMiddleware.ts)
Auth / Database	Firebase Authentication (Google provider), Cloud Firestore
AI	Gemini API via @google/genai (model: gemini-2.5-flash)
Hosting	Vercel
Project Structure
├── api/                    # Vercel serverless functions
│   ├── audit.ts            #   POST /api/audit             – generates the QA audit
│   ├── chat.ts             #   POST /api/chat              – consultation chat
│   └── extract-document.ts #   POST /api/extract-document  – policy/document text extraction
├── src/
│   ├── components/         # UI views (Dashboard, Audit Report, Benchmarks, Super Admin, ...)
│   ├── server/             # Local dev API middleware (mirrors /api)
│   ├── utils/              # Grade calculations, eClass parser, anonymizer, audit fallback
│   ├── firebase.ts         # Firebase initialization and helpers
│   └── App.tsx
├── firestore.rules         # Firestore security rules
├── firebase-blueprint.json # Firestore data model
├── vercel.json             # API and SPA rewrites
├── .env.example            # Environment variable template
└── vite.config.ts
1. Environment Setup
Prerequisites
Node.js 20 LTS or newer (22 LTS recommended). The project uses Vite 8 and TypeScript 7, so older Node versions are not supported.
npm (bundled with Node) or Bun (a bun.lock is included)
A Firebase project with Authentication and Firestore (see section 2)
A Gemini API key from Google AI Studio
Install
bash
git clone https://github.com/eleriajohnpatrick-ux/Student-Success-Audit---SJPIIC-CICT.git
cd Student-Success-Audit---SJPIIC-CICT
npm install
Configure environment variables

Copy the template and fill in your values:

bash
cp .env.example .env.local
Variable	Required	Where used	Description
GEMINI_API_KEY	Yes	Server only (/api/*)	Gemini API key. Never prefix with VITE_ and never commit it.
APP_URL	Optional	Server	Public URL of the deployed app
VITE_FIREBASE_API_KEY	Optional	Client	Overrides firebase-applet-config.json
VITE_FIREBASE_AUTH_DOMAIN	Optional	Client	Overrides firebase-applet-config.json
VITE_FIREBASE_PROJECT_ID	Optional	Client	Overrides firebase-applet-config.json
VITE_FIREBASE_APP_ID	Optional	Client	Overrides firebase-applet-config.json
VITE_FIREBASE_DATABASE_ID	Optional	Client	Firestore database ID
VITE_FIREBASE_STORAGE_BUCKET	Optional	Client	Overrides firebase-applet-config.json
VITE_FIREBASE_MESSAGING_SENDER_ID	Optional	Client	Overrides firebase-applet-config.json

The VITE_FIREBASE_* variables are optional: if they are not set, src/firebase.ts falls back to firebase-applet-config.json. Firebase web config values identify the project and are not secret (access is enforced by Firebase Auth and firestore.rules), but GEMINI_API_KEY is secret.

.env* files are git-ignored (only .env.example is tracked).

Run locally
bash
npm run dev

The app starts at http://localhost:3000. The /api/* routes are served by the Vite dev middleware, so no separate backend process is needed.

Other scripts
Command	Purpose
npm run build	Production build to dist/
npm run preview	Preview the production build locally
npm run lint	Type-check with tsc --noEmit
npm run clean	Remove build output
2. Cloud APIs Enabled

Enable the following in your Firebase / Google Cloud project:

Service	Purpose	How to enable
Firebase Authentication (Google provider)	Instructor and Super Admin sign-in	Firebase Console → Authentication → Sign-in method → enable Google
Cloud Firestore	Profiles, audits, interactions, benchmarks	Firebase Console → Firestore Database → create database
Gemini API	AI audit generation, consultation chat, document extraction	Create a key in Google AI Studio (or enable the Generative Language API in Google Cloud)

Deploy the Firestore security rules from firestore.rules:

bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules

Rules summary:

users/{uid}, users/{uid}/interactions, users/{uid}/audits: readable and writable only by the owning user; readable by the Super Admin
companyBasis/*: readable by any signed-in user, writable only by the Super Admin
Everything else is denied by default
3. Secrets: Vercel Environment Variables

Secrets are configured as Vercel Environment Variables (in place of Google Secret Manager). They are never stored in the source code or the repository.

Open your project on Vercel → Settings → Environment Variables.
Add GEMINI_API_KEY with your Gemini API key.
(Optional) Add APP_URL and any VITE_FIREBASE_* overrides.
Select the Production environment (and Preview / Development if needed).
Click Save, then redeploy. Variables only apply to new deployments.

GEMINI_API_KEY is read only inside the serverless functions via process.env.GEMINI_API_KEY, so it is never exposed to the browser bundle. Do not rename it with a VITE_ prefix.

4. Vercel Production Deployment
Connect the repository: On vercel.com, choose Add New → Project, import this GitHub repository, and authorize access.
Build settings:
Setting	Value
Framework Preset	Vite
Install Command	npm install
Build Command	npm run build
Output Directory	dist
Node.js Version	20.x or newer (Project Settings → General)
Add environment variables as described in section 3 before the first deploy.
Click Deploy. Vercel builds the Vite app and publishes the files in /api as serverless functions. vercel.json routes /api/* to those functions and every other path to index.html (single-page app).
Redeploy whenever you change environment variables: Deployments → latest deployment → ⋯ → Redeploy. Pushes to the production branch (main) also trigger automatic redeploys.
5. Firebase Authorized Domains (required for Google sign-in)

Google sign-in will fail in production (auth/unauthorized-domain) until the Vercel domain is authorized in Firebase:

Open the Firebase Console → your project → Authentication → Settings → Authorized domains.
Click Add domain and enter your Vercel production domain, for example your-project.vercel.app (and any custom domain, without https://).
Save, then reload the production site and test Google sign-in.

Preview deployments use different *.vercel.app URLs. Add those domains too if you need to test sign-in on previews.

Security Notes
GEMINI_API_KEY lives only in Vercel Environment Variables and local .env.local (git-ignored).
Student data is anonymized before being sent for analysis (src/utils/anonymizer.ts).
Uploaded institutional policy text is treated as untrusted data in the audit prompt (prompt-injection defense).
Firestore rules enforce per-user isolation, with read-only Super Admin access for consolidated reporting.
Troubleshooting
Symptom	Likely cause and fix
auth/unauthorized-domain on sign-in	Vercel domain missing from Firebase Authorized domains (section 5)
/api/* returns 500 or AI features fail	GEMINI_API_KEY missing or not applied; set it in Vercel and redeploy
/api/* returns 404 on refresh or deep links	Check that vercel.json is present in the repository root
Missing or insufficient permissions	Firestore rules not deployed, or the user is not signed in
Build fails on Node errors	Set the Vercel Node.js version to 20.x or newer
