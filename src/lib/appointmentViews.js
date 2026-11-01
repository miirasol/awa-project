// Pure helpers that decide which appointments belong in which Appointments tab.
// No React / Firebase imports so they can be unit tested.

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n));
}

const ACTIVE = ["confirmed", "cancel_requested"];
const CLOSED = ["completed", "no_show", "cancelled"];

const startMs = (a) => a.startAt.toDate().getTime();
const soonestFirst = (a, b) => startMs(a) - startMs(b);
const newestFirst = (a, b) => startMs(b) - startMs(a);

/**
 * Splits appointments into the tab lists.
 * - today:     everything scheduled today except cancelled (so completed / no-show stay visible)
 * - upcoming:  active appointments on later days, soonest first
 * - requests:  patients asking to cancel
 * - unmarked:  confirmed appointments whose start time has passed (admin must mark them)
 * - history:   completed / no-show / cancelled, newest first
 */
export function buildViews(appts, now = new Date()) {
  const todayStr = ymd(now);
  const nowMs = now.getTime();
  const today = appts.filter((a) => a.date === todayStr && a.status !== "cancelled").sort(soonestFirst);
  const upcoming = appts.filter((a) => a.date > todayStr && ACTIVE.includes(a.status)).sort(soonestFirst);
  const requests = appts.filter((a) => a.status === "cancel_requested").sort(soonestFirst);
  const unmarked = appts.filter((a) => a.status === "confirmed" && startMs(a) < nowMs).sort(newestFirst);
  const history = appts.filter((a) => CLOSED.includes(a.status)).sort(newestFirst);
  return {
    todayStr,
    today,
    upcoming,
    requests,
    unmarked,
    history,
    needsActionCount: requests.length + unmarked.length,
  };
}

/** Groups an already-sorted list into [{ date, items }] keeping order. */
export function groupByDate(list) {
  const groups = [];
  for (const a of list) {
    const last = groups[groups.length - 1];
    if (last && last.date === a.date) last.items.push(a);
    else groups.push({ date: a.date, items: [a] });
  }
  return groups;
}

export function dayLabel(dateStr, todayStr) {
  if (dateStr === todayStr) return "Today";
  if (dateStr === addDays(todayStr, 1)) return "Tomorrow";
  if (dateStr === addDays(todayStr, -1)) return "Yesterday";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** History filters. textOf(a) returns the searchable text (name, email, phone, service...). */
export function filterHistory(list, { status = "all", from = "", to = "", search = "" } = {}, textOf = () => "") {
  const q = search.trim().toLowerCase();
  return list.filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    if (from && a.date < from) return false;
    if (to && a.date > to) return false;
    if (q && !textOf(a).toLowerCase().includes(q)) return false;
    return true;
  });
}
