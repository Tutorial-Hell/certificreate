import { describe, expect, it } from "vitest";
import { computeFitScale } from "./auto-fit";

describe("computeFitScale", () => {
  it("returns 1 when the text already fits", () => {
    expect(computeFitScale(400, 300)).toBe(1);
  });

  it("returns 1 when the text exactly fits", () => {
    expect(computeFitScale(400, 400)).toBe(1);
  });

  it("shrinks proportionally when the text overflows", () => {
    expect(computeFitScale(200, 400)).toBe(0.5);
  });

  it("never returns more than 1", () => {
    expect(computeFitScale(1000, 100)).toBe(1);
  });

  it("returns 1 for a zero available width instead of dividing by it", () => {
    expect(computeFitScale(0, 400)).toBe(1);
  });

  it("returns 1 for a negative or zero natural width", () => {
    expect(computeFitScale(400, 0)).toBe(1);
    expect(computeFitScale(400, -10)).toBe(1);
  });
});
