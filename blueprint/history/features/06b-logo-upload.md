# Feature: Logo upload (brand settings)

**From build-plan:** feature 6b
**Status:** complete

## Goal

Let the user upload a logo image into brand settings, replacing the
placeholder dot-grid mark in both templates, applied to the live preview and
PNG/PDF exports - completing feature 6 (Brand settings), started by 6a
(instructor + colors).

## In scope

- A file-upload control in `BrandSettingsPanel` that reads an image, stores
  it as a data URL in `BrandSettings.logoDataUrl` (already reserved by
  feature 6a's type, unused until now), with a thumbnail preview and a
  "Remove logo" action.
- Client-side validation: image files only, capped at 1MB raw file size (see
  **Notes**), with an inline error for anything that fails.
- The uploaded logo replacing the placeholder mark in the live preview, for
  both templates - `BlackBorderTemplate` and `ModernLineTemplate` already
  render `data.logoUrl` when present (feature 1); no template changes
  needed.
- The uploaded logo carried through PNG and PDF export via a request-scoped,
  in-memory handoff (never placed in a URL query string or HTTP header -
  see **Notes** for why).
- A defensive try/catch around the brand-settings `localStorage` write
  (`use-brand-settings.ts`, from feature 6a), surfacing a clear inline error
  instead of an uncaught exception if a large logo pushes past the browser's
  storage quota.

## Out of scope

- Image cropping, resizing, or client-side compression before storage - the
  1MB cap is the only size control.
- Drag-and-drop upload - a plain file input is sufficient.
- Any server-side or persistent file storage (R2, S3, a database) - stays
  fully local-storage + an ephemeral in-process handoff, consistent with "no
  database in v1."
- Multiple logo variants or per-template logos - one logo, shared across
  every template, same as the instructor/colors settings.
- Certificate history or remembering last-used values (feature 7), input
  polish (feature 8).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Request-scoped logo handoff module** -
  `lib/certificate/logo-handoff.ts`: `stashLogo(dataUrl: string): string`
  (returns a random token, stores the value in a module-level `Map`, and
  schedules a TTL cleanup in case a render fails before claiming it) and
  `takeLogo(token: string): string | undefined` (single-use: returns the
  value and deletes it; returns `undefined` for an unknown/already-claimed/
  expired token). *Done when:* `npm run verify` passes with unit tests
  covering stash-then-take, take-is-single-use (a second `take` on the same
  token returns `undefined`), an unknown token, and TTL expiry (via
  `vi.useFakeTimers()`, per `coding-standards.md`'s stack binding). Nothing
  wired up yet.

- [x] **Step 2 - Upload UI + storage safety** - `BrandSettingsPanel.tsx`
  gains a file input (`accept="image/*"`), reads the file via
  `FileReader.readAsDataURL()`, rejects non-image files and files over 1MB
  with an inline error (and handles `FileReader`'s `onerror` the same way -
  never crash on a bad file), shows a thumbnail of the current logo when
  set, and a "Remove logo" action that clears `logoDataUrl`.
  `use-brand-settings.ts`'s persist effect wraps its `localStorage.setItem`
  in a try/catch, surfacing a storage error through the hook's return value
  instead of throwing. *Done when:* verified in a real browser - uploading a
  small test image shows its thumbnail and persists across a reload;
  uploading an oversized or non-image file shows the inline error and does
  not change stored settings; "Remove logo" clears it and persists.

- [x] **Step 3 - Wire the logo into the live preview** -
  `CertificateWorkspace` merges `brandSettings.logoDataUrl` into the
  `CertificateData` passed to `<Template>` as `logoUrl` (combined at render
  time, the same way `templateId`/`colors` are - not folded into the `data`
  form-state itself). *Done when:* after uploading a logo, the live
  preview's logo mark shows the uploaded image instead of the placeholder
  glyph, for both templates (verified in a real browser); with no logo
  uploaded, the placeholder is pixel-unchanged from before this feature.

- [x] **Step 4 - Carry the logo through PNG/PDF export** -
  built as: `lib/certificate/request.ts` passes `body.logoUrl` through into
  `parseCertificateRequest`'s returned data (the type already allows it -
  `CertificateRenderRequest`/`CertificateRequestBody` both extend
  `CertificateData`, which has had an optional `logoUrl` since feature 1);
  `goToCertificateRender` (`lib/certificate/render.ts`) calls
  `stashLogo(data.logoUrl)` itself when present and sets only `logoToken` in
  the query params - centralized here rather than duplicated in both route
  handlers as originally sketched, so `app/api/certificate/png/route.ts` and
  `.../pdf/route.ts` needed no changes at all, since they already just
  forward `parsed.data` through unchanged; `app/certificate/render/page.tsx`
  resolves `params.logoToken` via `takeLogo()` server-side and passes the
  result as `data.logoUrl`, falling back to the placeholder if the token is
  missing or already claimed; `CertificateWorkspace`'s `downloadCertificate`
  includes `logoUrl: brandSettings.logoDataUrl` in both POST bodies. *Done
  when:* a direct `POST` to `/api/certificate/png` and `/pdf` with a small
  test-image `logoUrl` produces a file showing that image in the logo mark
  (verified via real render + visual inspection) for both templates; a
  request with no `logoUrl` renders the placeholder exactly as before
  (regression); and the URL Puppeteer actually navigates to is confirmed to
  never contain `data:image` (only the short token).

  **Bug caught during verification:** the first version used a plain
  module-level `const pending = new Map()` in `logo-handoff.ts`, per the
  original Step 1 design. Real testing (not just the unit tests, which
  passed) showed the export silently fell back to the placeholder every
  time - Next.js's module graph doesn't guarantee a plain top-level variable
  is one shared instance across different route types (API routes vs. page
  routes), notably under Turbopack dev, so the token stashed by the route
  handler and the token claimed by the render page were reading from two
  different `Map` instances. Fixed by switching to the same
  `globalThis.__certificreateX` pattern `lib/puppeteer/browser.ts` already
  uses for its browser singleton - see that file's `declare global` block
  for the precedent this now follows.

## Files / areas

- `lib/certificate/logo-handoff.ts` (new)
- `lib/certificate/logo-handoff.test.ts` (new)
- `components/certificate/BrandSettingsPanel.tsx` (updated)
- `lib/certificate/use-brand-settings.ts` (updated - storage-error safety)
- `components/certificate/CertificateWorkspace.tsx` (updated)
- `lib/certificate/request.ts` (updated)
- `lib/certificate/render.ts` (updated - also calls `stashLogo` internally)
- `app/certificate/render/page.tsx` (updated)
- `app/api/certificate/png/route.ts` / `.../pdf/route.ts` - **not touched**;
  the stash call moved into `render.ts` during implementation (see Step 4)

## Data / contracts

- `BrandSettings.logoDataUrl` and `CertificateData.logoUrl` already exist
  (reserved by features 6a and 1 respectively) - this feature populates
  them, no type changes needed there.
- **New, internal-only:** the `logoToken` query param and the
  `stashLogo`/`takeLogo` handoff contract in `lib/certificate/logo-handoff.ts`.
  Load-bearing as a *pattern*: any future oversized per-request value in this
  render pipeline should reuse this same request-scoped, in-memory handoff
  rather than growing the URL/header payload - never expose `logoToken` or
  the handoff map outside this server-internal flow.

## Testing

A `test` command is declared in `AGENTS.md` (Vitest via `npm run verify`):

- Step 1's `stashLogo`/`takeLogo` (including TTL expiry via
  `vi.useFakeTimers()`) is pure, testable logic - in scope, needs tests.
