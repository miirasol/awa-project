import { describe, it, expect } from "vitest";
import { slotId, toStartAt, toDateString, generateSlots, canCancelDirectly, canRequestCancel } from "./dates";
import { Timestamp } from "firebase/firestore";

describe("slotId", () => {
  it("formats date_time", () => {
    expect(slotId("2026-11-04", "09:30")).toBe("2026-11-04_0930");
  });
});

describe("toDateString", () => {
  it("uses local date parts", () => {
    const d = new Date(2026, 10, 4, 23, 59);
    expect(toDateString(d)).toBe("2026-11-04");
  });
});

describe("generateSlots", () => {
  const settings = {
    openDays: [0, 1, 2, 3, 4, 5, 6],
    openTime: "09:00",
    closeTime: "12:00",
    breakStart: "10:00",
    breakEnd: "10:30",
    slotMinutes: 30,
    closedDates: [],
  };

  it("generates slots excluding break", () => {
    expect(generateSlots(settings, "2026-11-04")).toEqual(["09:00", "09:30", "10:30", "11:00", "11:30"]);
  });

  it("returns [] for closed date", () => {
    expect(generateSlots({ ...settings, closedDates: ["2026-11-04"] }, "2026-11-04")).toEqual([]);
  });

  it("returns [] for non-open weekday", () => {
    expect(generateSlots({ ...settings, openDays: [1] }, "2026-11-04")).toEqual([]); // Nov 4 2026 is Wed (3)
  });
});

describe("toStartAt", () => {
  it("builds local timestamp", () => {
    const ts = toStartAt("2026-11-04", "09:30");
    const d = ts.toDate();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(4);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
  });
});

describe("cancel helpers", () => {
  it("canCancelDirectly requires >24h", () => {
    const future = new Date(Date.now() + 25 * 36e5);
    const appt = { status: "confirmed", startAt: Timestamp.fromDate(future) };
    expect(canCancelDirectly(appt)).toBe(true);
    expect(canRequestCancel(appt)).toBe(true);
  });
  it("cannot cancel non-confirmed", () => {
    const future = new Date(Date.now() + 25 * 36e5);
    const appt = { status: "completed", startAt: Timestamp.fromDate(future) };
    expect(canCancelDirectly(appt)).toBe(false);
    expect(canRequestCancel(appt)).toBe(false);
  });
});