import { describe, expect, it } from "vitest";
import { parseCertificateRequest } from "./request";

const validBody = {
  recipientName: "Jane Doe",
  course: "Coding With AI",
  date: "2026-08-21",
  instructorName: "Brad Traversy",
  templateId: "black-border",
};

describe("parseCertificateRequest", () => {
  it("accepts a request with all required fields", () => {
    const result = parseCertificateRequest(validBody);
    expect(result).toEqual({ ok: true, data: validBody });
  });

  it("reports every missing or blank required field", () => {
    const result = parseCertificateRequest({ recipientName: "Jane Doe", course: "  " });
    expect(result).toEqual({
      ok: false,
      errors: ["Course is required", "Date is required", "Instructor is required"],
    });
  });

  it("reports a field that exceeds the max length", () => {
    const result = parseCertificateRequest({ ...validBody, recipientName: "a".repeat(101) });
    expect(result).toEqual({ ok: false, errors: ["Recipient name is too long"] });
  });

  it("falls back to the default template for an unknown templateId", () => {
    const result = parseCertificateRequest({ ...validBody, templateId: "not-a-real-template" });
    expect(result).toEqual({ ok: true, data: { ...validBody, templateId: "black-border" } });
  });

  it("falls back to the default template when templateId is omitted", () => {
    const { templateId: _templateId, ...withoutTemplateId } = validBody;
    const result = parseCertificateRequest(withoutTemplateId);
    expect(result).toEqual({ ok: true, data: validBody });
  });
});
