# Feature: Instructor + colors (brand settings)

**From build-plan:** feature 6a
**Status:** complete

## Goal

Add local, persistent brand settings - a default instructor name and two
accent-color overrides - applied to both the live preview and PNG/PDF
exports. This is the first piece of feature 6 (Brand settings); logo upload
is 6b.

## In scope

- `BrandSettings` type + a `localStorage`-backed store
  (`lib/certificate/brand-settings.ts`): `instructorName: string`,
  `colors: { border?: string; borderInner?: string }`. (`logoDataUrl` is
  reserved in the type for feature 6b but unused here.)
- A `BrandSettingsPanel` component: an instructor-name default field and two
  color pickers (`--cert-border`, `--cert-border-inner` only - see **Notes**).
- The certificate form's instructor field prefills from the saved default on
  load, matching the "defaulting from brand settings" behavior described for
  feature 2 back when `BrandSettings` didn't exist yet.
- Color overrides apply to **both** the live preview and PNG/PDF exports, via
  the render pipeline's existing request contract (matching the build-plan
  line and feature 6a's own description in `project-overview.md`).

## Out of scope

- Logo upload (feature 6b) - `logoDataUrl` stays typed but unused.
- Overriding any color besides the two accent tokens - `--cert-bg`,
  `--cert-ink`, `--cert-muted`, `--cert-hairline`, `--cert-shadow` stay fixed.
  The product brief requires the certificate to "stay light and
  print-friendly regardless of app theme"; free-form overrides of the base
  ink/background tones risk breaking that.
- Certificate history or remembering last-used form values (feature 7) -
  `BrandSettings` and feature 7's `LastFormValues` are separate local-storage
  shapes; this feature doesn't touch history.
- Zod validation, date picker, long-name auto-fit (feature 8).
- Any settings-panel behavior beyond instructor name + the two colors (no
  panel collapse/toggle, no reset-to-default button, no per-certificate color
  override distinct from the saved brand default).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - `BrandSettings` type, store, and `useBrandSettings` hook** -
  `lib/certificate/brand-settings.ts`: the `BrandSettings`/`BrandColors`
  types, `DEFAULT_BRAND_SETTINGS`, a pure `parseBrandSettings(raw: string |
  null): BrandSettings` (safe on missing/`null`/corrupt JSON, and on a
  partial or malformed `colors` object), and a `useBrandSettings()` hook that
  loads from `localStorage` on mount and persists on change. Nothing
  consumes it yet. *Done when:* `npm run verify` passes with unit tests for
  `parseBrandSettings` covering valid input, missing/`null`, corrupt JSON,
  and a partial/malformed `colors` object.

- [x] **Step 2 - Settings panel + instructor default** -
  `components/certificate/BrandSettingsPanel.tsx` (instructor-name input +
  two `<input type="color">` fields, using `useBrandSettings`), rendered in
  `CertificateWorkspace`'s left column above the template picker.
  `CertificateWorkspace` also uses `useBrandSettings` to prefill
  `data.instructorName` once on load, only when the field is still empty.
  *Done when:* verified in a real browser - saving an instructor name and
  colors in the panel, then reloading the page, shows the same values in the
  panel (persisted), and a fresh certificate form's instructor field is
  pre-filled from that saved default.

