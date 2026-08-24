import { describe, expect, it } from "vitest";
import {
  addHistoryEntry,
  MAX_HISTORY_ENTRIES,
  parseCertificateHistory,
  type CertificateHistoryEntry,
} from "./history";

function makeEntry(overrides: Partial<CertificateHistoryEntry> = {}): CertificateHistoryEntry {
  return {
    id: "1",
    recipientName: "Jordan Alvarez",
    course: "Full-Stack Web Development",
    date: "Aug 9, 2026",
    instructorName: "Brad Traversy",
    templateId: "black-border",
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe("parseCertificateHistory", () => {
  it("returns an empty array for null input", () => {
    expect(parseCertificateHistory(null)).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseCertificateHistory("")).toEqual([]);
  });

  it("returns an empty array for corrupt JSON", () => {
    expect(parseCertificateHistory("{not valid json")).toEqual([]);
  });

  it("returns an empty array for a non-array payload", () => {
    expect(parseCertificateHistory(JSON.stringify({ foo: "bar" }))).toEqual([]);
  });

  it("filters out malformed entries while keeping valid ones", () => {
    const valid = makeEntry();
    const raw = JSON.stringify([valid, { id: "2", recipientName: 42 }, null, "oops"]);
    expect(parseCertificateHistory(raw)).toEqual([valid]);
  });

  it("parses a fully valid array", () => {
    const entries = [makeEntry({ id: "1" }), makeEntry({ id: "2" })];
    expect(parseCertificateHistory(JSON.stringify(entries))).toEqual(entries);
  });
});

describe("addHistoryEntry", () => {
  it("prepends the new entry", () => {
    const existing = [makeEntry({ id: "old" })];
    const next = makeEntry({ id: "new" });
    expect(addHistoryEntry(existing, next)).toEqual([next, ...existing]);
  });

  it("caps the list at MAX_HISTORY_ENTRIES", () => {
    const existing = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      makeEntry({ id: `existing-${i}` }),
    );
    const next = makeEntry({ id: "new" });
    const result = addHistoryEntry(existing, next);
    expect(result).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(result[0]).toEqual(next);
    expect(result[result.length - 1].id).not.toBe(existing[existing.length - 1].id);
  });
});
