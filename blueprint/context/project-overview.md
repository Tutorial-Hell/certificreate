# Certificreate - Project Overview

> Turns a name, course, and date into a polished, print-ready certificate (PNG + PDF) in seconds - no more hand-editing a Canva template per student.

## Problem

Course-completion certificates are made by hand in Canva today: duplicate the design, retype the recipient's name, course, and date, then export. It's slow, error-prone, and impossible to hand off or automate. Certificreate turns three inputs (name, course, date) into a polished, on-brand certificate and exports a high-resolution PNG plus a print-ready PDF in seconds, with room to add more designs over time.

## Users

- **Primary:** Brad and Traversy Media, issuing certificates to students who finish a course.
- **Product direction (not v1):** other course creators, bootcamps, workshop hosts, and event organizers who need branded certificates without a designer or Canva.
- **Later:** students self-serving their own certificate after completing a course.

No accounts or access tiers in v1 - everything is anonymous and local to the browser.

## Features

v1 is a single-user, local-only tool: no auth, no server-side database. Core single-certificate flow first, then styles, local persistence, and polish. **Feature 3 is the headline feature** - the first Puppeteer render is also the point the app first deploys to Render, and every feature after it ships against that live service.

1. **Certificate template** - the "Black Border" design rebuilt as a self-contained, themeable HTML/CSS component with placeholder data and the logo mark.
2. **Form + live preview** - inputs for name, course, date, and instructor (defaulting from brand settings), bound live to the template.
3. **PNG export** *(headline)* - a server route renders the template with Puppeteer and returns a high-resolution PNG; first deploy to Render happens here, auto-deploy stays on from this point forward.
4. **PDF export** - the same render pipeline outputs a print-ready, landscape PDF with correct page size and margins.
5. **Template/style system** - a few templates sharing one CSS-variable theme, plus a picker in the UI, structured so new styles drop in cleanly.
6. **Brand settings (local)** - logo, colors, and instructor name saved to local storage and applied to the chosen template.
   - 6a. **Instructor + colors** - `BrandSettings` type, a local-storage store, a settings panel, instructor default, and theme-color overrides applied to preview and export.
   - 6b. **Logo upload** - upload a logo (data URL) into brand settings, replacing the placeholder mark, carried through the export pipeline.
7. **Certificate history (local)** - each generated certificate saved to local storage with a history list to re-open and re-download, plus the last-used form values remembered on reload.
8. **Input polish** - date picker and formatting, Zod validation, long-name auto-fit, and empty states.
9. **Production hardening on Render** - instance sizing under real renders, render-queue behavior under concurrent requests, env config cleanup, custom domain.

**Later (not v1, only if this grows into a product for others):** accounts and cloud sync (Clerk), server-side issued-certificate history with public verification links (Postgres + Prisma), CSV bulk generation, and paid plans (Stripe).

## Data model

No server-side database in v1. Two kinds of data: static template definitions shipped in code, and per-device state in browser local storage. Nothing here leaves the browser; clearing site data wipes it.

### Template (in code, static)

- `id` (string) - template identifier, e.g. `"black-border"`
- `name` (string) - display name for the template picker
- `component` (HTML/CSS) - the self-contained, themeable certificate markup
- `theme` (CSS variables) - colors and layout tokens shared across templates
- `fonts` - self-hosted web fonts matching the Canva serif, so server render and browser preview match exactly
- `logoSlot` - placeholder position for the brand logo mark

> Locked by feature 1 and depended on by every template/theme feature after it (5, 6a, 6b).

### BrandSettings (local storage)

- `logoDataUrl` (string, optional) - uploaded logo, stored as a data URL (feature 6b)
- `instructorName` (string) - default signatory name, editable per certificate
- `colors` (theme color overrides) - applied to the active template (feature 6a)

### CertificateHistoryEntry (local storage)

- `id` (string) - local identifier for re-opening a past certificate
- `recipientName` (string)
- `course` (string)
- `date` (string)
- `instructorName` (string) - resolved value used at generation time
- `templateId` (string) - references `Template.id`
- `createdAt` (timestamp)

