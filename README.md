# อยู่ต่อ · YooTor

**เพราะความห่วงใย ไม่ได้จบลงที่การจากลา**

A Thai-first legacy and estate organization MVP. Prepare essential information while alive; help an authorized family member organize what comes next. This is an organizational tool, not a law firm, a legally executed will, a tax calculator, or a government submission service.

## Run locally

Use Node **22 LTS (22.13+) or 24 LTS**, npm, and optionally Docker Desktop. The current workstation uses Node 23; checks are recorded below, but use an LTS version for deployment.

```sh
npm ci --legacy-peer-deps
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose **ทดลองใช้งานระบบ**. No paid AI service, email provider, or database is needed for local development. With no `DATABASE_URL`, the app stores data in AES-256-GCM-encrypted `.data/vault.enc`. It uses `DATA_ENCRYPTION_KEY` from the environment when set, otherwise it creates a development key in `.data/encryption.key`. These files are ignored by Git. Keep the key with the data: losing it makes the data unreadable.

Do not use the local file store across multiple processes. Production explicitly requires PostgreSQL and a deployment encryption key.

## PostgreSQL

```sh
docker compose up -d
cp .env.example .env
```

Uncomment `DATABASE_URL` in `.env` and set it to your PostgreSQL connection string. For an existing encrypted database, set `DATA_ENCRYPTION_KEY` to the **same key** used to encrypt its records. Anyone running the app against that database needs the same key. For a new, empty database, generate a random 32-byte encryption key:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set `DATA_ENCRYPTION_KEY` to that value. Never generate a replacement key for existing encrypted records, and never commit `.env` or the key. Set the same variables in your deployment environment when deploying.

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Restart the application after changing environment variables. Local file-store records are not automatically imported into PostgreSQL. The seed script creates a synthetic demonstration household without publishing credentials. The website's demo button creates or reuses the browser's isolated demo household.

The Compose password is for loopback-only local development. Use managed credentials, TLS (`sslmode=require` when required by the provider), backups, and restricted networking for deployment. Set `APP_ORIGIN` to the exact public HTTPS origin, without a trailing slash.

## Demonstrate the four flows

1. **Prepare:** register with an email and a password of at least 10 characters, explicitly consent, finish onboarding, add assets, upload documents, add a trusted contact, and save non-binding instructions. The dashboard recalculates an organizational readiness score. Each of five categories contributes 20 points; asset readiness requires all recorded asset entries to be marked complete. This is not a legal assessment.
2. **Family:** enter demo → choose **ทดลองมุมมองครอบครัว** → enter `somchai@example.test` and submit a request. No assets, documents, or instructions are visible yet. Switch back to the owner and review the request; choose verification pending, manual review, rejection, or approval with explicit categories. Switch back to family to see only permitted categories. Contact revocation removes access immediately. The family checklist works independently of private data access. This is simulated review, not identity or inheritance verification.
3. **Assistant:** open **ผู้ช่วย AI**, ask a question in Thai, and review suggested steps and official sources. Without a configured provider, responses are deterministic and visibly labeled. Context sharing is opt-in and server-filtered by current permissions.
4. **Tax:** open **แนวทางภาษี**, choose a situation and asset type, and work through the conditional preparation checklist. The questionnaire and completion selections persist in this browser under the signed-in user's identifier. It does not calculate liability or invent filing deadlines.

Demo owner: สมชาย ใจดี; family: มาลี ใจดี. Example data contains one house, two bank records, a vehicle, life insurance, private sample PDFs, a trusted contact, and personal instructions. Bank passwords, PINs, OTPs, identification numbers, and real account numbers are never requested.

## Application routes

| Route                 | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `/`                   | Marketing homepage and demo entry                                                        |
| `/register`, `/login` | Account creation, onboarding, sign-in                                                    |
| `/app`                | Readiness, assets, next steps, activity                                                  |
| `/app/assets`         | Search/filter and persisted asset CRUD                                                   |
| `/app/contacts`       | Trusted contacts, intended beneficiaries, administrator records and category permissions |
| `/app/documents`      | Private upload, metadata, preview, download and deletion                                 |
| `/app/instructions`   | Non-binding personal preferences and messages                                            |
| `/app/family`         | Request status, explicit review and scoped shared records                                |
| `/app/checklist`      | Six conditional Thai administrative tasks with notes and progress                        |
| `/app/assistant`      | Thai guidance and optional provider                                                      |
| `/app/tax`            | Educational questionnaire and preparation checklist                                      |
| `/app/settings`       | Profile, audit activity, JSON export and deletion                                        |
| `/privacy`            | Data-use notice and MVP limitations                                                      |

## Architecture

- Next.js App Router, React, TypeScript, Tailwind tooling, semantic responsive CSS, and Lucide icons. Native browser forms/dialogs provide validation, focus management, and keyboard dismissal. The installed stack includes React Hook Form and Zod; server boundary validation uses Zod.
- API route handlers delegate to a reusable server service in `src/lib/server.ts`. Client pages receive only an authorized state projection; private data is not shipped as static seed data in the client bundle.
- Prisma/PostgreSQL models: Household, User, Session, Asset, Contact, Document, Instruction, AccessRequest, ChecklistTask, AuditActivity. IDs and relations support resource ownership; personal payloads are encrypted individually at application level. Session tokens are random, stored only as SHA-256 hashes server-side, and carried in HttpOnly/SameSite cookies (Secure in production). Passwords use salted scrypt.
- The PostgreSQL adapter currently loads and writes the small MVP data set under a transaction advisory lock. This is suitable for bounded demonstrations, **not a scalable production query architecture**. Replace it with tenant-scoped queries and targeted row updates before real adoption. Encryption prevents indexing/search over personal payloads without an explicit searchable-data design.
- PDFs, PNGs and JPEGs are stored inside encrypted document records, not a public directory. Uploads have request-size limits, magic-byte checks, basic file-structure checks, a 10 MB per-file limit, 30-document limit and 50 MB household limit. These checks are not malware scanning. Production needs a private object store, virus scanning, and lifecycle controls.
- Every protected operation verifies the session and ownership. Family reads require an active matching trusted-contact record, an approved request, and both permission sets. Family task progress is separate from the owner's task progress. A contact marked as a beneficiary or administrator is merely a planning record; it does not establish legal inheritance or appointment rights.
- Sensitive mutations reject cross-origin requests. API/auth endpoints have in-process rate limits. Demo households expire after 24 hours and are bounded; expired records are cleaned on authentication. Production needs shared rate limiting, durable audit retention, and operational monitoring.

### API

`POST /api/auth` accepts `action: register | login | demo | logout`. `GET /api/state` returns authorized data only. `POST/PATCH/DELETE /api/{assets,contacts,instructions,tasks,profile,requests}` performs validated mutations (IDs in JSON). `POST /api/documents` accepts multipart `file`, `name`, `category`; `GET /api/documents/:id` authorizes downloads; `DELETE /api/documents` deletes owned documents. `POST /api/assistant` accepts `{message, includeContext?}`. `GET /api/export` downloads authorized JSON metadata; **document binaries must be downloaded separately**. `DELETE /api/account` removes the active account and its data (an owner deletion also removes that household's family links).

### Optional AI gateway

Set `AI_GATEWAY_URL` (HTTPS) and `AI_GATEWAY_KEY` on the server. The gateway accepts a POST JSON body `{ message, context?, language: "th", system }` and must return `{ message: string }`. API keys never reach the client. Explicit context consent sends only the permission-filtered fields constructed by the server. The app rejects invalid responses and uses a bounded request timeout. Uploaded PDF previews use the bundled Mozilla PDF.js renderer and a same-origin worker; PDFs are rendered to canvas, without executing document actions. No gateway is configured by default, and the live-provider path requires separate integration testing and privacy review.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The build uses Next.js’s supported webpack compiler because Turbopack CSS workers cannot bind their processing port in the managed build environment.

Optional local database checks (after migrations, with `DATABASE_URL` set in the shell):

```sh
npm run test:postgres
npm run test:production
```

The production smoke test starts and stops its own server on a free loopback port and accepts local PostgreSQL only. It reuses the local development encryption key for that isolated test database, not as a deployment recommendation.

Browser journeys, when the development server is running:

```sh
npm run test:e2e
```

The browser configuration uses installed Google Chrome by default. Alternatively run `npx playwright install chromium` and `PLAYWRIGHT_CHANNEL=chromium npm run test:e2e`.

The test suite covers authentication, validation, encrypted persistence, CRUD, document authorization, denied access, family approval and revocation, contact normalization, demo household isolation, checklist isolation, onboarding, quotas, and CSRF. Browser checks exercise the primary user journeys and responsive pages. Verification results and actual limits are recorded in `docs/verification.md` after running checks.

## Guidance sources and content maintenance

Content is marked reviewed **2026-11-05**, with conditions and verification warnings rather than universal deadlines. Recheck the relevant agency before acting:

- [DOPA registration guidance](https://www.bora.dopa.go.th/callcenter1548/guidebook)
- [Revenue Department: people liable for personal income tax](https://www.rd.go.th/548.html)
- [Revenue Department: inheritance tax overview](https://www.rd.go.th/56657.html)
- [Revenue Department: inheritance tax legislation](https://www.rd.go.th/61303.html)
- [Office of Insurance Commission](https://www.oic.or.th)

No automated legal determination, filing, banking integration, tax assessment, or refund promise is made.

## Before real customer data or launch

This MVP is not represented as production-ready or PDPA certified. Real family sign-in/access is deliberately blocked in production until proper email verification, identity verification, authority review and service delivery are implemented. Owner consent is collected, but full PDPA retention, lawful-basis analysis, processor agreements, support/contact processes, breach response and rights-request handling require professional review. The prototype has no password reset/email verification delivery, key rotation/recovery service, malware scanner, append-only audit store, or managed backup/deletion policy. Profile email is not editable, active-session/device management is not exposed, tax progress is browser-local, and assistant conversation history is not persistent. Data export contains metadata, not document binaries.

Priorities after demonstration: tenant-scoped database operations; verified invitations and manual review operations; private object storage and scanning; per-document grants; recovery/session management; durable content versioning and reminders; English localization dictionary; provider evaluations and professional-partner workflows.
