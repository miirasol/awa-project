# Admin screens (current design)

Shell and tokens: `design-tokens.md`. All routes require `role == "admin"`. Admins never book appointments (no walk-ins).

| route                  | page           |
| ---------------------- | -------------- |
| `/admin/appointments`  | Appointments   |
| `/admin/patients`      | Patients list  |
| `/admin/patients/:uid` | Patient detail |
| `/admin/services`      | Services       |
| `/admin/settings`      | Settings       |

## Appointments

Title "Appointments". Three stat cards (`rounded-xl border p-5`, muted label over `text-3xl font-semibold` value): Cancellation requests, Today's appointments, Upcoming confirmed. "Today" uses the local date (`toDateString(new Date())`), never `toISOString()`. Segmented tabs: Cancellations, Today, All.

- **Cancellations:** a card per request (flex between, `p-5`): bold "<Name> · <phone>", muted "Nov 7, 2026 · 9:30 AM · <Service>", "Reason: ..." (`text-sm`). Right: black sm "Approve" (cancel + free slot) and outline sm "Reject" (back to confirmed).
- **Today:** card per appointment: bold "9:00 AM · <Patient>", muted service, "Confirmed" badge at the right.
- **All:** filters with labels: Search ("Patient name"), Status (select, "All statuses"), From, To (date inputs). Table: Date, Time, Patient (link to `/admin/patients/:uid`), Service, Status (badge), Actions. Past confirmed rows: black sm "Complete" and outline sm "No-show". Future confirmed rows: outline sm "Cancel" (admin cancel, frees slot). Completed and cancel_requested rows: no action. Dates like "Jul 15, 2026", times like "9:30 AM".
  Data: `onSnapshot` on appointments, patient names joined from a one-time load of patient users.

## Patients list

Title "Patients"; "Search" label and input (~256px). Table: Name, Phone, Email, Visits, Last visit ("—" if none). Rows link to the detail page.

## Patient detail

Header card (`rounded-xl border p-6`): 64px initials/avatar circle, name (`text-2xl font-semibold`), muted "email · phone", muted "birthdate · address". Tabs "Appointments" and "Visit records".

- Appointments: cards with service (font-semibold), muted "date · time", status badge at the right.
- Visit records: black "Add visit record" at the top; cards with service (font-semibold) and outline sm "Edit" at the right, muted date, notes, muted "Next: ...", attachment thumbnails. Add/edit dialogs: only `completed` appointments without a record can get a new one; fields procedure, notes, next-visit suggestion, multi-image upload (Cloudinary).

## Services

Title "Services" with black "Add service" at the right. 3-column grid of cards (`rounded-xl border p-4`): image on top (`h-40 rounded-lg object-cover`, or a dashed placeholder), name (font-semibold), muted description, price (font-semibold, "₱500 – ₱800"), then a row with the shadcn Switch + "Active"/"Inactive" label left and an outline sm "Edit" right. Add/Edit dialog with image upload. Deactivate, never delete.

## Settings

Title "Settings"; content `max-w-[760px]`. Three cards:

1. **Schedule:** checkboxes Mon..Sun; Open time + Close time; "No break" checkbox that clears Break start/end (optional break); Break start + Break end (disabled when "No break"); muted "Slot length: 30 min (fixed)". Save button.
2. **Closed dates:** From and To date inputs side by side with a black "Add" button on the same row (aligned to the inputs' bottom); muted "Leave end date empty for a single day." No footer band. Below a divider: list of upcoming closures with a remove button each (keep the current storage format, an array of `YYYY-MM-DD` strings).
3. **Clinic info:** Clinic name, Address, Phone, Email (two columns). Save button.
   Each card saves only its own fields with `{ merge: true }`; never remove `slotMinutes`. Keep the dev-only seed button at the bottom.

## Appointment details dialog (shared component `AppointmentDetailsDialog`)

Outline sm "Details" button on the Today cards, All table rows (extra action column or in the Actions cell), and the Patient detail Appointments tab. Same dialog as the patient side, plus patient name and phone: service, date, time, status; **Reason** (or "No reason given"); **Patient's photo** if `photoUrl` exists (click opens the full image); for `completed` appointments with a visit record: procedure, notes, next-visit suggestion, and attached images as clickable thumbnails. The admin may load the record with `query(visitRecords, where('appointmentId','==',id))` when the dialog opens (or from records already loaded on the page). Completed appointments without a record show a muted "No visit record yet" and, for the admin, a button that opens the add-visit-record dialog.