> A history list of these entries drives feature 7 (re-open and re-download).

### LastFormValues (local storage)

- `recipientName`, `course`, `date`, `instructorName`, `templateId` - mirrors the form so it isn't empty on reload (feature 7).

**Product direction, not v1 (only if this becomes a multi-tenant product):** `User`, `Organization`/brand settings, `IssuedCertificate` (unique verification slug, file URLs), CSV batch jobs, and billing/subscription records, backed by Postgres + Prisma.

## Tech stack

- **Next.js (App Router) + TypeScript** - app framework, matches `coding-standards.md`
- **Tailwind v4 + shadcn/ui** - styling and UI components
- **Puppeteer (full, not `puppeteer-core`)** - headless Chrome rendering the same HTML/CSS template to both PNG and PDF server-side, so preview and export never drift; Render web services are persistent containers, so the serverless-trimmed Chrome build isn't needed
- **Self-hosted web fonts** - match the Canva serif so server render matches browser preview
- **Browser local storage** - brand settings, certificate history, last form values (no database in v1)
- **Zod** - input validation
- **Render** - deployment target (web service)

**Later, only if this becomes a product:** Render Postgres + Prisma, Clerk (auth), Cloudflare R2 (file storage), Stripe (billing), archiver/jszip (CSV bulk zip).

## Monetization

Not in v1. It's a free, local tool for Brad and anyone who lands on it, shipped to prove the core flow and rendering pipeline.

**Later, if it becomes a product:** freemium SaaS for course creators. A free tier generates watermarked certificates from built-in templates at limited volume; a paid Stripe subscription removes the watermark and unlocks custom branding, all templates, CSV bulk generation, cloud-saved history, and higher volume.

## UI/UX

One focused screen, no login anywhere in v1:

- `/` - a form on the left (name, course, date, template picker) and a live certificate preview on the right with Download PNG / Download PDF buttons; on mobile the form stacks above the preview. A brand-settings panel (logo, instructor name, colors) and a history list of previously generated certificates live alongside the form, both backed by local storage.

The preview is the real template scaled down, so what you see is what you get. The certificate artifact itself keeps the existing brand - formal and classic, serif display headline, letter-spaced small-cap labels, blue double-line border with corner flourishes, centered logo mark between the instructor and date lines - and stays light and print-friendly regardless of app theme. The app chrome around it is clean and modern, dark-mode-first per coding standards.

## Deployment

- **Target:** Render, web service (not static/serverless) - persistent container needed for Puppeteer
- **Build/start:** `npm run build` / `npm run start` (see `AGENTS.md`)
- **First deploy timing:** as soon as feature 3 (PNG export) works locally - create the web service, verify the PNG renders identically in production, then leave auto-deploy on for everything after. Deployment itself is manual, not a build-plan step.
- **Chrome cache:** `.puppeteerrc.cjs` at repo root, `cacheDirectory` set to `join(__dirname, '.cache', 'puppeteer')` so the build-time Chrome download ships with the deploy; add `.cache` to `.gitignore`
- **Launch flags:** `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`
- **Render pattern:** one browser launched at server boot, one page per request, never relaunched per request; concurrency capped at 1-2 renders with a small queue
- **Dependency placement:** `puppeteer` must be in `dependencies`, not `devDependencies`
- **Fonts:** served by the app via `@font-face`, with `document.fonts.ready` awaited before capture
- **Instance size:** Starter minimum, Standard (2GB) preferred; no free tier (spin-down + Chrome memory)
- **Known failure mode:** "Could not find Chrome" after a Puppeteer version bump - fix is "Clear build cache & deploy" on Render

> TODO: env vars, health check path, and custom domain are not decided yet - these belong in project-plan.md section 8 or here once known.

## Open questions

- `project-plan.md` has no `## 8. Deployment` section; the deployment plan above was assembled from section 5 (Tech) and `build-plan.md`'s "Deployment notes" instead. Not blocking, but worth adding section 8 to `project-plan.md` next time it's edited so deployment lives in one place.
- Env vars, health check path, and custom domain for the Render service aren't named yet - see the TODO in Deployment above.
