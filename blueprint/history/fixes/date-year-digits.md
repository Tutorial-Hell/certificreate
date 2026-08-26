# Fix: date field accepts a 5-digit year

**Type:** Fix
**Status:** complete

## The problem

The certificate date field is a native `<input type="date">` (added in
feature 8). The HTML spec only requires the year segment to have "four or
more digits," so a real browser lets a user type a 5-digit year (e.g.
`08/09/20260`), producing the ISO value `"20260-08-09"`.

`certificateFormSchema`'s `date` field (`lib/certificate/schema.ts`) only
checks that the value is non-empty - no format or range check - so this value
passes validation on both the client and the server, and `canDownload`
(gated by `validateCertificateData`) stays true.

`formatCertificateDate` (`lib/certificate/date.ts`) expects exactly 4 digits
via `/^(\d{4})-(\d{2})-(\d{2})$/`. A 5-digit year doesn't match, so the
function falls back to its "don't throw, return input unchanged" path -
which means the raw, unformatted string `"20260-08-09"` renders directly on
the certificate, in the live preview **and** in a real PNG/PDF export, since
nothing blocks the export in this case.

Feature 8's spec explicitly reasoned that "the browser's HTML5-constrained
control" made a date format/range check unnecessary server-side - that
assumption was wrong; the native control does not guarantee a 4-digit year.

Found via user report: "I am able to assign the year a five digit date. Is
that a bug?" Reproduced directly - `dateInput.fill('20260-08-09')` is
accepted by the browser, passes validation, and the certificate preview
shows the literal string `20260-08-09` instead of a formatted date.

## The fix

- `lib/certificate/date.ts`: extract the existing calendar-validity check
  inside `formatCertificateDate` into a standalone, exported
  `isValidIsoDate(value: string): boolean` (exactly 4-digit year, valid
  month/day, matches a real calendar date - same logic already there, just
  named and reusable). `formatCertificateDate` calls it instead of
  duplicating the check.
- `lib/certificate/schema.ts`: the `date` field gains
  `.refine(isValidIsoDate, "Enter a valid date")` after the existing
  `min(1, "Date is required")`, so an invalid-but-non-empty date (5+ digit
  year, an impossible calendar date, garbage input from a direct API call)
  is rejected with a visible message instead of silently passing through -
  same mechanism the other three fields already use for their errors.
- `BlackBorderTemplate.tsx` / `ModernLineTemplate.tsx`: the date's
  empty-state placeholder condition (`withPlaceholder`, from feature 8)
  switches from "is the formatted string empty" to "is `data.date` empty or
  invalid" (`!data.date.trim() || !isValidIsoDate(data.date)`), so the live
  preview shows the muted "MM/DD/YYYY" placeholder instead of a raw broken
  ISO string while the date is invalid - not just while it's empty.

Must not change `formatCertificateDate`'s existing behavior for already-valid
dates, or its "return the input unchanged" fallback for genuinely malformed
input reaching it directly (defense in depth - the schema is now the primary
gate, but the formatter still shouldn't throw).

## Build steps

- [x] **Add `isValidIsoDate`, wire it into the schema and both templates'
  placeholders** - `lib/certificate/date.ts`, `lib/certificate/schema.ts`,
  `BlackBorderTemplate.tsx`, `ModernLineTemplate.tsx`. *Done when:*
  `lib/certificate/date.test.ts` gets a case for `isValidIsoDate` covering a
  5-digit year (`false`) alongside the existing valid/invalid cases;
  `lib/certificate/schema.test.ts` gets a case asserting a 5-digit-year date
  is rejected with "Enter a valid date"; in the running app, typing a
  5-digit year into the date field shows that inline error, disables the
  download buttons, and the live preview shows the "MM/DD/YYYY" placeholder
  instead of the raw ISO string; picking a normal valid date still works
  exactly as before (regression check).

  **Direct consequence caught during implementation:** chaining
  `.refine(isValidIsoDate, ...)` after the existing `.min(1, "Date is
  required")` means Zod now emits *two* issues for an empty date (it fails
  both checks). `parseCertificateRequest` (`lib/certificate/request.ts`) was
  mapping every issue straight into its error array unfiltered, so an empty
  date's API error became the redundant "Date is required, Enter a valid
  date" instead of just "Date is required." Fixed in the same step by
  deduping to one message per field - keeping only the first issue per
  `issue.path[0]` - matching `validateCertificateData`'s existing per-field
  error shape, which already only kept one message per field. Not a
  separate bug filed later; closed alongside the fix it was a direct result
  of.

## Verify

- `npm run verify` (typecheck, test, build) passes - 66/66 tests.
- Browser: type a 5-digit year into the date field - inline "Enter a valid
  date" error appears on blur, Download PNG/PDF stay disabled, preview shows
  the muted "MM/DD/YYYY" placeholder instead of the raw broken string
  (screenshot confirmed).
- Browser: correct to a valid date (e.g. `2026-08-09`) - error clears,
  preview shows "AUG 9, 2026" correctly, downloads re-enable (screenshot
  confirmed). Confirms no regression on the valid-date path feature 8
  already covered.
- `formatCertificateDate`, `isValidIsoDate`, and
  `validateCertificateData`/`certificateFormSchema`/`parseCertificateRequest`
  are pure logic covered by the test gate (`npm run test`); this fix extends
  their existing test files (`date.test.ts`, `schema.test.ts`,
  `request.test.ts`) rather than adding new ones.

## Findings

_No findings ledger entries were open against this work._
