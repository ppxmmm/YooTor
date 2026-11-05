# Verification — 2026-11-05

Brand and intended outcome: อยู่ต่อ (YooTor), “เพราะความห่วงใย ไม่ได้จบลงที่การจากลา”. Working Thai preparation, reviewed family access, assistant, and tax-preparation flows.

| Check | Result | Evidence |
|---|---|---|
| `npm run lint` | Pass, exit 0 | Application, API, scripts and tests; generated PDF.js vendor files excluded |
| `npm run typecheck` | Pass, exit 0 | TypeScript 5.9.3 |
| `npm test` | Pass, 25 tests | Authentication, data/resource isolation, encrypted persistence, CRUD, file authorization, contact revocation, demo routing and quotas, onboarding, independent family progress, origin checks, bounded JSON, guidance and scoped provider context |
| `npm run test:e2e` | Pass, 6 journeys, 12.3s | Installed Chrome, headless, one worker; real local API and encrypted persistence |
| PDF preview | Pass | Real seeded PDF rendered to canvas, page 1/1, positive dimensions, no error/loader or console/page errors |
| `npm run build` | Pass, exit 0 | Next.js 16.4.5 supported webpack compiler; all static pages and dynamic API/app routes emitted |
| Dependency audit | Pass | npm reported 0 known vulnerabilities after exact-version lockfile synchronization |
| PostgreSQL migration | Pass | `202611050001_init` applied to dedicated local PostgreSQL17 container on localhost:55439 |
| PostgreSQL seed | Pass | Synthetic household created; no private credentials published |
| `npm run test:postgres` | Pass | Two service instances, persistence, IDOR denial, scoped family reads, task progress, PDF authorization and account deletion |
| `npm run test:production` | Pass | Built production server, PostgreSQL-backed auth/CRUD, HttpOnly/Secure/SameSite cookies, family isolation, deterministic guidance, real-family verification gate, deletion/session invalidation |
| Desktop/mobile | Pass | 1280×900 desktop and 390×844 mobile; mobile menu interaction, no horizontal overflow |

## Browser journeys

1. Demo entry → create/edit asset → reload/search → delete synthetic asset.
2. Private PDF preview → upload PDF → download → anonymous request rejected.
3. Save active synthetic contact and permissions → edit personal instruction → reload preserves it.
4. Family request → explicit owner approval of assets only → assets visible, documents/instructions absent → separate family checklist status and notes survive reload.
5. Ask Thai assistant → sourced, labeled response → conditional tax questionnaire and local checklist persist.
6. Register real test owner with consent/onboarding → profile update persists → mobile menu and asset empty state remain usable.

QA screenshots were saved outside source under `/private/tmp/yootor-desktop.png`, `/private/tmp/yootor-mobile.png`, and `/private/tmp/yootor-pdf-preview.png`. The in-app browser was also used for direct demo creation, asset persistence, family review, and PDF preview verification. Automated viewport checks use Playwright with installed Chrome.

## Resolved findings

- Internal Next URL versus browser-origin mismatch initially rejected localhost requests; same-host development origin and explicit production `APP_ORIGIN` now work, while cross-origin requests remain rejected.
- Demo owner-email routing initially could cross synthetic households; routing is now household-scoped, covered by a regression test.
- Public demo storage was unbounded; demo TTL, tenant/session/record/document quotas now apply.
- Browser PDF embedding was blocked; canvas rendering now uses authorized same-origin bytes and a bundled worker. The security policy was not relaxed for document frames.
- Toolchain dependency conflicts and known advisories were resolved using tested pinned versions.
- Turbopack CSS worker port binding is prohibited in the managed build environment even with the attempted build escalation. The documented webpack compiler produces the validated build.

## Material limitations

This is a tested local MVP, not a production compliance certification. Real family accounts fail closed in production until email/identity verification and authority-review delivery exist. Paid AI gateway requests were validated with mocks, not live provider credentials. HTTPS termination, private object storage, malware scanning, recovery/key rotation, shared rate limiting, immutable audit retention, backups and PDPA operations require deployment work and review. PostgreSQL currently serializes small encrypted data-set operations under a global transaction lock and must use tenant-scoped queries before scaling. Tax selections are browser-local; conversation history is not persisted; export includes metadata rather than document binaries. English navigation dictionaries exist, but full localization is unfinished.

The workstation is Node23.7 (outside the recommended LTS ranges); all recorded checks passed here. `.nvmrc` and README recommend Node22.13+ LTS or Node24 LTS. No external legal action, banking access, government filing, email delivery, or identity verification was simulated as having actually occurred.
