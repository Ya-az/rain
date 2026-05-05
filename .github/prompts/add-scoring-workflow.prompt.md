---
mode: agent
description: Scaffold a new scoring workflow / category for the RAIN system following existing patterns (FastBot, Sumo, etc.). Wires category, styles, scoring card, and translations.
---

# 🛠️ Add Scoring Workflow

Act as a **Senior Frontend Engineer** familiar with the RAIN codebase. Scaffold a new scoring workflow (category) following the **exact patterns** already used by FastBot, Sumo, SoccerBot, AI Innovation, etc.

## Inputs to Collect First

Before writing any code, ask the user (use `ask-questions` if available) for:

1. **Category ID** — `c<group>_<slug>` (e.g. `c1_drone`, `c2_tugofwar`)
2. **English name + Arabic name**
3. **Group** — 1 (timed runs), 2 (matches/brackets), or 3 (project / judging)
4. **Levels** — subset of `['ES', 'MS', 'HS', 'US']`
5. **Scoring model**:
   - timed (lower = better, like FastBot)
   - points (higher = better)
   - bracket (win/lose, like Sumo/Soccer)
   - judged rubric (multi-criteria sum)
6. **Inspection needed?** — yes/no
7. **Icon emoji + gradient colors** (from/to hex)
8. **Robot/category image filename** under [public/img/categories/](../../public/img/categories/)

## Files to Touch

Use file links to verify each path before editing:

| File | Change |
|---|---|
| [src/constants/mockData.js](../../src/constants/mockData.js) | Append to `MOCK_CATEGORIES` and `CATEGORY_STYLES`. If timed/points-based, add config defaults to `DEFAULT_SYSTEM_CONFIG`. |
| [src/constants/translations.js](../../src/constants/translations.js) | Add EN + AR keys for category name and any custom labels. |
| [src/scoring/workflows/](../../src/scoring/workflows/) | Create new file `<CategoryName>Workflow.jsx` modeled after the closest existing workflow for the chosen scoring model. |
| [src/scoring/ScoringCards.jsx](../../src/scoring/ScoringCards.jsx) | Register the new workflow in the routing/dispatch logic. |
| [src/views/CompetingSystem.jsx](../../src/views/CompetingSystem.jsx) | Add column/tab handling if the category needs a custom view. |
| [src/views/PublicResults.jsx](../../src/views/PublicResults.jsx) | Add the category to the public leaderboard rendering. |
| [src/utils/exportResults.js](../../src/utils/exportResults.js) | Add a sheet for the new category. |

## Required Patterns

- **ID format**: `c<group>_<slug>` lowercase, no spaces.
- **Scoring writes**: must go through the same submission helper used by existing categories — never write to Firestore directly from a new component.
- **Best Score column** stays as **column 4** in any tabular view.
- **Inspection card and Scoring card are independent** — never gate scoring on inspection completion.
- **Audit log**: every score write must call the existing `logAudit` helper from [src/utils/audit.js](../../src/utils/audit.js).
- **Retry queue**: failed writes auto-enqueue via [src/utils/retryQueue.js](../../src/utils/retryQueue.js) — use the same wrapper used by other workflows.
- **i18n**: every visible string goes through `t(lang, key)` from [src/constants/translations.js](../../src/constants/translations.js). No hard-coded EN/AR strings in JSX.
- **Tailwind tokens**: use existing `brand-`, `ink-`, `saudi-`, `navy-` palette. Do not invent new colors outside `CATEGORY_STYLES`.
- **RTL**: the parent view already sets `dir`. Do not override it. Use logical properties (`me-`, `ms-`, `ps-`, `pe-`).
- **Mobile-first**: verify touch targets ≥ 44px and tables collapse to cards on `sm:`.

## Steps

1. Confirm inputs with the user.
2. Identify the closest existing workflow file as the template (timed → FastBot, bracket → Sumo, judged → Gaming/WebDesign, points → LineFollowing).
3. Read that template fully — do not paraphrase from memory.
4. Create the new workflow file mirroring the template's structure: same hooks, same submission flow, same toast/error patterns.
5. Wire registration in [src/scoring/ScoringCards.jsx](../../src/scoring/ScoringCards.jsx).
6. Append category metadata in [src/constants/mockData.js](../../src/constants/mockData.js).
7. Add translations.
8. Update export and public results.
9. Run `npx vite build` — must succeed.
10. Run a manual smoke check: imagine a referee opening the new category — verify there are no dead clicks.

## Output

Report this exact format:

```
## ✅ Workflow Added: <Category Name>

### Files modified
- <file>:<line range> — <what changed>
- ...

### Files created
- <file> — <purpose>

### Build
- vite build: ✅ / ❌
- new bundle size: <kb>

### Smoke check
- Category appears in list:        ✅
- Inspection card independent:     ✅
- Scoring card independent:        ✅
- Score persists to Firestore:     ✅
- Appears in Public Results:       ✅
- Appears in Excel export:         ✅
- AR + EN labels render:           ✅

### Follow-ups (optional)
- <suggestion>
```

## Rules

- Do **not** copy-paste large blocks from one workflow to another without adapting names and scoring logic.
- Do **not** introduce a new state-management pattern; reuse existing hooks/context.
- Do **not** skip the build verification.
- If any required input is unclear, **ask** — do not guess.
