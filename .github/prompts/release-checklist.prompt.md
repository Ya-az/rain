---
mode: agent
description: Pre-deploy release checklist for the RAIN system. Runs build, lint, smoke flows, and verifies critical features before shipping.
---

# 🚦 Release Checklist — Pre-Deploy Verification

Act as a **Release Engineer** preparing the RAIN system for production deployment.
Run a strict, no-shortcuts pre-flight check. Fail loudly on any issue.

## Goals

- Catch regressions before they reach referees and judges in a live event.
- Verify the **critical event-day flows** still work end-to-end.
- Produce a clear go / no-go recommendation.

## Checks to Perform (in order)

### 1. Build & Static Quality

- Run `npx vite build` — must succeed with **0 errors**.
- Report bundle sizes; flag any chunk that grew > 20% vs typical (~95 KB for OperationsSystem, ~103 KB for CompetingSystem).
- If an ESLint config exists, run lint and report counts of errors/warnings.

### 2. Critical File Integrity

Verify these files exist and parse:
- [src/App.jsx](../../src/App.jsx)
- [src/firebase.js](../../src/firebase.js)
- [src/views/OperationsSystem.jsx](../../src/views/OperationsSystem.jsx)
- [src/views/CompetingSystem.jsx](../../src/views/CompetingSystem.jsx)
- [src/views/CheckInSystem.jsx](../../src/views/CheckInSystem.jsx)
- [src/views/PublicResults.jsx](../../src/views/PublicResults.jsx)
- [src/components/inspection/inspectionLogic.js](../../src/components/inspection/inspectionLogic.js)
- [src/scoring/ScoringCards.jsx](../../src/scoring/ScoringCards.jsx)
- [src/utils/excelImport.js](../../src/utils/excelImport.js)
- [src/utils/retryQueue.js](../../src/utils/retryQueue.js)
- [src/utils/audit.js](../../src/utils/audit.js)
- [firestore.rules](../../firestore.rules)

### 3. Configuration Sanity

- [public/manifest.webmanifest](../../public/manifest.webmanifest) — name, icons, start_url present.
- [public/sw.js](../../public/sw.js) — service worker version bumped if assets changed.
- [vite.config.js](../../vite.config.js) — no debug flags, no `mode: 'development'` overrides.
- No `console.log` left in scoring or submit paths (warnings allowed in dev-only utilities).
- No `TODO`, `FIXME`, or `XXX` markers in critical paths (scoring, submit, persistence).

### 4. Secrets & Security

- No hard-coded API keys, tokens, or passwords in `src/` (other than the documented mock dev passwords in [src/constants/mockData.js](../../src/constants/mockData.js)).
- [firestore.rules](../../firestore.rules) — confirm role checks for `admin`, `region_admin`, `ref`, `volunteer`. Public reads only on results collection.
- No `.env` committed to git.

### 5. Smoke Flow Verification (read-only — verify wiring)

Trace each flow in code and confirm no broken links:

- [ ] **Login** → role routing → correct landing view per role
- [ ] **Check-In** → QR scan → team lookup → attendance toggle → save → status update
- [ ] **Operations → Teams tab** → import Excel preview → confirm → roster updates
- [ ] **Operations → Dashboard** → score approvals → approve/reject → audit log entry
- [ ] **Competing System** → select category → open team → inspection card independent → scoring card independent → submit → score persists
- [ ] **Public Results** → renders rankings from same source as scoring

### 6. Critical Feature Re-Check

Confirm previous audit items still hold:
- Best Score column = **4th column** in scoring tables.
- Inspection and Scoring are **decoupled** (scoring works if inspection skipped).
- Match time distribution: **0 references** in active code (`grep -r "fastbotSchedule\|matchTime\|timeSlot"` should be empty or only legacy comments).
- Score persistence: writes go to Firestore + audit log + retry queue on failure.

### 7. Browser Compatibility Sanity

- App targets modern browsers (ES2020+). No untranspiled top-level `await` outside modules.
- RTL layout doesn't break on Safari iOS (no `dir="rtl"` swallowing flex order).

## Output

Produce this report:

```
## 🚦 Release Verification — <date>

### Build
- vite build: ✅ / ❌
- bundle deltas: <list>

### Static checks
- console.log in critical paths: <count>
- TODO/FIXME in critical paths: <count>
- secrets scan: ✅ / ❌

### Smoke flows
- Login routing:        ✅ / ⚠️ / ❌  <notes>
- Check-In:             ✅ / ⚠️ / ❌  <notes>
- Excel import:         ✅ / ⚠️ / ❌  <notes>
- Score approvals:      ✅ / ⚠️ / ❌  <notes>
- Scoring + persistence:✅ / ⚠️ / ❌  <notes>
- Public results:       ✅ / ⚠️ / ❌  <notes>

### Critical features
- Best Score = col 4:        ✅ / ❌
- Inspection ⟂ Scoring:      ✅ / ❌
- No matchTime references:   ✅ / ❌
- Persistence wired:         ✅ / ❌

### Recommendation
GO / NO-GO — <one-line reason>

### Blockers (if NO-GO)
1. <issue> — <file:line> — <fix needed>
```

## Rules

- Do **not** modify code in this prompt — verification only.
- If you find a P0 blocker, stop and report immediately; do not continue checks.
- Run terminal commands sequentially; show actual output, not summaries.
