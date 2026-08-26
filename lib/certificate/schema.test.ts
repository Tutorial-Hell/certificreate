import { describe, expect, it } from "vitest";
import {
  COURSE_MAX_LENGTH,
  INSTRUCTOR_NAME_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
  validateCertificateData,
} from "./schema";

const validData = {
  recipientName: "Jordan Alvarez",
  course: "Full-Stack Web Development",
  date: "2026-08-09",
  instructorName: "Brad Traversy",
};

describe("validateCertificateData", () => {
  it("accepts fully valid data", () => {
    expect(validateCertificateData(validData)).toEqual({ valid: true, errors: {} });
  });

  it("rejects an empty recipient name", () => {
    const result = validateCertificateData({ ...validData, recipientName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.recipientName).toBe("Recipient name is required");
  });

  it("rejects a whitespace-only course", () => {
    const result = validateCertificateData({ ...validData, course: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors.course).toBe("Course is required");
  });

  it("rejects an empty date", () => {
    const result = validateCertificateData({ ...validData, date: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBe("Date is required");
  });

  it("rejects a 5-digit year", () => {
    const result = validateCertificateData({ ...validData, date: "20260-08-09" });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBe("Enter a valid date");
  });

  it("rejects an impossible calendar date", () => {
    const result = validateCertificateData({ ...validData, date: "2026-02-30" });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBe("Enter a valid date");
  });

  it("rejects an empty instructor name", () => {
    const result = validateCertificateData({ ...validData, instructorName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.instructorName).toBe("Instructor is required");
  });

  it("rejects a recipient name over the max length", () => {
    const result = validateCertificateData({
      ...validData,
      recipientName: "a".repeat(RECIPIENT_NAME_MAX_LENGTH + 1),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.recipientName).toBe("Recipient name is too long");
  });

  it("rejects a course name over the max length", () => {
    const result = validateCertificateData({
      ...validData,
      course: "a".repeat(COURSE_MAX_LENGTH + 1),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.course).toBe("Course name is too long");
  });

  it("rejects an instructor name over the max length", () => {
    const result = validateCertificateData({
      ...validData,
      instructorName: "a".repeat(INSTRUCTOR_NAME_MAX_LENGTH + 1),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.instructorName).toBe("Instructor name is too long");
  });

  it("reports every invalid field at once", () => {
    const result = validateCertificateData({
      recipientName: "",
      course: "",
      date: "",
      instructorName: "",
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual([
      "course",
      "date",
      "instructorName",
      "recipientName",
    ]);
  });
});
