# Feature: PNG export

**From build-plan:** feature 3
**Status:** complete

## Goal

Render the certificate server-side with full Puppeteer and let the user download a
high-resolution PNG that matches the live preview exactly. This is the headline
feature: the first working PNG render is also the moment the app first deploys to
Render (a manual step after this feature works locally, not a build step here).

## Design reference

None needed. This feature renders the existing `BlackBorderTemplate` component
(built in feature 1) unchanged - the goal is pixel parity between the on-screen
preview and the server-rendered PNG, not a new look.

## In scope

- A print-only route that renders one certificate template full-bleed from URL
  data, with no app chrome.
- A shared Puppeteer browser: launched once, one page per render, capped
  concurrency with a small queue (locked decision from the deployment notes).
- A shared render helper that navigates a page to the print-only route and waits
  for it to be capture-ready, so PDF export (feature 4) can reuse it instead of
  duplicating Puppeteer logic.
- A PNG export API route that validates input, drives the browser, and returns a
  high-resolution (`deviceScaleFactor` 2-3) PNG with correct headers.
- A "Download PNG" button in the UI wired to that route.
- `.puppeteerrc.cjs`, `.gitignore` entry, and `puppeteer` in `dependencies` per
  the deployment notes.

## Out of scope

- PDF export (feature 4) - the render helper is built so that feature can reuse
  it, but no PDF code lands here.
- Template/style picker, brand settings, logo upload, history, Zod validation,
  date picker (features 5-8).
- Actually deploying to Render - that's a manual step the user does after this
  feature works locally, not part of the spec or build steps.
- Render queue tuning/observability under real concurrent load - a minimal
  concurrency cap ships here; deeper hardening is feature 9.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Puppeteer dependency & Chrome cache config** - Add `puppeteer`
  to `dependencies` (not `devDependencies`). Add `.puppeteerrc.cjs` at the repo
  root setting `cacheDirectory` to `join(__dirname, '.cache', 'puppeteer')`. Add
  `.cache` to `.gitignore`. *Done when:* `npm install` succeeds, Chrome downloads
  into `.cache/puppeteer`, and `npm run build` still passes.

- [x] **Step 2 - Shared browser singleton with a concurrency cap** -
  `lib/puppeteer/browser.ts` exporting a `getBrowser()` that launches Chromium
  once with `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` and
  caches the instance across requests (module-level singleton, safe under dev
  HMR), plus a `withPage<T>(fn: (page: Page) => Promise<T>): Promise<T>` that
  opens a page, runs `fn`, always closes the page, and limits concurrent renders
  to 2 with a small FIFO queue (a plain in-memory semaphore, no new dependency).
  *Done when:* the module builds with no type errors; exercised for real by step
  4's route.

- [x] **Step 3 - Print-only render page** - `app/certificate/render/page.tsx`, a
  server component reading `searchParams` (recipientName, course, date,
  instructorName, templateId - all strings) and rendering only
  `<Template data={...} />` full-bleed (no padding, no app chrome, no
  `CertificateWorkspace` wrapper) so the certificate fills the viewport exactly.
  Look up the template by `templateId` from the existing `templates` array;
  missing/unknown id falls back to `templates[0]`. *Done when:* visiting
  `/certificate/render?recipientName=Jordan+Alvarez&course=Full-Stack+Web+Dev&date=Aug+9%2C+2026&instructorName=Brad+Traversy&templateId=black-border`
  in a normal browser shows just the certificate, visually matching the live
  preview for the same data, with no scrollbar or extra whitespace around it.

