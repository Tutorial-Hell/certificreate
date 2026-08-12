# Feature: Certificate template

**From build-plan:** feature 1
**Status:** complete

## Goal

Rebuild the "Black Border" certificate as a self-contained, themeable React
component that faithfully matches the real design, rendered with placeholder
data so it can be reviewed on screen before any form, export, or persistence
exists. Everything after this feature (live preview, PNG/PDF export, template
picker, brand settings) renders or extends this same component, so its visual
fidelity and prop shape matter more than usual.

## Design reference

- **Certificate artifact (border, layout, typography):** `blueprint/reference/cert-example.png` -
  the real "Black Border" design exported from Canva. Build the component to
  match this photo's structure, not the certificate portion of
  `prototypes/app.html`. That mockup's certificate was drawn from prose *before*
  this photo existed, and was later reverted back to that prose approximation at
  the user's request (sharp corners, corner flourishes, small-caps eyebrow,
  large italic serif name) - it is now the wrong shape for this feature and
  should not be copied. This was an explicit decision: see the design-target
  question resolved earlier in this session.
- **Colors:** use the app's locked theme tokens from `prototypes/theme.css`
  (`--cert-border: #4b3e96`, purple-blue, `--cert-bg: #fdfbf6`, etc.), **not**
  the muted blue-gray actually visible in the reference photo. The color is a
  separate, already-settled decision from the structural/typographic match.
- **App chrome tokens** (`--bg`, `--surface`, `--text`, `--accent`, `--radius`,
  fonts) also come from `prototypes/theme.css`. Feature 1 doesn't build any
  chrome yet (no form, cards, or history - that's feature 2+), but porting the
  full token set now means later features don't redo this step.

### What to match from the reference photo

- **Frame:** a rounded-corner double-line border (not sharp corners, not
  separate corner-flourish ornaments) - an outer line and a thin inset inner
  line, both with soft rounded corners.
- **Headline:** big, bold, black serif "Certificate" on one line, smaller serif
  "of Completion" beneath it. Serif is used *only* here - everything else on
  the certificate is sans-serif.
- **Eyebrow:** "THIS IS TO CERTIFY THAT" - small, letter-spaced, uppercase,
  sans-serif, muted color.
- **Recipient name:** bold, uppercase, letter-spaced sans-serif, with a
  horizontal rule beneath it (a fill-in-the-blank look), not a large serif
  name.
- **Body line:** a plain sans-serif sentence ("Has completed the following
  &lt;org&gt; course:"), then the course title in bold sans-serif (not italic,
  not serif).
- **Bottom row:** three columns - date on the left, a circular logo mark
  centered, instructor name on the right. Date and instructor each render as a
  bold uppercase sans-serif value with a rule above it, then a plain
  regular-case label beneath the rule ("Date" / "Instructor" - not uppercase,
  not letter-spaced).
- **Logo mark:** a circle with a ring border, containing a simple dot-grid
  glyph as the placeholder (this is a stand-in; the real logo becomes a
  user-uploaded image in feature 6b).
- **Proportions:** landscape, roughly a 1.414:1 (letter-landscape) aspect
  ratio, since feature 3/4 renders this exact markup to PNG and PDF.

## In scope

- Porting `prototypes/theme.css`'s tokens into `app/globals.css`.
- Adding a self-hosted serif font (for the headline only) alongside the
  existing Geist sans/mono, via `next/font/google`.
- The `CertificateData` and `Template` types (the data contract every later
  template/form/export feature builds against).
- The `BlackBorderTemplate` component: pure, presentational, takes
  `CertificateData` as props, renders standalone with sensible placeholder
  values (no external state, no form).
- A minimal `templates` registry (`lib/certificate/templates.ts`) with this one
  entry, so feature 5's picker has something to iterate over later.
- Rendering the template with placeholder data on `/` (`app/page.tsx`) so it's
  visible and screenshot-able. This replaces the default create-next-app
  boilerplate content.

## Out of scope

- The real form, live typing, and the two-column form/preview layout (feature 2).
- PNG/PDF export and the Puppeteer render route (feature 3, 4).
- The template picker UI and any second template (feature 5).
- Brand settings, logo upload, and color overrides (feature 6a, 6b).
- Certificate history and remembering last-used values (feature 7).
- Date formatting/picker, Zod validation, and long-name auto-fit (feature 8).
- Any app chrome beyond the bare page needed to render the certificate (cards,
  sidebar, buttons) - that starts in feature 2.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Port theme tokens and add the headline font** - merge
  `prototypes/theme.css`'s custom properties into `app/globals.css` (app-chrome
  tokens and `--cert-*` tokens alike), and add a bold serif Google Font (e.g.
  Lora or Playfair Display) via `next/font/google` in `app/layout.tsx`,
  exposed as a CSS variable alongside the existing Geist sans/mono. Strip the
  hard-coded `bg-zinc-50`/`dark:bg-black`/`bg-white` classes from
  `app/page.tsx`'s two wrapper elements (content and copy unchanged) so the
  new body background is actually visible - those classes currently paint over
  it regardless of the token change. *Done when:* `npm run dev` shows `/` with
  the dark chrome background (`#0b0d10`) and light text instead of the current
  white create-next-app page, and `npm run build` succeeds.
