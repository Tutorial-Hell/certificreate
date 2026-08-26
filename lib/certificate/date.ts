const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = ISO_DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isValidCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isValidCalendarDate ? { year, month, day } : null;
}

// Exactly a 4-digit year, real calendar date. A native <input type="date">
// doesn't guarantee this - the HTML spec only requires "four or more"
// year digits, so a user can type a 5-digit year.
export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

// Constructs the Date from local y/m/d components rather than parsing the ISO
// string directly - `new Date("2026-08-09")` parses as UTC midnight, which can
// display as the previous day in timezones behind UTC.
export function formatCertificateDate(isoDate: string): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return isoDate;

  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