- Steps 2-4 are UI/integration (file reading, `localStorage`, live DOM
  updates, the Puppeteer render pipeline) - exempt per `coding-standards.md`;
  verified with real browser (Playwright) and direct API/visual evidence,
  consistent with feature 6a and every prior export feature.

## Notes for the AI

- **Why the logo can't go in a URL query param, unlike `templateId`/`colors`:**
  those are short strings; a logo data URL can easily be tens of KB, risking
  Node's request-line/header size limit, and this app runs behind Render's
  Cloudflare proxy (already the root cause of one real production bug this
  session - see the `certificate-png-render-origin` fix) which imposes its
  own limits we don't control. Use the `stashLogo`/`takeLogo` handoff
  instead; never put `data:image/...` in a URL, header, or cookie.
- The handoff module is a same-process, in-memory `Map`, stored on
  `globalThis` (not a plain module-level `const`) - required, not optional:
  see the Step 4 bug note above for why a plain top-level variable doesn't
  reliably share state across Next.js's module graph. Matches
  `lib/puppeteer/browser.ts`'s existing `globalThis.__certificreateBrowserPromise`
  pattern exactly. It does not need to survive a server restart or work
  across multiple server instances; each PNG/PDF request stashes and claims
  its own token within a single request's lifecycle.
- **1MB raw file size cap** (before base64 encoding) for the upload
  validation in Step 2 - a fixed, simple number to state clearly in the UI
  ("Max 1MB"), not a setting.
- A missing or already-claimed `logoToken` on `/certificate/render` must
  fall back to the placeholder mark silently - never throw or 500 the
  render. This can legitimately happen (a retried request, a token that
  expired because the render was slow) and must not break the export.
- Keep `use-brand-settings.ts`'s existing `useBrandSettings()` API shape
  compatible with feature 6a's callers in `CertificateWorkspace.tsx` -
  adding storage-error handling should extend what it returns (e.g. an
  additional `saveError` field), not change `settings`/`setSettings`'s
  existing shape.
