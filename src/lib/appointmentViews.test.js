import { describe, it, expect } from "vitest";
import { addDays, buildViews, groupByDate, dayLabel, filterHistory } from "./appointmentViews";

// Fake appointment with the bits the helpers read (startAt.toDate())
const mk = (id, date, time, status) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const start = new Date(y, m - 1, d, h, min);
  return { id, date, time, status, startAt: { toDate: () => start } };
};

// "Now" = Nov 1, 2026, 3:00 PM local
const NOW = new Date(2026, 10, 1, 15, 0);

const data = [
  mk("completedToday", "2026-11-01", "14:30", "completed"),
  mk("noShowToday", "2026-11-01", "14:00", "no_show"),
  mk("pastConfirmedToday", "2026-11-01", "13:00", "confirmed"),
  mk("laterToday", "2026-11-01", "16:00", "confirmed"),
  mk("cancelledToday", "2026-11-01", "10:00", "cancelled"),
  mk("nextWeek", "2026-11-04", "09:00", "confirmed"),
  mk("requestLater", "2026-11-06", "09:30", "cancel_requested"),
  mk("oldConfirmed", "2026-10-31", "13:00", "confirmed"),
  mk("cancelledLater", "2026-11-07", "17:30", "cancelled"),
];
const ids = (list) => list.map((a) => a.id);

describe("buildViews", () => {
  const v = buildViews(data, NOW);

  it("today keeps completed / no-show / pending, but not cancelled, in time order", () => {
    expect(ids(v.today)).toEqual(["pastConfirmedToday", "noShowToday", "completedToday", "laterToday"]);
  });

  it("upcoming has only active appointments on later days, soonest first", () => {
    expect(ids(v.upcoming)).toEqual(["nextWeek", "requestLater"]);
  });

  it("requests are cancel_requested appointments", () => {
    expect(ids(v.requests)).toEqual(["requestLater"]);
  });

  it("unmarked are confirmed appointments already in the past", () => {
    expect(ids(v.unmarked).sort()).toEqual(["oldConfirmed", "pastConfirmedToday"]);
  });

  it("a confirmed appointment later today is not 'needs action' yet", () => {
    expect(ids(v.unmarked)).not.toContain("laterToday");
  });

  it("history holds closed appointments, newest first", () => {
    expect(ids(v.history)).toEqual(["cancelledLater", "completedToday", "noShowToday", "cancelledToday"]);
  });

  it("counts needs-action as requests + unmarked", () => {
    expect(v.needsActionCount).toBe(3);
  });

  it("every appointment shows up in at least one tab", () => {
    const seen = new Set([...v.today, ...v.upcoming, ...v.requests, ...v.unmarked, ...v.history].map((a) => a.id));
    expect(data.filter((a) => !seen.has(a.id))).toEqual([]);
  });

  it("handles an empty list", () => {
    const e = buildViews([], NOW);
    expect(e.today).toEqual([]);
    expect(e.needsActionCount).toBe(0);
  });

  it("uses the date string, so a late-night appointment is still 'today'", () => {
    const late = mk("late", "2026-11-01", "23:30", "confirmed");
    expect(ids(buildViews([late], NOW).today)).toEqual(["late"]);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("groupByDate / dayLabel", () => {
  it("groups consecutive appointments by date", () => {
    const g = groupByDate([mk("a", "2026-11-04", "09:00", "confirmed"), mk("b", "2026-11-04", "10:00", "confirmed"), mk("c", "2026-11-06", "09:00", "confirmed")]);
    expect(g.map((x) => [x.date, x.items.length])).toEqual([["2026-11-04", 2], ["2026-11-06", 1]]);
  });

  it("labels today, tomorrow and yesterday", () => {
    expect(dayLabel("2026-11-01", "2026-11-01")).toBe("Today");
    expect(dayLabel("2026-11-02", "2026-11-01")).toBe("Tomorrow");
    expect(dayLabel("2026-10-31", "2026-11-01")).toBe("Yesterday");
    expect(dayLabel("2026-11-07", "2026-11-01")).toContain("Nov");
  });
});

describe("filterHistory", () => {
  const list = [mk("a", "2026-10-30", "09:00", "completed"), mk("b", "2026-11-02", "09:00", "cancelled"), mk("c", "2026-11-05", "09:00", "no_show")];
  const text = (a) => ({ a: "Noreen braces", b: "James cleaning", c: "Benedict braces" })[a.id];

  it("filters by status, date range and text", () => {
    expect(ids(filterHistory(list, { status: "cancelled" }, text))).toEqual(["b"]);
    expect(ids(filterHistory(list, { from: "2026-11-01", to: "2026-11-03" }, text))).toEqual(["b"]);
    expect(ids(filterHistory(list, { search: "BRACES" }, text))).toEqual(["a", "c"]);
  });

  it("returns everything with no filters", () => {
    expect(filterHistory(list, {}, text)).toHaveLength(3);
  });
});
