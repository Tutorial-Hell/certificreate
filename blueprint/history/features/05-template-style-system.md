# Feature: Template/style system

**From build-plan:** feature 5
**Status:** complete

## Goal

Go from one hardcoded template to a real multi-template system: a second,
original template design sharing the certificate's existing theme, and a
picker in the UI so the user can choose between them. Both preview and export
(PNG/PDF) must reflect the selected template.

## Design reference

No reference image exists for the second template - only `cert-example.png`
(the real Black Border design already built in feature 1). Per your choice
this session, I'm designing an original second template rather than waiting
on a reference or building infrastructure only. Since there's no image, this
written brief is the review target for Step 1's diff, the same way an image
would be for a replication feature:

**"Modern Line"** - a clean, contemporary counterpart to Black Border's ornate
double-border frame, using the exact same `--cert-*` color tokens (so it's
unmistakably the same brand, just a different composition):

- **Frame:** a single thin rule border in `--cert-border` (no double line, no
  rounded corner flourish) - flatter and more minimal than Black Border.
- **Headline:** large, bold **sans-serif** "Certificate of Completion" (one
  line, using the app's existing sans font, not the Playfair serif) -
  feature 1 deliberately reserved serif for Black Border only, so a
  sans-serif headline is the clearest, most on-brand differentiator for a
  second template.
- **Layout:** left-aligned content block instead of Black Border's fully
  centered composition (eyebrow, recipient name, body line, course all
  left-aligned; a bold accent-colored horizontal rule under the headline as
  the one graphic flourish).
- **Bottom row:** same three-column date / logo / instructor signoff pattern
  as Black Border for consistency, but simpler - a plain hairline rule above
  each value, no extra ornamentation.
- Same aspect ratio (`aspect-[1.414/1]`), same logo mark component contract
  (`logoUrl?: string`, placeholder dot-grid glyph when absent).

If this brief doesn't match what you want once you see the Step 1 diff, that's
the normal review gate working - request changes there before Step 2 builds
on top of it.

## In scope

- A second template component, `ModernLineTemplate`, registered in
  `lib/certificate/templates.ts` alongside `BlackBorderTemplate`.
- A `TemplatePicker` component in the UI (`components/certificate/`) listing
  both templates by name, showing which is selected.
- Making the selected template real React state in `CertificateWorkspace`
  (currently `const template = templates[0]` is a hardcoded module constant),
  driving the live preview and both PNG/PDF download requests.

## Out of scope

- Brand settings, logo upload, or theme-color overrides (feature 6) - both
  templates keep using the fixed `--cert-*` values as-is; no per-user
  overrides yet.
- Certificate history or remembering the last-used template (feature 7) -
  `LastFormValues.templateId` is that feature's job, not this one. The picker
  just defaults to `templates[0].id` (Black Border) on every load, same as
  today.
- Any change to Black Border's own design, markup, or sizing - it must render
  and export pixel-identical to before this feature.
- Date picker/formatting, Zod validation, long-name auto-fit (feature 8) -
  `ModernLineTemplate` handles long text the same minimal way Black Border
  currently does (no new auto-fit logic).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Build and register the "Modern Line" template** -
  `components/certificate/ModernLineTemplate.tsx`, a self-contained component
  matching the brief above (same pattern as `BlackBorderTemplate`: pure,
  presentational, takes `CertificateData`, uses the existing `--cert-*`
  tokens and the same aspect ratio); register it as a second entry
  (`id: "modern-line"`) in `lib/certificate/templates.ts`. *Done when:*
  visiting `/certificate/render?templateId=modern-line&...` with sample data
  renders the new design correctly (screenshot evidence), and Black Border is
  unaffected - `npm run verify` passes, and a regression PNG/PDF export with
  `templateId=black-border` is unchanged from before this step.

- [x] **Step 2 - Add the template picker and wire it up** -
  `components/certificate/TemplatePicker.tsx` (lists both templates by name,
  highlights the selected one); `CertificateWorkspace.tsx` gets a
  `templateId` state (defaulting to `templates[0].id`) replacing the
  hardcoded `template` constant, feeding the live preview's `Template`
  lookup and both PNG/PDF `fetch` bodies. *Done when:* clicking each picker
  option in the running app live-updates the preview to that template
  (verified in a real browser), and downloading PNG and PDF while "Modern
  Line" is selected produces a file rendering that template, not Black
  Border (verified via a direct API request with `templateId: "modern-line"`
  and visual inspection of the result).

## Files / areas

- `components/certificate/ModernLineTemplate.tsx` (new)
- `lib/certificate/templates.ts` (updated: second registry entry)
- `components/certificate/TemplatePicker.tsx` (new)
- `components/certificate/CertificateWorkspace.tsx` (updated: stateful
  `templateId`, picker wired into preview + both download requests)

## Data / contracts

No new stored data types. `Template.id`, `.name`, `.Component` (already
defined, `lib/certificate/types.ts`) is unchanged and already supports N
templates - this feature is the first to actually use that generality.

**Load-bearing:** the new template's `id: "modern-line"` becomes a stable
string other code will reference going forward (URLs, export requests, and
eventually feature 7's `LastFormValues.templateId`) - don't rename it once
Step 1 lands.

## Testing

A `test` command is declared in `AGENTS.md` (Vitest via `npm run verify`),
but neither step introduces new pure logic:

- `templates.ts` is a static registry (data, not logic) - no test, same as
  its existing single-entry version today.
- `ModernLineTemplate` and `TemplatePicker` are presentational
  components - integration/UI, exempt per `coding-standards.md`.
- `CertificateWorkspace`'s new `templateId` state is plain `useState` wiring,
  not a parser/formatter/validator - exempt.

Both steps verify with real render/browser evidence instead (screenshot for
Step 1, a live picker click-through for Step 2), consistent with how
features 1-4 verified their UI and render-pipeline work.

## Notes for the AI

- Keep `ModernLineTemplate` self-contained like `BlackBorderTemplate` (its
  own local `Signoff`/logo-mark treatment, not a forced shared extraction).
  Feature 1 chose self-contained templates deliberately; only extract a
  shared sub-component later if a third template makes the duplication
  clearly wasteful - don't do it preemptively here.
- Reuse the exact same `--cert-*` CSS variables `BlackBorderTemplate` uses
  (`bg`, `border`, `border-inner`, `ink`, `muted`, `hairline`, `shadow`) -
  that shared token set *is* "sharing one theme" per the build-plan wording;
  do not introduce new per-template color variables in this feature.
- `parseCertificateRequest` (`lib/certificate/request.ts`) already falls back
  to `templates[0].id` for an unknown `templateId` - no changes needed there
  for the new template to work through the PNG/PDF routes.
- Style the picker with the same token pattern as `CertificateForm.tsx`
  (`var(--radius)`, `var(--border)`, `var(--surface)`, `var(--accent)`) so it
  matches the app chrome, not the certificate's own light theme.
