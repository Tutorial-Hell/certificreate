# Feature: Certificate history (local)

**From build-plan:** feature 7
**Status:** complete

## Goal

Every certificate generated in the browser gets remembered locally: a history
list you can re-open (reload its details into the form) or re-download (PNG/PDF)
without retyping anything, and the form itself remembers its last values across
a page reload so it's never blank on return.

## In scope

- A `CertificateHistoryEntry` saved to local storage after every successful
  PNG or PDF generation (recipient, course, date, instructor, template - no
  colors or logo, see Data/contracts).
- A bounded, most-recent-first history list, persisted across reloads.
- A history panel in the UI: shows entries, "Open" loads an entry back into the
  form and template picker, "PNG"/"PDF" re-generates and downloads that entry
  directly using the *current* brand settings.
- `LastFormValues` persisted to local storage on every change and restored on
  load, so the form isn't empty after a refresh.

## Out of scope

- Deleting or clearing individual history entries (or the whole list).
- Editing a saved history entry after the fact.
- Cross-device or server-side history - still local-storage-only, per the
  project's local-only v1 direction.
- Storing the rendered PNG/PDF itself - re-download regenerates on demand via
  the existing export routes, keeping local storage light.
- Date input/validation changes - that's feature 8 (Input polish).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - History storage module** - `lib/certificate/history.ts`: the
  `CertificateHistoryEntry` type, `CERTIFICATE_HISTORY_STORAGE_KEY`,
  `MAX_HISTORY_ENTRIES` (50), `parseCertificateHistory(raw)` (defensive - bad
  JSON, non-array, or malformed entries all degrade to `[]`/filtered out, never
  throw), and `addHistoryEntry(entries, entry)` (prepend, then cap at
  `MAX_HISTORY_ENTRIES`). *Done when:* `lib/certificate/history.test.ts` covers
  null input, corrupt JSON, a non-array payload, an array with one valid and one
  malformed entry, and the cap behavior on `addHistoryEntry`; `npm run test`
  passes.
- [x] **Step 2 - Last-form-values storage module** - `lib/certificate/last-form-values.ts`:
  the `LastFormValues` type, `LAST_FORM_VALUES_STORAGE_KEY`, and
  `parseLastFormValues(raw)` (same defensive style as
  `parseBrandSettings` - returns `null` for missing/corrupt/partial payloads
  instead of a partial object). *Done when:*
  `lib/certificate/last-form-values.test.ts` covers null input, corrupt JSON,
  and a partial/malformed payload alongside a fully valid one; `npm run test`
  passes.