- [x] **Step 3 - Apply color overrides to the live preview** -
  `CertificateWorkspace`'s `CertificatePreview` wraps the rendered
  `<Template>` in a div with inline CSS custom-property overrides for
  `--cert-border`/`--cert-border-inner`, set only when the corresponding
  brand-settings value exists (otherwise the CSS falls back to
  `globals.css`'s defaults). *Done when:* changing either color in the
  settings panel visibly updates the live preview in real time for both
  templates (verified in a real browser), and with no saved override the
  preview's colors are unchanged from before this feature.

- [x] **Step 4 - Apply color overrides to PNG/PDF export** - extend
  `CertificateRenderRequest` (`lib/certificate/render.ts`) and
  `parseCertificateRequest`/`CertificateRequestBody`
  (`lib/certificate/request.ts`) with an optional `colors?: BrandColors`,
  passed through as two optional query params (`colorBorder`,
  `colorBorderInner`) to `/certificate/render`; that page applies the same
  override wrapper as Step 3 around `<Template>`; `CertificateWorkspace`'s
  `downloadCertificate` includes `colors: settings.colors` in both the PNG
  and PDF POST bodies. *Done when:* a direct `POST` to
  `/api/certificate/png` and `/pdf` with a `colors.border` override produces
  a file showing that color (verified via real render + visual inspection),
  and the same request with no `colors` field renders with today's exact
  default colors (regression check).

## Files / areas

- `lib/certificate/brand-settings.ts` (new) - types, `parseBrandSettings`,
  `colorOverrideStyle`. Kept free of React hooks so Server Components
  (`app/certificate/render/page.tsx`) can import from it safely.
- `lib/certificate/use-brand-settings.ts` (new) - the `useBrandSettings()`
  hook, split out during Step 4: Next.js errors if a Server Component
  imports *any* export from a module containing `useState`/`useEffect`
  imports, even unused ones, so the hook couldn't stay in the same file
  once `render/page.tsx` needed `colorOverrideStyle`.
- `lib/certificate/brand-settings.test.ts` (new)
- `components/certificate/BrandSettingsPanel.tsx` (new)
- `components/certificate/CertificateWorkspace.tsx` (updated)
- `lib/certificate/request.ts` (updated)
- `lib/certificate/render.ts` (updated)
- `app/certificate/render/page.tsx` (updated)

## Data / contracts

- **New:** `BrandSettings` (`instructorName`, `colors: { border?, borderInner?
  }`, `logoDataUrl?` reserved) persisted at `localStorage` key
  `"certificreate:brand-settings"`. **Load-bearing:** feature 6b extends this
  exact shape (populates `logoDataUrl`) rather than introducing a new store;
  feature 7's `LastFormValues` is a separate, sibling key, not nested here.
- `CertificateRenderRequest` (`lib/certificate/render.ts`) gains an optional
  `colors?: BrandColors` field - the render pipeline's request contract,
  already extended once before for `templateId` (features 4-5).

## Testing

A `test` command is declared in `AGENTS.md` (Vitest via `npm run verify`):

- Step 1's `parseBrandSettings` is pure parsing/validation logic - in scope,
  needs tests per `coding-standards.md`.
- Steps 2-4 are UI/integration (`localStorage` side effects, live DOM
  updates, the Puppeteer render pipeline) - exempt per `coding-standards.md`;
  verified with real browser (Playwright) and direct API/visual evidence
  instead, consistent with every prior template/export feature in this
  project.

## Notes for the AI

- **Color scope is a resolved decision, not a default to expand.** Only
  `--cert-border` and `--cert-border-inner` are overridable. Do not add
  pickers for any other `--cert-*` token.
- **Both preview and export get the override in this feature** - not a
  preview-only stopgap. This was an explicit choice this session, matching
  the exact regression class the earlier preview/export-proportion fix
  existed to prevent (preview and export must never silently diverge).
- Apply overrides via an inline CSS custom-property override on a wrapper
  `div` around `<Template>`, in exactly two places (the live preview and
  `/certificate/render`) - never edit `BlackBorderTemplate`/
  `ModernLineTemplate` internals for this. TypeScript's `CSSProperties`
  doesn't type custom properties by default; cast the style object (e.g. `as
  React.CSSProperties`) where the CSS variables are set.
- Default each color picker's displayed value to today's CSS default
  (`#4b3e96` for border, `#7691c2` for border-inner) when no override is
  saved, so the picker starts at the current brand color rather than an
  arbitrary one. `<input type="color">` always holds a valid hex value by
  browser design, so there's no invalid/empty-string case to handle for
  color input.
- Follow the codebase's existing SSR-safe pattern for browser-only state -
  read `localStorage` inside `useEffect` after mount (matching
  `CertificatePreview`'s existing `ResizeObserver`/scale pattern in
  `CertificateWorkspace.tsx`), never in a lazy `useState` initializer, since
  client components still render once on the server first.
- The instructor-name prefill fires once on initial mount, only if the
  field is still empty. It must never overwrite text the user is actively
  typing, and editing the brand-settings panel afterward must not
  retroactively change the currently-open form's instructor field.
