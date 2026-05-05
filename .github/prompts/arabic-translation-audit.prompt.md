---
mode: agent
description: Audit the Arabic translations file for missing keys, English-only fallbacks in the Arabic table, and untranslated hard-coded strings in JSX. Produces a fix plan and applies safe edits.
---

# 🌐 Arabic Translation Audit

Act as a **Localization QA Engineer** for the RAIN system. The product runs in Arabic-first contexts (Saudi competitions). Any English string leaking into the Arabic UI is a P1 issue.

## Scope

- Source of truth: [src/constants/translations.js](../../src/constants/translations.js)
- Consumers: every `*.jsx` under [src/](../../src/) that uses `t(lang, '<key>')`
- Hard-coded strings: look for raw text in JSX that should go through `t()`

## What To Check

### 1. Missing Keys

For every key present in the **English** table (`translations.en` or equivalent), confirm it exists in the **Arabic** table. Report keys that are missing or where the Arabic value is identical to the English value (likely untranslated).

### 2. Orphan Keys

Find keys that exist in `translations.js` but are **never referenced** in any `*.jsx` or `*.js` file under [src/](../../src/). These are dead weight — list them but do not delete without user confirmation.

### 3. Hard-coded Strings in JSX

Scan all `*.jsx` files for:
- `>EnglishText<` patterns where the text is human-readable (not a code identifier or symbol)
- `placeholder="..."`, `title="..."`, `aria-label="..."` with literal English text
- Inline ternaries like `lang === 'ar' ? '...' : '...'` — these should ideally be moved to the translations table for consistency (flag, don't auto-fix unless trivial)

Ignore:
- Code identifiers, IDs, CSS classes, file paths, URLs
- Mathematical/numeric symbols
- Console logs and dev-only strings
- Documented mock data ([src/constants/mockData.js](../../src/constants/mockData.js))

### 4. RTL-Specific Issues

While scanning, also flag:
- `pl-` / `pr-` / `ml-` / `mr-` Tailwind classes that should be `ps-` / `pe-` / `ms-` / `me-` for RTL safety.
- Hard-coded LTR-only icons or arrows that don't flip with `dir="rtl"`.
- `text-left` / `text-right` that should be `text-start` / `text-end`.

### 5. Punctuation & Number Formatting

- Arabic strings should use Arabic punctuation where appropriate (`،` not `,`, `؟` not `?`).
- Mixed-direction strings (Arabic with English IDs) should use `&lrm;` / `&rlm;` markers if rendering breaks.

## Fix Strategy

- **Auto-fix** (safe): missing Arabic keys with obvious translations, `pl-/pr-` → `ps-/pe-`, `text-left/right` → `text-start/end`.
- **Propose** (ask first): inline ternaries to migrate, orphan keys to delete, ambiguous translations.
- **Report only**: hard-coded strings — list with file:line and suggested key name; let user confirm before refactoring (could break other languages).

## Output Format

```
## 🌐 Arabic Translation Audit — <date>

### Summary
- Total keys (EN): <n>
- Total keys (AR): <n>
- Missing in AR: <n>
- Likely untranslated (AR == EN): <n>
- Orphan keys: <n>
- Hard-coded JSX strings: <n>
- RTL class issues: <n>

### A. Missing Arabic Keys
| Key | English | Suggested Arabic | File:line of first use |
|---|---|---|---|
| ... | ... | ... | ... |

### B. Untranslated (AR == EN)
| Key | Value | File:line |
|---|---|---|

### C. Orphan Keys (in table, never referenced)
| Key | Value | Action |
|---|---|---|
| ... | ... | safe to delete / keep (reason) |

### D. Hard-coded Strings in JSX
| File:line | Text (EN) | Suggested key | Suggested AR |
|---|---|---|---|
| ... | ... | ... | ... |

### E. RTL Class Issues
| File:line | Current | Should be |
|---|---|---|

### F. Auto-Fixes Applied
- <count> missing AR keys filled
- <count> directional class swaps
- <count> punctuation corrections

### G. Awaiting User Confirmation
- <list of proposed but not applied changes>

### Build
- vite build: ✅ / ❌
```

## Rules

1. **Never delete** a key without explicit user approval.
2. **Never refactor** a hard-coded string out of JSX without confirming the new key name with the user.
3. After applying auto-fixes, run `npx vite build` to verify.
4. If a translation requires domain knowledge (technical robotics terms), **ask the user** — do not guess.
5. Preserve existing key naming conventions (camelCase, no namespacing unless already used).
6. Do not reformat the entire translations file — only edit the specific lines needed.
