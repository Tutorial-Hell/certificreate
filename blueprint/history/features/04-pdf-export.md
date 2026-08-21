# Feature: PDF export

**From build-plan:** feature 4
**Status:** complete

## Goal

Add a server-rendered, print-ready PDF export of the certificate, using the
same Puppeteer render pipeline as the PNG export (feature 3), so a user can
download a certificate as a PDF as well as a PNG.

## In scope

- A `POST /api/certificate/pdf` route that navigates the same
  `/certificate/render` page via the shared `goToCertificateRender` helper and
  the shared `withPage` browser/concurrency wrapper, then calls `page.pdf()`
  instead of `element.screenshot()`.
- A landscape PDF page sized to match the certificate template's own,
  already-locked aspect ratio (see **Notes for the AI** - this is a resolved
  decision, not left to `/implement` to pick).
- A "Download PDF" button in `CertificateWorkspace.tsx`, next to the existing
  "Download PNG" button, following the same fetch-blob-download pattern.
- Extracting the small pieces of logic the PNG route already has that the PDF
  route needs identically (filename slug, request validation) into shared
  `lib/certificate/` modules, so neither route re-implements them.

## Out of scope

- Any new template, style, or theme (feature 5).
- Brand settings, logo upload, or color overrides (feature 6).
- Certificate history or remembering last-used values (feature 7).
- Date picker/formatting, Zod validation, long-name auto-fit (feature 8) -
  the extracted request validation in this feature stays exactly as strict as
  the PNG route's existing checks (non-empty required strings), nothing more.
- Render instance sizing, queue tuning, or env cleanup (feature 9) - this
  feature reuses `withPage`'s existing concurrency cap unchanged.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Extract the filename helper** - move `slugify` and a new
  `certificateFilename(recipientName, extension)` out of
  `app/api/certificate/png/route.ts` into `lib/certificate/filename.ts` (a
  pure module, no route-specific imports); update the PNG route to import
  from there; move `app/api/certificate/png/route.test.ts` to
  `lib/certificate/filename.test.ts` and adjust its import. *Done when:*
  `npm run verify` passes, and `POST /api/certificate/png` with a sample
  payload still returns `200 image/png` with the same
  `<slug>-certificate.png` filename as before (no behavior change, pure
  extraction).

- [x] **Step 2 - Extract shared request validation** - move the PNG route's
  required-field check and `templateId` fallback into a
  `parseCertificateRequest(body)` helper in `lib/certificate/request.ts`,
  returning either the validated `{ data, templateId }` or a list of missing
  fields; update the PNG route to use it; add a small Vitest test covering:
  all fields present, one or more missing, and an unknown `templateId`
  falling back to the default template. *Done when:* `npm run verify`
  passes, and `POST /api/certificate/png` still returns `400` with the same
  `Missing required field(s): ...` message for an incomplete payload, and
  `200` for a valid one.

- [x] **Step 3 - Add the PDF export route** - `app/api/certificate/pdf/route.ts`,
  mirroring the PNG route's structure (parse/validate via the Step 2 helper,
  render via `withPage` + `goToCertificateRender`, respond with
  `Content-Type: application/pdf` and
  `Content-Disposition: attachment; filename="<slug>-certificate.pdf"` using
  the Step 1 helper), but calling
  `page.pdf({ format: "A4", landscape: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })`
  instead of `element.screenshot()`. *Done when:* a real
  `POST /api/certificate/pdf` with sample data returns `200` with
  `Content-Type: application/pdf`, and the resulting PDF is inspected
  (page-size metadata and/or a rendered first-page image) to confirm a
  landscape A4 page with the certificate filling it edge-to-edge, matching
  the PNG export's content.

- [x] **Step 4 - Wire up the "Download PDF" button** -
  `CertificateWorkspace.tsx` gets a shared `downloadCertificate(endpoint)`
  helper (factoring out the existing fetch/blob/filename/download-link logic
  from `handleDownloadPng` so it isn't duplicated a second time), a
  `handleDownloadPdf` built on it, and a second button next to "Download PNG"
  using the same `isDownloading`/`canDownload`/`error` state (only one export
  runs at a time, matching the shared render queue). *Done when:* clicking
  "Download PDF" in the running app downloads a `.pdf` file, verified against
  the dev server (browser or equivalent request-level evidence), with the
  same disabled/error behavior as the PNG button for incomplete forms and
  failed requests.

## Files / areas

- `lib/certificate/filename.ts` (new), `lib/certificate/filename.test.ts` (new,
  moved from the PNG route's test)
- `lib/certificate/request.ts` (new), `lib/certificate/request.test.ts` (new)
- `app/api/certificate/png/route.ts` (updated to use the extracted helpers)
- `app/api/certificate/pdf/route.ts` (new)
- `components/certificate/CertificateWorkspace.tsx` (updated: shared download
  helper + PDF button)

## Data / contracts

No new stored data types. `POST /api/certificate/pdf` mirrors the existing
`POST /api/certificate/png` request contract exactly (`CertificateData` +
`templateId`, same required-field validation), differing only in response
`Content-Type`/filename extension and the PDF page settings. This is the
second consumer of that request shape, so `parseCertificateRequest`
(Step 2) becomes the one place it's defined going forward.

## Testing

A `test` command is declared in `AGENTS.md` (Vitest via `npm run verify`), so
the test gate is on for in-scope logic:

- Step 1: `certificateFilename` (and the existing `slugify` cases) - pure,
  needs a test.
- Step 2: `parseCertificateRequest` - pure, needs a test (all-present,
  missing-field(s), unknown-templateId-falls-back cases).
- Step 3 (the PDF route) and Step 4 (the UI button) are integration/UI -
  exempt from the unit test gate per `coding-standards.md`; verify with a
  real PDF response/inspection and browser or API-equivalent evidence
  instead.

## Notes for the AI

- **Page size is a resolved decision, not a default to pick at
  implementation time.** The certificate template's outer frame is
  `aspect-[1.414/1]` - that ratio *is* A4 (210mm x 297mm), not US Letter
  (8.5in x 11in, ratio 1.294:1). Puppeteer's `page.pdf()` default format is
  Letter, which would leave whitespace or clip the certificate. Use
  `format: "A4"` with `landscape: true` and zero margins so the certificate
  fills the page exactly, matching the PNG export's proportions. Do not
  reconcile this by changing the template's aspect ratio - that ratio is
  locked (feature 1) and shared with the live preview.
- `goToCertificateRender` (`lib/certificate/render.ts`) already navigates and
  waits for fonts; reuse it unchanged for the PDF route. Its viewport
  settings (1200x849 @3x, tuned for the PNG screenshot) don't affect
  `page.pdf()`'s print-page layout, so no changes are needed there.
- `withPage` (`lib/puppeteer/browser.ts`) already caps render concurrency at
  2 and queues beyond that; the PDF route reuses it as-is, same as PNG.
- Keep the extracted `lib/certificate/filename.ts` and
  `lib/certificate/request.ts` pure (no Next.js request/response types), so
  they're trivially testable and reusable by both routes.
- Follow existing error handling: catch render failures, `console.error` the
  real error server-side, return a generic message to the client (matches
  the PNG route's current pattern).
