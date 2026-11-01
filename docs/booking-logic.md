# Booking logic

All of this lives in `src/lib/slots.js`, `src/lib/dates.js`, and `src/lib/appointments.js`.

## Slot ID and date helpers
```js
export const slotId = (date, time) => `${date}_${time.replace(':', '')}`

export const toStartAt = (date, time) => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return Timestamp.fromDate(new Date(y, m - 1, d, h, min))
}

// local YYYY-MM-DD, never use toISOString()
export const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
```

## Generating slots for a date (from settings)
```js
export function generateSlots(settings, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!settings.openDays.includes(new Date(y, m - 1, d).getDay())) return []
  if (settings.closedDates?.includes(dateStr)) return []
  const toMin = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm }
  const open = toMin(settings.openTime), close = toMin(settings.closeTime)
  const bs = settings.breakStart ? toMin(settings.breakStart) : null
  const be = settings.breakEnd ? toMin(settings.breakEnd) : null
  const step = settings.slotMinutes
  const out = []
  for (let t = open; t + step <= close; t += step) {
    if (bs !== null && t < be && t + step > bs) continue // overlaps the break
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}
```
With defaults (09:00-17:00, break 12:00-13:00, 30 min) this gives 9:00-11:30 and 1:00-4:30, matching the Figma.

## What the calendar and slot grid show
- **Calendar day enabled** only if: today or later, weekday in `openDays`, and not in `closedDates`. Everything else is disabled and grey.
- **Slot grid for the selected date**: `generateSlots(...)`, grouped into Morning (before 12:00) and Afternoon.
- **Taken** = a `slots` doc exists for that date. Load with `query(collection(db,'slots'), where('date','==',dateStr))` (single field, no index needed). Use `onSnapshot` so a slot taken by someone else greys out live.
- **Past** slots on today's date are disabled too.
- Taken and past slots: disabled with strikethrough. Selected: black. Available: white with border.
- If a date has zero free slots, disable that day in the calendar (optional, nice to have).

## Booking (one transaction)
```js
export async function bookAppointment({ uid, service, date, time, reason, photoUrl }) {
  const apptRef = doc(collection(db, 'appointments'))      // generate the ID first
  const slotRef = doc(db, 'slots', slotId(date, time))
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(slotRef)
    if (snap.exists()) throw new Error('SLOT_TAKEN')
    tx.set(slotRef, { appointmentId: apptRef.id, patientId: uid, date, time })
    tx.set(apptRef, {
      patientId: uid, serviceId: service.id, serviceName: service.name,
      date, time, startAt: toStartAt(date, time),
      status: 'confirmed', reason: reason || '', photoUrl: photoUrl || '',
      createdAt: serverTimestamp(),
    })
  })
  return apptRef.id
}
```
- Treat `SLOT_TAKEN` and Firestore `permission-denied` from this call as "That time was just taken. Please pick another." Send the user back to the slot step and refresh.
- **Before booking**, enforce the cap: count the patient's `confirmed` appointments with `startAt` in the future (query `where('patientId','==',uid)`, filter in JS). If 2 or more, block with a clear message. This is app-level only.
- Upload the optional photo to Cloudinary first, then pass its URL as `photoUrl`.

## Cancelling (patient)
```js
export const hoursUntil = (appt) => (appt.startAt.toDate() - new Date()) / 36e5
export const canCancelDirectly = (appt) => appt.status === 'confirmed' && hoursUntil(appt) > 24
export const canRequestCancel = (appt) => appt.status === 'confirmed' && hoursUntil(appt) > 0

export async function cancelAppointment(appt) {   // more than 24h away
  const batch = writeBatch(db)
  batch.update(doc(db, 'appointments', appt.id), { status: 'cancelled' })
  batch.delete(doc(db, 'slots', slotId(appt.date, appt.time)))
  await batch.commit()
}

export const requestCancellation = (appt) =>      // inside 24h
  updateDoc(doc(db, 'appointments', appt.id), { status: 'cancel_requested' })
```
UI: show **Cancel** when `canCancelDirectly`, otherwise **Request cancellation** when `canRequestCancel`, otherwise nothing. Confirm with a dialog. Patient updates must change only `status` (the rules enforce it).

## Admin actions
```js
// Approve a cancellation request or cancel any confirmed appointment: same batch as above.
export const approveCancellation = cancelAppointment
export const rejectCancellation = (appt) =>
  updateDoc(doc(db, 'appointments', appt.id), { status: 'confirmed' })
export const markCompleted = (appt) =>
  updateDoc(doc(db, 'appointments', appt.id), { status: 'completed' })
export const markNoShow = (appt) =>
  updateDoc(doc(db, 'appointments', appt.id), { status: 'no_show' })
```
- Admin updates change only `status`.
- `completed` / `no_show` are only offered once `startAt` has passed.
- Completing an appointment should lead to the visit record form.

## Reading data
- Patient dashboard: `where('patientId','==',uid)`, sort and split in JS. Upcoming = `startAt` in the future and status `confirmed` or `cancel_requested`. History tab = visit records for the patient (`where('patientId','==',uid)`), plus past appointments.
- Admin: load all appointments with `onSnapshot`, load all `users` where `role == 'patient'` once into a map by uid, and join names in JS. Filter by status and date range in JS.
