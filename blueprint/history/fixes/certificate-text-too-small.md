# Fix: certificate text too small

**Type:** Fix
**Status:** complete

## The problem

All text on the "Black Border" certificate (`components/certificate/BlackBorderTemplate.tsx`)
rendered far smaller than the reference design (`blueprint/reference/cert-example.png`),
in both the live app preview and the exported PNG. Since the preview scales the
same component to the same design width used by the Puppeteer export
(`CERTIFICATE_DESIGN_WIDTH` / `VIEWPORT_WIDTH`, both 1200px), the two were
undersized identically - fixing the component fixes both surfaces at once.

Measuring text-height-to-certificate-width ratios in the reference photo
against the app's rendered output showed every text element running at
roughly 40-45% of the size it should be.

Found via user report that text sizes in both the app preview and the
downloaded PNG were too small.

## The fix

Scaled up font sizes in `BlackBorderTemplate.tsx` to match the reference
proportions (~2-2.4x across elements), and scaled the logo mark circle to
match so it doesn't look undersized next to the larger text:

- Headline "Certificate" / "of Completion"
- Eyebrow "This is to certify that"
- Recipient name
- Body sentence + course title
- Date / instructor values and labels (`Signoff`)
- Logo mark circle + icon

No changes were needed to the export pipeline (`lib/certificate/render.ts`,
the `/certificate/render` route, or the PNG API route) or the preview's
scaling wrapper - only the template's own font sizes.

## Build steps

- [x] **Increase the arbitrary-value font sizes and the logo mark size** -
  `components/certificate/BlackBorderTemplate.tsx`. *Done when:* a real export
  via `/api/certificate/png` (Puppeteer, not just the browser preview) shows
  text sized in proportion to `blueprint/reference/cert-example.png`, and a
  stress test with a long recipient name and long course title still wraps
  cleanly inside the border with no clipping or overflow.

## Verify

- `npm run lint` passes clean.
- `npm run build` compiles, typechecks, and generates all routes successfully.
- Re-rendered the certificate via `POST /api/certificate/png` with sample data
  and visually confirmed headline, name, course, and date/instructor sizes now
  read close to the reference photo's proportions.
- Re-rendered with a long recipient name ("Bartholomew Alexandra Montgomery")
  and a long course title ("Advanced Full-Stack Web Development With React
  and Node.js") to confirm wrapping still fits cleanly inside the border with
  no clipping.
- No unit tests added: this is a pure styling change (font-size and layout
  values), which is exempt from the unit test gate per `coding-standards.md`.
  No `test` command is declared in `AGENTS.md` either.

## Findings

_No findings ledger entries were open against this work._
