import { describe, expect, it } from "vitest";
import { parseLastFormValues } from "./last-form-values";

describe("parseLastFormValues", () => {
  it("returns null for null input", () => {
    expect(parseLastFormValues(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseLastFormValues("")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    expect(parseLastFormValues("{not valid json")).toBeNull();
  });

  it("returns null for a partial payload", () => {
    const raw = JSON.stringify({ recipientName: "Jordan Alvarez", course: "Web Dev" });
    expect(parseLastFormValues(raw)).toBeNull();
  });

  it("returns null when a field has the wrong type", () => {
    const raw = JSON.stringify({
      recipientName: "Jordan Alvarez",
      course: "Web Dev",
      date: "Aug 9, 2026",
      instructorName: "Brad Traversy",
      templateId: 42,
    });
    expect(parseLastFormValues(raw)).toBeNull();
  });

  it("parses a fully valid payload", () => {
    const values = {
      recipientName: "Jordan Alvarez",
      course: "Full-Stack Web Development",
      date: "Aug 9, 2026",
      instructorName: "Brad Traversy",
      templateId: "black-border",
    };
    expect(parseLastFormValues(JSON.stringify(values))).toEqual(values);
  });
});
