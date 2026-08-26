import { describe, expect, it } from "vitest";
import { formatCertificateDate, isValidIsoDate } from "./date";

describe("formatCertificateDate", () => {
  it("formats a valid ISO date", () => {
    expect(formatCertificateDate("2026-08-09")).toBe("Aug 9, 2026");
  });

  it("returns an empty string unchanged", () => {
    expect(formatCertificateDate("")).toBe("");
  });

  it("returns a malformed string unchanged rather than throwing", () => {
    expect(formatCertificateDate("not-a-date")).toBe("not-a-date");
  });

  it("returns an invalid calendar date unchanged (Feb 30 does not exist)", () => {
    expect(formatCertificateDate("2026-02-30")).toBe("2026-02-30");
  });

  it("formats January 1st without a timezone shift", () => {
    expect(formatCertificateDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("formats December 31st without a timezone shift", () => {
    expect(formatCertificateDate("2026-12-31")).toBe("Dec 31, 2026");
  });

  it("returns a 5-digit year unchanged rather than throwing", () => {
    expect(formatCertificateDate("20260-08-09")).toBe("20260-08-09");
  });
});

describe("isValidIsoDate", () => {
  it("accepts a valid ISO date", () => {
    expect(isValidIsoDate("2026-08-09")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidIsoDate("")).toBe(false);
  });

  it("rejects a malformed string", () => {
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });

  it("rejects an invalid calendar date (Feb 30 does not exist)", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
  });

  it("rejects a 5-digit year", () => {
    expect(isValidIsoDate("20260-08-09")).toBe(false);
  });
});
