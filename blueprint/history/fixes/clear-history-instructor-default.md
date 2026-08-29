# Clear History doesn't refill instructor name with the brand default

## Type: Fix

## The problem

`handleClearHistory` in `components/certificate/CertificateWorkspace.tsx`
resets `data` to `emptyData` (all fields `""`, including `instructorName`).
The intent, per the previous fix
(`blueprint/history/fixes/reset-form-on-clear-history.md`), was for the
instructor field to then refill from the brand default, the same as a fresh
page load.

That refill is driven by an existing effect:

```ts
useEffect(() => {
  if (!brandSettingsLoaded || !brandSettings.instructorName) return;
  setData((prev) =>
    prev.instructorName ? prev : { ...prev, instructorName: brandSettings.instructorName },
  );
}, [brandSettingsLoaded, brandSettings.instructorName]);
```

Its dependency array is `[brandSettingsLoaded, brandSettings.instructorName]`
- it does not depend on `data`. So calling `setData(emptyData)` from
`handleClearHistory` does not retrigger it. The instructor field goes blank
after Clear History and stays blank until the next full page reload (when
`brandSettingsLoaded` flips on mount), even when a brand default instructor is
set. This was not caught in the previous fix's manual verification because no
brand default was configured during that test.

## The fix

In `handleClearHistory`, set `instructorName` directly from
`brandSettings.instructorName` instead of leaving it to the effect:

```ts
const handleClearHistory = () => {
  clearHistoryEntries();
  setData({ ...emptyData, instructorName: brandSettings.instructorName });
  setTemplateId(templates[0].id);
};
```

`brandSettings.instructorName` is already `""` when no default is configured,
so this is safe with or without a brand default set - matching the "blank
until reload" case exactly when there's nothing to refill. Do not change the
existing brand-settings-fill effect; it's still needed for the initial page
load path.

## Build steps

1. [x] Update `handleClearHistory` to seed `instructorName` from
   `brandSettings.instructorName` when resetting `data`.
   **Done when:** with a brand default instructor set (e.g. "Brad Traversy")
   and the form/instructor field showing something else, clicking "Clear
   History" and confirming immediately shows the brand default instructor in
   the field and preview - no reload needed. With no brand default set,
   clearing still leaves the instructor field blank (unchanged from current
   behavior). Recipient, course, date, and template still reset to blank/
   default exactly as before.
   **Verified:** manual browser check (Playwright), both branches of the
   condition. (1) Brand default set to "Brad Traversy", form instructor set
   to "Someone Else", history seeded - clicked Clear History twice: field and
   preview immediately showed "Brad Traversy" with no reload;
   `certificreate:last-form-values` confirmed
   `instructorName:"Brad Traversy"` afterward, other fields blank,
   `templateId:"black-border"`. (2) Brand default cleared, form instructor set
   to "Temp Instructor", history reseeded - clicked Clear History twice: field
   and preview went blank (placeholder "Instructor Name" shown), matching
   prior behavior. `npm run verify` passes (76 tests, build clean). No new
   unit test: same UI-wiring rationale as the prior fix in this chain - no new
   logic-bearing function, just an existing state setter reading an existing
   value.

## Verify

- Run `npm run verify` (typecheck, test, build).
- Manually: in Brand settings, set a default instructor name. Fill the
  certificate form with a different instructor name (and other non-default
  values). Generate a certificate so history has an entry. Click "Clear
  History" and confirm - check the instructor field and preview immediately
  show the brand default instructor, without reloading. Then clear the brand
  default instructor and repeat: confirm the instructor field goes blank as
  before.

## Findings

_No findings recorded against this fix._
