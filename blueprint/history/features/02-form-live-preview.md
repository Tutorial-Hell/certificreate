# Feature: Form + live preview

**From build-plan:** feature 2
**Status:** complete

## Goal

Add the input form (recipient name, course, date, instructor) and wire it to
the certificate so the preview updates live as you type - no submit, no
reload. This turns the static, placeholder-data certificate from feature 1
into the actual editable tool.

## Design reference

No external design to match here - `prototypes/` was discarded at feature 1's
`/complete` (its tokens are already live in `app/globals.css`). This is new app
chrome, not a replication of an existing artifact, so it's built from the
project overview's UI/UX section plus the tokens already available:

- Two-column layout: form on the left, live certificate preview on the right.
  On narrow viewports the form stacks above the preview.
- Use the existing dark chrome tokens for the form's card/inputs: `--surface`
  for the card background, `--border` for input/card borders, `--radius`/
  `--radius-sm` for corners, `--text`/`--muted` for labels vs. values,
  `--accent` for focus states.
- The certificate itself (`BlackBorderTemplate`) is unchanged - it just now
  receives live data instead of the feature 1 placeholder constant.

## In scope

- `CertificateForm` - a presentational component with four labeled, controlled
  text inputs: recipient name, course/achievement, date, instructor.
- `CertificateWorkspace` - the client component that owns the form state
  (`useState<CertificateData>`), renders `CertificateForm` and the selected
  template's component side by side, and re-renders the preview on every
  keystroke.
- The two-column responsive layout (desktop side-by-side, mobile stacked).
- Replacing `app/page.tsx`'s static placeholder-data render with
  `CertificateWorkspace`.
- Looking the template up from the `templates` registry (`templates[0]`, i.e.
  `"black-border"`) rather than importing `BlackBorderTemplate` directly, so
  the registry built in feature 1 is actually exercised.

## Out of scope

- **Template picker UI.** Only one template exists; the picker arrives with
  feature 5. This feature reads `templates[0]` directly.
- **Instructor defaulting from brand settings.** The project overview assigns
  "instructor default" to feature 6a, which doesn't exist yet. The instructor
  field starts empty here like the other fields; brand-settings-based
  defaulting is 6a's job, not this one's.
- **Download PNG/PDF buttons.** These belong to features 3 and 4 once export
  actually exists; no dead buttons here.
- Date picker, date formatting/validation, and any Zod validation (feature 8).
- Brand settings panel, logo upload, color overrides (feature 6a, 6b).
- Certificate history and remembering last-used values across reloads
  (feature 7) - state here is in-memory only and resets on refresh.
- Any server round-trip. Nothing is submitted or persisted yet, so no Server
  Action is needed for this feature.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Build the form and wire it live to the preview** - create
  `components/certificate/CertificateForm.tsx` (four labeled controlled
  inputs, no `'use client'` of its own - it's only ever rendered inside a
  client component, so the directive isn't needed on this file) and
  `components/certificate/CertificateWorkspace.tsx` (`'use client'`, owns
  `useState<CertificateData>` initialized to empty strings for all four
  fields, renders the two-column/responsive layout with `CertificateForm` and
  `templates[0].Component` side by side). Update `app/page.tsx` to render
  `CertificateWorkspace` instead of the feature 1 placeholder-data render.
  *Done when:* on `/`, typing in any of the four inputs updates the
  certificate preview immediately with no page reload; narrowing the viewport
  stacks the form above the preview; `npm run build` succeeds.

## Files / areas

- `components/certificate/CertificateForm.tsx` - new
- `components/certificate/CertificateWorkspace.tsx` - new
- `app/page.tsx` - edit (renders `CertificateWorkspace`)

## Data / contracts

No new types. Reuses `CertificateData` and the `templates` registry from
feature 1 unchanged. `CertificateWorkspace`'s internal state shape and its
`onChange` callback into `CertificateForm` are local wiring, not a
cross-feature contract - nothing here is load-bearing for later features the
way `CertificateData` was.

## Testing

No test command is configured in `AGENTS.md`, so this is not a gated step.
There's no parsing/formatting/validation logic in this feature (plain
controlled inputs, no submission) - it wouldn't be in-scope for a unit test
even if a runner existed. Verify with:

- `npm run build` succeeds.
- Manual/browser check: type in each field and confirm the preview updates
  live; resize the viewport and confirm the layout stacks on mobile.

## Notes for the AI

- Client boundary stays as small as possible: only `CertificateWorkspace.tsx`
  needs `'use client'` (it owns the state). `CertificateForm.tsx` doesn't need
  its own directive - once a component is imported into a client component's
  tree it's already part of the client bundle.
- `BlackBorderTemplate` itself needs no changes - it already just renders
  whatever `CertificateData` it's given.
- This repo has no `src/` directory - components live under `components/` at
  the repo root, matching feature 1's layout.
- Keep inputs plain (`<input type="text">`); no date picker, no masking, no
  validation - that's feature 8.
