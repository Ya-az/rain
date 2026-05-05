---
mode: agent
description: Deep end-to-end UX + QA + Product audit and optimization of the RAIN competition system. Acts as Senior UX Designer, QA Engineer, and Product Manager simultaneously.
---

# 🚀 Senior UX + QA + Product Audit & Optimization

Act as a **Senior UX Designer, QA Engineer, and Product Manager** working on the RAIN robotics competition system in this workspace.

Perform a **deep, end-to-end audit and optimization** ensuring a **production-ready, high-quality user experience with zero functional issues**.

Scope: the entire app under [src/](../../src/) — views, scoring workflows, inspection logic, operations, check-in, and public results.

---

## 🧠 1. Product Thinking & Flow Redesign

- Evaluate the system as a complete product, not isolated components.
- Redesign flows where necessary to:
  - Reduce friction (fewer clicks, fewer modes)
  - Eliminate unnecessary steps
  - Improve decision clarity, especially for **referees scoring under time pressure**
- Every action must have a clear purpose and outcome — no orphan buttons.

## 🎨 2. Advanced UX/UI Optimization

- Standardize design patterns across the system: buttons, cards, tables, navigation, modals, toasts.
- Improve visual hierarchy, readability (Arabic + English / RTL + LTR), and action clarity.
- Interface must be **clean, consistent, and instantly understandable** — zero learning curve for a first-time referee or volunteer.
- Keep Tailwind utilities consistent (existing tokens like `brand-`, `ink-`, `saudi-`, `navy-`).

## ⚙️ 3. Deep Functional QA (End-to-End)

Walk every flow: **entry → action → result → persistence**.

Validate:
- No broken flows or dead clicks
- No inconsistent data between local state, Firestore, retry queue, and offline cache
- No UI/logic mismatches (e.g. button enabled when action will fail)
- Edge cases: offline, re-login, role switching, language toggle mid-flow

## 🔍 4. Critical Feature Validation (Must Be Perfect)

Ensure these are implemented correctly:

| Requirement | Acceptance Criteria |
|---|---|
| **Score persistence** | Scores remain consistent system-wide across reloads, devices, and offline → online transitions. Audit log records every write. |
| **Best Score column** | Appears as the **4th column** in scoring tables. Updates in real time. Logic verified for FastBot / LineFollow / a-Maze-ing. |
| **Inspection vs Scoring separation** | Two **independent** cards. Scoring must work even if inspection was skipped. Inspection results persist if performed. No coupling. |
| **Removal of match time distribution** | Completely removed from UI, state, utils, and any workflow. Search `fastbotSchedule`, `match time`, `time slot`, `distribution` and confirm zero references in active code paths. |

## ⚡ 5. Performance & System Behavior

- No perceptible delays on score submit, navigation, or table re-renders.
- Proper loading states (skeleton or spinner) for any async action > 200ms.
- Graceful error handling with actionable messages (Arabic + English).
- Success feedback via toast — never silent.
- Stable under rapid repeated input (referee tapping fast).

## 🧪 6. UX Edge Cases & Stress Testing

Simulate:
- Skipping inspection, going straight to scoring
- Re-entering / overwriting data
- Switching teams rapidly via QR scan
- Network drop mid-submit (retry queue must recover)
- Two referees scoring same team simultaneously
- Importing a new Excel while scoring is active

## 📊 7. Output Requirements

Produce a **structured report** in this exact shape:

### A. Issues Found
- **UX issues** — list with file links and severity (P0/P1/P2)
- **Functional bugs** — list with reproduction steps
- **Logical inconsistencies** — list with affected flows

### B. Improvements Made
- **UX enhancements** — what changed and why
- **Flow redesigns** — before/after summary
- **Performance fixes** — measurable impact where possible

### C. Final Validation
Checklist confirming:
- [ ] All features work flawlessly
- [ ] UX is smooth and intuitive (no learning curve)
- [ ] System is production-ready
- [ ] Score persistence verified
- [ ] Best Score column = 4th, real-time
- [ ] Inspection ⟂ Scoring (decoupled)
- [ ] Match time distribution fully removed
- [ ] RTL + LTR both polished
- [ ] Offline + retry queue verified

---

## 🔥 Mindset

- Do **not** just fix — **optimize and elevate**.
- Ship-grade quality: this runs in a live competition with referees and judges.
- Prioritize **clarity, speed, and zero-error experience**.
- When in doubt, prefer fewer steps, larger touch targets, and stronger visual feedback over cleverness.

## Execution Rules

1. Read relevant files before editing — never guess structure.
2. Make changes directly; don't just suggest.
3. After each batch of edits, run `npx vite build` to verify no regressions.
4. Preserve existing logic unless explicitly identified as broken.
5. Report findings using the exact structure in section 7.
