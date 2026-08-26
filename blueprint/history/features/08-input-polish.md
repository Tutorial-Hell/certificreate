# Feature: Input polish

**From build-plan:** feature 8
**Status:** complete

## Goal

Round off the input experience before production hardening: a real date
picker instead of free text, shared Zod validation with visible inline errors
on both the form and the API, long recipient names that shrink to fit instead
of overflowing the certificate, and a live preview that shows placeholder
copy instead of blank space when the form is empty.

## In scope

- Native date picker in the form; `CertificateData.date` becomes the raw ISO
  date (`yyyy-mm-dd`), formatted to a display string only where it's
  rendered (both templates), so preview and export always format identically.
- A shared Zod schema (`lib/certificate/schema.ts`) as the single source of
  truth for "is this certificate data valid" - required fields, trimmed, and
  capped at a sane max length - used by both the client form (inline errors,
  download-button gating) and the server request parser (`request.ts`).
- Long recipient names shrink to fit on one line instead of overflowing,
  in both templates, in both the live preview and the actual PNG/PDF export.
- Empty/incomplete form fields show muted placeholder copy in the live
  preview instead of rendering blank.

## Out of scope

- Auto-fit for the course or instructor fields - only `recipientName` is
  addressed; those fields have historically stayed short in practice, and the
  build-plan line names "long-name" singular. Can be revisited later if it
  becomes a real problem.
- A rich date-range or multi-format date picker - the browser's native
  `<input type="date">` is enough for a single completion date.
- Migrating old `certificreate:history` / `certificreate:last-form-values`
  entries saved before this feature - see **Notes for the AI**.
