import { describe, it, expect } from "vitest";
import { formatPrice, statusLabel, to12Hour, formatDate } from "./format";

describe("formatPrice", () => {
  it("formats range", () => {
    expect(formatPrice("500-800")).toBe("₱500 – ₱800");
  });
  it("handles empty", () => {
    expect(formatPrice("")).toBe("");
    expect(formatPrice(null)).toBe("");
  });
});

describe("to12Hour", () => {
  it("converts", () => {
    expect(to12Hour("09:30")).toBe("9:30 AM");
    expect(to12Hour("13:05")).toBe("1:05 PM");
    expect(to12Hour("12:00")).toBe("12:00 PM");
    expect(to12Hour("00:00")).toBe("12:00 AM");
  });
});

describe("statusLabel", () => {
  it("maps known", () => {
    expect(statusLabel("cancel_requested")).toBe("Cancel requested");
  });
  it("falls back", () => {
    expect(statusLabel("foo")).toBe("foo");
  });
});

describe("formatDate", () => {
  it("formats local date string", () => {
    expect(formatDate("2026-11-04")).toBe("Nov 4, 2026");
  });
});