- [x] **Step 2 - Build the BlackBorderTemplate component** - create
  `lib/certificate/types.ts` (`CertificateData`, `Template`),
  `lib/certificate/templates.ts` (the one-entry registry), and
  `components/certificate/BlackBorderTemplate.tsx` matching the reference
  photo as described above, using the locked purple-blue border color. Update
  `app/page.tsx` to render it centered on the page with placeholder data
  (recipient, course, date, instructor - reuse the sample values from
  `prototypes/app.html` for continuity: "Jordan Alvarez", "Full-Stack Web
  Development", a sample date, "Brad Traversy"). *Done when:* `/` renders the
  certificate matching the reference photo's frame, headline, eyebrow,
  recipient/rule, body/course line, and bottom row/logo mark - confirmed by a
  side-by-side screenshot comparison against
  `blueprint/reference/cert-example.png` - and `npm run build` succeeds.

## Files / areas

- `app/globals.css` - theme tokens (edit)
- `app/layout.tsx` - add serif font (edit)
- `app/page.tsx` - render the template with placeholder data (edit, replaces
  create-next-app boilerplate)
- `lib/certificate/types.ts` - new
- `lib/certificate/templates.ts` - new
- `components/certificate/BlackBorderTemplate.tsx` - new

## Data / contracts

```ts
type CertificateData = {
  recipientName: string;
  course: string;
  date: string; // pre-formatted display string; formatting logic is feature 8
  instructorName: string;
  logoUrl?: string; // data URL; absent -> render the placeholder dot-grid mark
};

type Template = {
  id: string; // e.g. "black-border"
  name: string; // display name for the future picker
  Component: React.ComponentType<{ data: CertificateData }>;
};
```

**Load-bearing.** `CertificateData` is what the form (feature 2) will populate
and what the export route (feature 3/4) will pass server-side; `Template` and
the `templates` registry are what the picker (feature 5) will iterate and what
brand settings (feature 6a/6b) will apply color/logo overrides on top of. Don't
reshape these without checking those features.

## Testing

No test command is configured in `AGENTS.md` yet, so this is not a gated
step. `BlackBorderTemplate` is a static, presentational component (no
parsing, formatting, or validation logic lives here yet - that's feature 8),
so it wouldn't be in-scope for a unit test even if a runner existed. Verify
with:

- `npm run build` succeeds after each step.
- A screenshot of `/` after step 2, compared side-by-side against
  `blueprint/reference/cert-example.png` for frame shape, headline treatment,
  name/rule styling, body copy, bottom row, and logo mark placement.

## Notes for the AI

- This repo has no `src/` directory - `app/` and future `components/`,
  `lib/` folders live at the repo root, not under `src/`. Read
  `coding-standards.md`'s `src/components/[feature]/...` convention as
  `components/[feature]/...` here.
- Server component by default - `BlackBorderTemplate` needs no interactivity,
  so it should not be a client component.
- Keep the component pure and prop-driven. It must render correctly standalone
  (no form, no context, no local storage) since feature 3/4's server-side
  Puppeteer render will import and render this exact component outside a
  browser session.
- Don't build any card/sidebar/form chrome around it yet - `/` should just be
  the certificate on the dark background for this feature. Feature 2 rebuilds
  `/` into the real two-column layout.
