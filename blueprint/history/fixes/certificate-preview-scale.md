# Fix: certificate preview scaling mismatch

**Type:** Fix
**Status:** complete

## The problem

The on-screen certificate preview (`CertificateWorkspace`) rendered
`BlackBorderTemplate` inside a `w-full max-w-xl` box, letting it reflow to
whatever CSS width the sidebar panel happened to be (~576px). The PNG export
route (`/certificate/render`, driven by `lib/certificate/render.ts`) renders
the same template at a fixed 1200px Puppeteer viewport. `BlackBorderTemplate`
uses fixed-pixel font sizes, padding, and gaps (`text-[46px]`, `px-[50px]`,
etc.), so the same absolute-pixel design looked correctly proportioned in the
narrower preview box but disproportionately small and sparse once stretched
into the wider 1200px export canvas - the downloaded PNG's fonts, spacing, and
layout didn't match what the preview showed. This also violated the stated
product requirement in `project-overview.md`: "The preview is the real
template scaled down, so what you see is what you get."

Found via manual verification of the PNG export feature: comparing a
downloaded certificate against the live preview showed mismatched font sizing
and excess whitespace.

## The fix

`components/certificate/CertificateWorkspace.tsx` now renders the template at
its native 1200px design width (matching the export viewport) inside a
`ResizeObserver`-measured wrapper, then scales the whole thing down with a CSS
`transform: scale()` to fit the available preview width. This makes the
preview a true proportional miniature of the export canvas instead of an
independently-reflowed copy, so any element's size relative to the certificate
is now identical between preview and export by construction. No changes were
needed in the export pipeline (`lib/certificate/render.ts`, the
`/certificate/render` route, or the PNG API route) - only the preview's
rendering wrapper.

## Build steps

- [x] **Scale the preview to match the 1200px export canvas** -
  `CertificateWorkspace.tsx` gained a `CertificatePreview` component that
  renders `<Template>` at a fixed `1200px` width and applies
  `transform: scale(containerWidth / 1200)`, measured via `ResizeObserver` (with
  a synchronous initial measurement in `useLayoutEffect` to avoid a flash of an
  unscaled/invisible certificate on first paint). *Done when:* the preview's
  computed transform scale equals `containerWidth / 1200`, and a downloaded PNG
  visually matches the on-screen preview's proportions.

## Verify

- `npm run build` passes.
- DOM inspection of the live preview (via Playwright) confirmed
  `transform: scale(0.48)` on a `width: 1200px` inner wrapper inside a `576px`
  outer box - the expected `576 / 1200 = 0.48` ratio.
- Re-ran the PNG export (`POST /api/certificate/png`) after the fix and
  confirmed it still returns `200 image/png` at the expected `3600x2547`
  resolution; the export pipeline itself was untouched by this fix.
- No unit tests added: this is a UI/integration change (a CSS scaling
  transform driven by real layout), which is exempt from the unit test gate
  per `coding-standards.md`. No `test` command is declared in `AGENTS.md` yet
  either.

## Findings

_No findings ledger entries were open against this work._