- [x] **Step 3 - Wire persistence into the workspace** - add
  `lib/certificate/use-certificate-history.ts` (mirrors
  `use-brand-settings.ts`: loads history on mount, exposes `entries` and
  `addEntry`). In `CertificateWorkspace.tsx`: call `addEntry` with a new entry
  (`id` via `crypto.randomUUID()`, `createdAt` via `Date.now()`) right after
  every successful PNG/PDF download completes; restore `LastFormValues` into
  `data`/`templateId` on mount, and persist `data`/`templateId` on every change
  once the restore has run (guard the same way `useBrandSettings` guards its own
  load-then-persist ordering, so mount doesn't overwrite storage with the empty
  initial state before restoring). *Done when:* filling the form, downloading a
  PNG, and reloading the page shows the same form values pre-filled, and
  `localStorage.getItem("certificreate:history")` in the browser contains the
  new entry.

  **Environment issue hit during verification:** the local Puppeteer install
  couldn't launch its cached Chrome-for-Testing binary
  (`Symbol not found: _kVTCompressionPropertyKey_ReferenceBufferCount`), a
  macOS/Chrome-build compatibility problem in `.cache/puppeteer` unrelated to
  this feature's code - it reproduced identically on `main` before any of
  today's changes. Verified the real client-side wiring anyway by intercepting
  `/api/certificate/png` and `/pdf` in the browser (Playwright network
  routing) so the actual fetch -> blob -> download -> `addHistoryEntry` code
  path ran for real, just without the genuine Puppeteer render in the loop.
  Fixing the Chrome cache is a separate, unscoped follow-up (likely a "Clear
  build cache & deploy"-equivalent local Chrome re-fetch).

- [x] **Step 4 - History panel UI** - `components/certificate/CertificateHistoryPanel.tsx`:
  lists entries newest-first (recipient, course, date, template name,
  formatted timestamp), with an empty state when there are none; an "Open"
  button per entry that loads it into the form and template picker; "PNG" and
  "PDF" buttons per entry that re-run the existing download flow for that
  entry's data plus the *current* brand settings' colors/logo (this also
  appends a fresh history entry, same as any other generation - no
  special-casing). Mount it in `CertificateWorkspace.tsx`'s left column, below
  the form. *Done when:* generating two certificates shows both in the panel,
  newest first; clicking "Open" repopulates the form and preview; clicking
  "PNG"/"PDF" on an entry downloads a file and adds another history entry.

## Files / areas

- `lib/certificate/history.ts` (new)
- `lib/certificate/history.test.ts` (new)
- `lib/certificate/last-form-values.ts` (new)
- `lib/certificate/last-form-values.test.ts` (new)
- `lib/certificate/use-certificate-history.ts` (new)
- `components/certificate/CertificateHistoryPanel.tsx` (new)
- `components/certificate/CertificateWorkspace.tsx` (modified - wire both new
  hooks, mount the panel, save an entry after each successful download)

## Data / contracts

Matches `project-overview.md`'s data model exactly - already locked there, not
re-negotiated here:

```ts
type CertificateHistoryEntry = {
  id: string;
  recipientName: string;
  course: string;
  date: string;
  instructorName: string;
  templateId: string;
  createdAt: number; // epoch ms
};

type LastFormValues = {
  recipientName: string;
  course: string;
  date: string;
  instructorName: string;
  templateId: string;
};
```

Storage keys follow the existing `certificreate:*` convention:
`certificreate:history`, `certificreate:last-form-values`.

## Testing

`npm run test` (Vitest) is configured, so the test gate is on for logic-bearing
steps:

- Step 1 (`parseCertificateHistory`, `addHistoryEntry`) and Step 2
  (`parseLastFormValues`) are pure parsing/list logic with real edge cases
  (missing, corrupt, malformed, over-cap) - each ships a test, following the
  existing pattern in `lib/certificate/brand-settings.test.ts`. 35/35 tests
  pass (`npm run test`).
- Steps 3-4 are hook wiring, UI, and local-storage integration - not unit
  tested. Verified with the running app via Playwright: fill the form,
  download, reload - form and history panel restore correctly; "Open" and
  per-entry "PNG"/"PDF" re-download confirmed to use the entry's own data, not
  the currently-displayed form state.

## Notes for the AI

- Reuse the exact defensive-parsing shape from `lib/certificate/brand-settings.ts`
  (`isString` guards, try/catch around `JSON.parse`, safe fallback, never
  throw) for both new storage modules.
- Colors and logo are deliberately **not** stored per history entry - re-open
  and re-download always use the *current* `BrandSettings`, which is exactly
  what `project-overview.md`'s `CertificateHistoryEntry` shape (no color/logo
  fields) already implies.
- `addHistoryEntry` and `parseCertificateHistory`/`parseLastFormValues` must
  stay pure (entry `id`/`createdAt` generated at the call site) so they're
  trivially testable without mocking `crypto` or timers.
- All new hooks/components are client-only (`"use client"`), consistent with
  the rest of `components/certificate/`.
- Reuse the existing `downloadCertificate` flow in `CertificateWorkspace.tsx`
  for the history panel's PNG/PDF buttons rather than duplicating the fetch/blob
  logic. Implemented as a shared `buildHistoryEntry(data, templateId)` helper
  used by both the main download flow and per-entry re-download, plus a single
  `busy` flag gating all download buttons (main and per-entry) so only one
  render request goes out at a time.