- Any change to brand settings, history, or the export pipeline's routes -
  only the request-parsing/validation layer inside it changes.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Date picker + formatting** - `lib/certificate/date.ts`:
  `formatCertificateDate(isoDate: string): string` (pure - parses `yyyy-mm-dd`
  into e.g. "Aug 9, 2026"; on anything that doesn't parse as a valid date,
  returns the input unchanged rather than throwing or showing "Invalid
  Date"). `CertificateForm.tsx`'s date field becomes `<input type="date">`
  bound directly to `data.date` (now the raw ISO string, not a display
  string). `BlackBorderTemplate.tsx` and `ModernLineTemplate.tsx` render
  `formatCertificateDate(data.date)` instead of `data.date` directly. *Done
  when:* `lib/certificate/date.test.ts` covers a valid date, an empty string,
  a malformed string, and a date on each side of midnight UTC (to prove no
  timezone-shift bug - see **Notes for the AI**); picking a date in the
  running app shows the formatted string in the live preview immediately.

- [x] **Step 2 - Shared Zod validation** - add `zod` as a dependency.
  `lib/certificate/schema.ts`: `certificateFormSchema` (a `z.object` over
  `recipientName`, `course`, `date`, `instructorName` - each `.trim().min(1,
  ...)`, `recipientName`/`instructorName` capped at 100 chars,
  `course` capped at 150) and `validateCertificateData(data)` (pure wrapper
  returning `{ valid: boolean; errors: Partial<Record<field, string>> }` from
  `safeParse`). Wire it in three places: `lib/certificate/request.ts`'s
  `parseCertificateRequest` uses `certificateFormSchema.safeParse` instead of
  the manual required-field check (evolving `ParsedCertificateRequest`'s
  failure shape from `{ missing: string[] }` to `{ errors: string[] }` with
  real messages - update both `app/api/certificate/png/route.ts` and
  `.../pdf/route.ts`'s error response to use it, and update
  `request.test.ts`'s assertions and date fixture to ISO format);
  `CertificateWorkspace.tsx` replaces its ad hoc `isComplete` helper with
  `validateCertificateData(data).valid`; `CertificateForm.tsx` shows each
  field's error message beneath it once that field has been blurred, and adds
  `maxLength` to the text inputs matching the schema's caps. *Done when:*
  `lib/certificate/schema.test.ts` and the updated `request.test.ts` pass;
  in the running app, blurring an empty required field shows its error,
  typing a valid value clears it, and the download buttons stay disabled
  until the whole form is valid.

  **Bug caught during implementation:** Zod's built-in type check ran before
  the custom "is required" message for a field entirely absent (`undefined`)
  from a raw API body, producing "Invalid input: expected string, received
  undefined" instead. A direct API caller can easily omit a key rather than
  sending an empty string, so this was a real gap. Fixed with a
  `requiredTrimmedString` preprocessor in `schema.ts` that normalizes any
  non-string to `""` before validation, so every missing/blank field reports
  the same friendly message regardless of whether the key was present.

- [x] **Step 3 - Long recipient-name auto-fit** -
  `lib/certificate/auto-fit.ts`: `computeFitScale(availableWidth: number,
  naturalWidth: number): number` (pure - `1` when the text already fits or
  either input is non-positive, `availableWidth / naturalWidth` when it
  overflows; never returns more than `1`, so it only ever shrinks).
  `lib/certificate/use-auto-fit-font-size.ts`: a client hook that measures a
  ref'd element's `clientWidth` (available) against its `scrollWidth`
  (natural) at a given base font size, applies `computeFitScale`, and
  re-measures once `document.fonts.ready` resolves (the self-hosted serif
  font can still be loading when the hook's first effect runs - see **Notes
  for the AI**). Both templates mark `"use client"`, wrap the recipient-name
  element in a fixed-width container sized to the certificate's actual safe
  content area, and apply the hook to it (base sizes: 40px in
  `BlackBorderTemplate`, 44px in `ModernLineTemplate` - their current
  values). *Done when:* `lib/certificate/auto-fit.test.ts` covers fits,
  overflows, and a zero/negative-width edge case; in the running app, a very
  long recipient name (40+ characters) shrinks to stay on one line in both
  templates without overflowing the certificate frame (screenshot both the
  live preview and a real PNG export); a short name is visually unchanged
  from before this step.

  **Real bug caught during verification, not left in:** the first version of
  the hook imperatively reset `el.style.fontSize` to the base size inside
  `measure()` before reading `scrollWidth`. When a later measurement (the
  `document.fonts.ready`-triggered re-check) landed on the *same* scale as
  before, React bailed out of re-rendering since the state value was
  identical - leaving that imperative reset as the last thing touching the
  DOM and silently discarding the shrink. It reproduced deterministically
  (confirmed via direct DOM inspection: `document.fonts.status` was already
  `"loaded"`, ruling out a timing race) and was visible as real text
  overflowing past the certificate border in `ModernLineTemplate`. Fixed by
  rewriting the hook to derive the natural width mathematically - dividing
  the current `scrollWidth` by a ref-tracked "currently applied scale"
  instead of ever mutating the DOM directly. Confirmed both templates
  correctly shrink (40px->36.06px, 44px->39.25px) with `scrollWidth` exactly
  matching `clientWidth` after the fix, and that a short name stays
  untouched at its base size (no regression).

- [x] **Step 4 - Empty-state placeholders in the preview** - both templates
  fall back to muted placeholder copy ("Recipient Name", "Course Name",
  "Instructor Name") for any of the four fields that's blank, styled
  distinctly (lower-opacity or muted color) from real content so it never
  reads as an actual value. Since export is still gated by
  `validateCertificateData` (Step 2), a real PNG/PDF always has complete
  data - placeholder copy can only ever appear in the live preview, never in
  an exported file. *Done when:* with the certificate form empty, the live
  preview shows visibly muted placeholder text in place of each blank field,
  for both templates; typing into any field immediately replaces that
  field's placeholder with the real value.

## Files / areas

- `lib/certificate/date.ts` (new) + `date.test.ts` (new)
- `lib/certificate/schema.ts` (new) + `schema.test.ts` (new)
- `lib/certificate/auto-fit.ts` (new) + `auto-fit.test.ts` (new)
- `lib/certificate/use-auto-fit-font-size.ts` (new)
- `lib/certificate/request.ts` (modified - Zod-based parsing, evolved error shape)
- `lib/certificate/request.test.ts` (modified - updated fixtures/assertions)
- `components/certificate/CertificateForm.tsx` (modified - date input, inline errors, maxLength)
- `components/certificate/CertificateWorkspace.tsx` (modified - validity check via schema)
- `components/certificate/BlackBorderTemplate.tsx` (modified - date formatting, auto-fit, placeholders)
- `components/certificate/ModernLineTemplate.tsx` (modified - date formatting, auto-fit, placeholders)
- `app/api/certificate/png/route.ts` / `.../pdf/route.ts` (modified - updated error response shape)
- `package.json` (modified - add `zod`)

## Data / contracts

- **`CertificateData.date`'s meaning changes**: from a pre-formatted display
  string to a raw ISO (`yyyy-mm-dd`) date. This was flagged as feature 8's
  job by the existing comment on the type. Formatting now happens only at
  render time, inside the templates, via `formatCertificateDate` - the single
  place preview and export both go through, so they can never drift.
- **`ParsedCertificateRequest`'s failure shape changes**: `{ ok: false;
  missing: string[] }` becomes `{ ok: false; errors: string[] }` with actual
  Zod messages instead of bare field names. Internal to this app (both API
  routes and their one caller, `CertificateWorkspace.tsx`'s
  `downloadCertificate`, already just surface `body.error` generically) - not
  a public contract, safe to change directly.
- `certificateFormSchema` (client + server shared) is the new load-bearing
  contract for "valid certificate data" - any future field added to the form
  should extend this schema rather than adding parallel validation elsewhere.

## Testing

`npm run test` (Vitest) is configured, so the test gate is on for
logic-bearing steps:

- Step 1's `formatCertificateDate`, Step 2's `validateCertificateData` (and
  `parseCertificateRequest`'s updated behavior), and Step 3's
  `computeFitScale` are all pure and testable - each shipped tests covering
  the real edge cases named in their step above. 57/57 tests pass
  (`npm run test`).
- The date-input UI, inline error display, auto-fit DOM measurement, and
  placeholder rendering are integration/UI concerns - not unit tested,
  verified with the running app via Playwright (screenshots and direct DOM
  inspection for the visual steps: 3 and 4).

## Notes for the AI

- **Timezone bug to avoid in `formatCertificateDate`**: `new
  Date("2026-08-09")` parses as UTC midnight; formatting it with
  `toLocaleDateString()` in a timezone behind UTC can display "Aug 8"
  instead of "Aug 9". Parse the year/month/day components manually and
  construct the `Date` with the local-time constructor (`new Date(year,
  month - 1, day)`), not by passing the ISO string straight to `new Date()`.
- **Font-loading race in the auto-fit hook**: the self-hosted serif font can
  still be loading when the hook's first measurement effect runs, producing
  a scale computed from fallback-font metrics. Puppeteer already awaits
  `document.fonts.ready` before capturing
  (`lib/certificate/render.ts:goToCertificateRender`) - have the hook listen
  for that same promise and re-measure when it resolves, so the correction
  lands before Puppeteer's own wait resolves and captures.
- **Never imperatively mutate the measured element's style inside the
  measurement function.** See Step 3's bug note above - if a later
  measurement lands on an identical computed value, React's state-bailout
  optimization skips the re-render, and an imperative reset becomes the last
  (wrong) thing touching the DOM. Derive the natural width mathematically
  from the currently-rendered state instead.
- **Old local-storage entries won't have an ISO date.** A history entry or
  last-form-values payload saved before this feature has `date` in the old
  display-string format (e.g. "Aug 9, 2026"). After this feature, the date
  `<input type="date">` simply shows empty for a non-ISO value - a silent,
  non-breaking degradation, not a crash. Not worth a migration for a
  local-only v1 tool; do not add one unless asked.
- Keep `validateCertificateData`'s field-keyed error shape consistent with
  `CertificateForm`'s existing `FieldKey` type (`keyof Omit<CertificateData,
  "logoUrl">`) so the errors map can be indexed directly without translation.
- The recipient-name auto-fit container needs a genuinely fixed/bounded
  width for `clientWidth` to mean "available space" - the current markup
  (`min-w-[380px]` in `BlackBorderTemplate`, `w-fit` in `ModernLineTemplate`)
  lets the box grow with its content, which would make available and natural
  width always equal. Adjust the wrapping markup as needed; match the
  certificate's real inner content width, not an arbitrary guess.