- [x] **Step 4 - Render helper + PNG API route** -
  `lib/certificate/render.ts` exports a helper that, given a `Page` and
  certificate data, builds the `/certificate/render` URL (fields URL-encoded via
  `URLSearchParams`), sets the viewport, navigates, and awaits
  `document.fonts.ready` plus the page's load state so the screenshot is
  capture-ready. `app/api/certificate/png/route.ts` (`export const runtime =
  "nodejs"`) exposes `POST`: validates the body has non-empty
  `recipientName`/`course`/`date`/`instructorName` (400 with a message if not),
  resolves `templateId` (falls back to the default template), uses
  `withPage` + the render helper, sets viewport to 1200x849 (the template's
  1.414:1 ratio) with `deviceScaleFactor: 3`, takes a PNG screenshot of the
  viewport, and returns it with `Content-Type: image/png` and
  `Content-Disposition: attachment; filename="<slugified recipient>-certificate.png"`.
  Puppeteer/navigation failures return 500 with a plain-text error. *Done when:*
  `curl -X POST` with a valid JSON body returns a PNG file that opens and
  visually matches the live preview for the same data; posting with
  `recipientName` omitted returns 400.

- [x] **Step 5 - Wire the Download PNG button** - Add a "Download PNG" button to
  `CertificateWorkspace` (disabled/loading state while the request is in
  flight) that POSTs the current form data as JSON to
  `/api/certificate/png`, then triggers a browser download of the returned
  blob using its `Content-Disposition` filename. Show a simple inline error if
  the request fails. *Done when:* filling out the form in the running app and
  clicking Download PNG downloads a PNG that matches what's on screen; clearing
  a required field disables the button or surfaces the 400 error.

## Files / areas

- `.puppeteerrc.cjs` (new)
- `.gitignore` (edit - add `.cache`)
- `package.json` (edit - add `puppeteer` to `dependencies`)
- `lib/puppeteer/browser.ts` (new)
- `lib/certificate/render.ts` (new)
- `app/certificate/render/page.tsx` (new)
- `app/api/certificate/png/route.ts` (new)
- `components/certificate/CertificateWorkspace.tsx` (edit - add the Download PNG button)

## Data / contracts

- **Load-bearing:** the `POST /api/certificate/png` body shape -
  `CertificateData & { templateId: string }` (same `CertificateData` from
  `lib/certificate/types.ts`) - is the contract feature 4 (PDF export) reuses
  for its own route.
- **Load-bearing:** `/certificate/render` query params (`recipientName`,
  `course`, `date`, `instructorName`, `templateId`) and the render helper in
  `lib/certificate/render.ts` are shared infrastructure feature 4 will call
  directly to generate its PDF instead of duplicating the navigate/wait logic.
- No changes to `CertificateData`, `Template`, or local-storage shapes.

## Testing

No test runner is configured yet (no `test` command in `AGENTS.md`), so the test
gate is off. This feature is almost entirely UI/integration (a real browser
route, a Puppeteer-driven render, a binary file response), which is exempt even
when a runner exists. Verify with:

- `npm run build` passes after each step.
- Step 3: manual browser visit to `/certificate/render?...` compared against the
  live preview for the same inputs.
- Step 4: `curl -X POST http://localhost:3000/api/certificate/png -H "Content-Type: application/json" -d '{...}' -o out.png` then open `out.png`; a second curl with a missing field to confirm the 400 path.
- Step 5: manual click-through in the running app (`npm run dev`), confirming
  the downloaded file matches the preview and the error/disabled path for
  missing input.

## Notes for the AI

- Keep `puppeteer` in `dependencies`, never `devDependencies` - production
  `npm install` on Render skips `devDependencies`.
- The API route must run on the Node.js runtime (`export const runtime =
  "nodejs"`), not the Edge runtime - Puppeteer needs Node APIs.
- Reuse `templates` from `lib/certificate/templates.ts` to resolve
  `templateId`; don't hand-roll a second template lookup.
- The render page must stay a plain server component with no interactivity -
  don't add `"use client"` there; it only needs to exist long enough for
  Puppeteer to screenshot it.
- Don't build the queue/limiter as a new dependency - a small in-memory
  semaphore (array of pending resolvers) is enough for a cap of 2.
- Don't start on PDF export, Zod validation, or the template picker in this
  feature - those are features 4, 8, and 5 respectively. Keep the render helper
  generic enough that feature 4 can reuse it, but don't build PDF-specific code
  now.
- `logoUrl` on `CertificateData` stays unused here (no upload UI exists until
  feature 6b) - don't pass it through the query string; the template already
  renders its placeholder mark when `logoUrl` is absent.
