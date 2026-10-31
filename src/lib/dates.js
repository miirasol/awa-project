import { Timestamp } from "firebase/firestore";

export const slotId = (date, time) => `${date}_${time.replace(':', '')}`;

export const toStartAt = (date, time) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return Timestamp.fromDate(new Date(y, m - 1, d, h, min));
};

export const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function generateSlots(settings, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!settings.openDays.includes(new Date(y, m - 1, d).getDay())) return [];
  if (settings.closedDates?.includes(dateStr)) return [];
  const toMin = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
  const open = toMin(settings.openTime), close = toMin(settings.closeTime);
  const bs = settings.breakStart ? toMin(settings.breakStart) : null;
  const be = settings.breakEnd ? toMin(settings.breakEnd) : null;
  const step = settings.slotMinutes;
  const out = [];
  for (let t = open; t + step <= close; t += step) {
    if (bs !== null && t < be && t + step > bs) continue;
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

export const hoursUntil = (appt) => (appt.startAt.toDate() - new Date()) / 36e5;
export const canCancelDirectly = (appt) => appt.status === 'confirmed' && hoursUntil(appt) > 24;
export const canRequestCancel = (appt) => appt.status === 'confirmed' && hoursUntil(appt) > 0;