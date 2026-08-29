# Reset the form to defaults when history is cleared

## Type: Fix

## The problem

`CertificateHistoryPanel`'s "Clear History" action (added in the previous fix,
`blueprint/history/fixes/clear-certificate-history.md`) only clears the
`certificreate:history` local storage key. The form (`CertificateWorkspace.tsx`)
keeps whatever recipient/course/date/instructor/template values were last
entered, and those get written straight back to `certificreate:last-form-values`
on the next render via the existing persist effect - so a "clear" doesn't feel
like a clean reset when the form still shows old data.

## The fix

When the user confirms "Clear History," also reset the live form to its
defaults, not just wipe the history list:

- `components/certificate/CertificateWorkspace.tsx` already defines `emptyData`
  (all fields `""`) and initializes `templateId` from `templates[0].id`
  (`"black-border"`). Add a `handleClearHistory` function that calls
  `clearHistoryEntries()` (the existing hook function from the prior fix) and
  then `setData(emptyData)` and `setTemplateId(templates[0].id)`. Pass this
  new function to `CertificateHistoryPanel`'s `onClearHistory` prop instead of
  `clearHistoryEntries` directly.
- No direct write to `certificreate:last-form-values` is needed: the existing
  persist effect (`useEffect` keyed on `data`/`templateId`, once
  `formValuesLoaded`) already re-serializes `{...data, templateId}` into that
  key on every state change, so resetting `data`/`templateId` naturally
  overwrites it with defaults.
- `instructorName` resets to `""`, which lets the existing brand-settings
  effect (`prev.instructorName ? prev : { ...prev, instructorName:
  brandSettings.instructorName }`) refill it from the brand default on the
  next render, same as a fresh page load - do not special-case instructor name.
- Brand settings (logo, instructor default, colors) must not be touched by
  this action - only the history entries, the form fields, and the selected
  template.

## Build steps

1. [x] Add `handleClearHistory` in `CertificateWorkspace.tsx` and wire it to
   `CertificateHistoryPanel`'s `onClearHistory` prop.
   **Done when:** with history entries present and the form filled in with
   non-default values (recipient, course, date, a non-default template),
   clicking "Clear History" and confirming empties the history list AND resets
   the form fields to blank, the template picker back to Black Border, and the
   preview back to its empty-state look; the instructor field refills from the
   brand default (if one is set) rather than staying blank; reloading the page
   confirms `certificreate:last-form-values` now holds the default values, not
   the old ones; brand settings (logo/instructor default/colors) are
   unaffected.
   **Verified:** manual browser check (Playwright) - filled the form, switched
   to Modern Line, seeded a history entry, clicked Clear History twice.
   History emptied, form fields returned to placeholders, template picker
   reset to Black Border (pressed), preview showed placeholder copy, Download
   buttons disabled again. Read back `certificreate:last-form-values` after
   the clear: `{"recipientName":"","course":"","date":"","instructorName":"",
   "templateId":"black-border"}` - defaults, not the pre-clear values.
   Brand settings panel (logo/instructor default/colors) untouched throughout.
   `npm run verify` passes (76 tests, build clean). No new unit test: this
   step is UI wiring (state resets on an existing handler), not new
   logic-bearing code, so it rides on build + browser evidence per the
   Testing scope rule.

## Verify

- Run `npm run verify` (typecheck, test, build).
- Manually: fill in the form with a non-default template and values, generate
  a certificate so history has an entry, click "Clear History" and confirm.
  Check the form resets to blank/default template and the preview reflects
  that. Reload and confirm the form stays at defaults (not the pre-clear
  values) and brand settings are untouched.

## Findings

_No findings recorded against this fix._
