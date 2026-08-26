const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Constructs the Date from local y/m/d components rather than parsing the ISO
// string directly - `new Date("2026-08-09")` parses as UTC midnight, which can
// display as the previous day in timezones behind UTC.
export function formatCertificateDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  const match = ISO_DATE_PATTERN.exec(trimmed);
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isValidCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isValidCalendarDate) return isoDate;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
