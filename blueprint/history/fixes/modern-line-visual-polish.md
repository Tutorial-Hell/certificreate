# Fix: Make the Modern Line template more attractive

**Type:** Fix
**Status:** complete

## The problem

The "Modern Line" template (`components/certificate/ModernLineTemplate.tsx`,
added in feature 5) read as flat and generic: a thin single-color outline,
plain black headline, and a bare-outline logo circle, with no real use of the
certificate's two accent tokens (`--cert-border`, `--cert-border-inner`)
beyond the outline and a short underline rule.

Found via direct user feedback after trying the new template in the app.

## The fix

Made the design more visually interesting using only the existing `--cert-*`
tokens (no new colors, per feature 5's locked "sharing one theme" decision):

- A solid `--cert-border` "spine" bar along the left edge (14px), replacing
  the outline as the design's primary visual anchor.
- Two-tone headline: "Certificate" in `--cert-ink`, "of Completion" in
  `--cert-border`.
- The accent rule under the headline now uses `--cert-border-inner` (a
  distinct secondary tone from the spine).
- The logo mark gets a soft `--cert-border` tint background
  (`bg-[var(--cert-border)]/10`) behind its outline instead of plain white.
- The recipient name gets a colored underline (`--cert-border-inner`)
  instead of plain text.

Only `ModernLineTemplate.tsx` changed - Black Border, the export routes, and
the picker were untouched.

## Build steps

- [x] **Restructure `ModernLineTemplate.tsx`'s outer layout** to a left spine
  bar + content column, and apply the five visual changes above. *Done
  when:* a real PNG render of `templateId=modern-line` shows the new design
  correctly, a long-name/long-course stress render still wraps cleanly with
  no clipping, and Black Border's own render is byte-for-byte unaffected.

## Verify

- `npm run verify` passes (typecheck, 10/10 tests, build).
- Real PNG renders via `POST /api/certificate/png`: a normal sample and a
  long-name ("Bartholomew Alexandra Montgomery") / long-course ("Advanced
  Full-Stack Web Development With React and Node.js") stress test both
  rendered correctly, no clipping.
- `git diff --stat` confirmed only `ModernLineTemplate.tsx` (plus the spec)
  changed.

## Findings

_No findings ledger entries were open against this work._
