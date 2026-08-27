# Clear certificate history list

## Type: Fix

## The problem

The certificate history panel (`components/certificate/CertificateHistoryPanel.tsx`)
lists past certificates from local storage but has no way to remove entries.
`lib/certificate/history.ts` only exposes `addHistoryEntry`; there's no
`removeHistoryEntry` or `clearHistory`, and `use-certificate-history.ts` only
exposes `addEntry`. Once the list fills with old test/demo certificates, the
user has no way to reset it short of clearing all site data.

## The fix

Add a "Clear History" action that wipes the whole list, since there's no
per-entry delete today and adding one isn't in scope for this fix.

- `lib/certificate/history.ts`: add `clearHistory()` that removes the local
  storage key (mirrors the existing best-effort try/catch style already used
  by the read/write helpers).
- `lib/certificate/use-certificate-history.ts`: add a `clearEntries` function
  to the hook that calls `clearHistory()` and resets `entries` to `[]`.
- `components/certificate/CertificateHistoryPanel.tsx`: add a "Clear History"
  button, shown only when `entries.length > 0`. No dialog/alert component
  exists in this codebase yet (confirmed - no shadcn, no radix, no
  `components/ui`), so use a simple two-step confirm: first click turns the
  button into "Confirm clear?" (styled as a warning/destructive action using
  existing Tailwind conventions in this file), second click within the same
  render calls `onClearHistory`; clicking anything else or a brief timeout
  resets it back to the initial label. Wire the new prop from
  `CertificateWorkspace.tsx` to `clearEntries`.
- Must not affect `LastFormValues` (last-used form values) or existing
  brand settings - only the history list local storage key.

## Build steps

1. [x] Add `clearEntries` to `use-certificate-history.ts`, add the
   confirm-then-clear button to `CertificateHistoryPanel.tsx`, and wire it
   through `CertificateWorkspace.tsx`.
   **Done when:** with history entries present, clicking "Clear History" shows
   a confirm state, clicking again empties the list and the panel's
   empty-state renders; reloading the page keeps the list empty (local storage
   was actually cleared); unrelated history entries (e.g. from Playwright/dev
   testing) are unaffected by any other local storage key.
   **Verified:** manual browser check (seeded history via localStorage,
   clicked Clear History twice, confirmed empty-state and localStorage key
   cleared, reloaded and confirmed it stayed empty, confirmed last-form-values
   key untouched). `npm run verify` passes (76 tests, build clean).
   **Deviation from spec:** no dedicated unit test for the clear action. The
   localStorage side effect (`localStorage.removeItem`) was kept in the hook
   alongside the existing untested read/write effects, matching the codebase's
   existing split: `lib/certificate/history.ts` holds only pure, unit-tested
   logic (parse/add), while `use-certificate-history.ts` owns all localStorage
   IO and isn't unit-tested (no jsdom/happy-dom in this project, and adding one
   was out of scope for this small fix).

## Verify

- Run `npm run verify` (typecheck, test, build).
- Manually: generate 1-2 certificates so history has entries, open the
  history panel, click "Clear History", confirm, verify the list empties and
  the empty-state message shows; reload the page and confirm history stays
  empty.

## Findings

_No findings recorded against this fix._
