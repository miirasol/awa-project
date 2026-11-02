# Project overview

Dental Clinic Appointment System — a web app for a single-dentist clinic. Two roles: **patient** and **admin** (the dentist). No walk-ins; every patient has an account. Bookings are auto-confirmed. Fixed 30-minute slots. The clinic is open only on days set in settings (default Wed, Sat, Sun).

Stack: Vite 8 + React 19 (JavaScript), Tailwind 4, shadcn/ui on Base UI, Firebase Auth + Firestore, Cloudinary for images.

## Folder structure

```
src/
  lib/          firebase.js, cloudinary.js, dates.js, slots.js, appointments.js, seed.js, useLastDefined.js, utils.js, format.js, limits.js
  context/      AuthContext.jsx
  components/   ui/ (shadcn), layout/ (Public/Patient/Admin layouts), ProtectedRoute, StatusBadge, AppointmentDetailsDialog, ImageLightbox
  pages/        guest/, patient/, admin/
  App.jsx       routes
  main.jsx
```

## Routing and role flow

`src/App.jsx` defines routes. Public routes (`/`, `/login`, `/register`) use `PublicLayout`. Patient routes (`/book`, `/dashboard`, `/profile`) are guarded by `ProtectedRoute role="patient"`. Admin routes (`/admin/*`) are guarded by `ProtectedRoute role="admin"`. `GuestOnly` redirects logged-in users away from login/register.

`ProtectedRoute` reads `user`, `loading`, and `role` from `AuthContext`. Role is taken from the `users/{uid}` document, not from Firebase Auth claims.

## Auth and the users profile doc

`src/context/AuthContext.jsx` wraps Firebase Auth. On login/register/Google sign-in it reads (or creates) `users/{uid}`. Registration always sets `role: "patient"`; admin accounts are created manually in the Firebase console by setting `role: "admin"`. The `registeringRef` flag and the `deleteUser` rollback in `register()` prevent a blank-profile race on failed registration.

## Firestore collections

See `docs/data-model.md` for full field tables. Summary:

- `users/{uid}` — profile + role.
- `services/{id}` — service catalog (isActive toggles bookability; never deleted).
- `appointments/{id}` — bookings with status (`confirmed`, `cancel_requested`, `cancelled`, `completed`, `no_show`).
- `slots/{date_time}` — double-booking guard; exists only while a time is taken.
- `visitRecords/{id}` — admin-written visit notes per appointment.
- `settings/clinic` — single doc with clinic hours, open days, closed dates, slot length.

## Booking and the slot double-booking guard

`src/lib/slots.js` generates candidate slots from settings. `src/lib/appointments.js` `bookAppointment` runs a Firestore transaction: it reads `slots/{date_time}`; if it exists, throws `SLOT_TAKEN`; otherwise it writes both the slot doc and the appointment doc atomically. The slot doc is the guard — it exists only while the time is taken and is deleted when an appointment becomes `cancelled`.

Before booking, the patient's confirmed future appointments are counted; 2 or more blocks booking (app-level cap). Photos are uploaded to Cloudinary first, then the URL is stored on the appointment.

Dates are stored as `"YYYY-MM-DD"` strings and built from local date parts (never `toISOString()`). `startAt` is a Firestore `Timestamp`.

## Admin Appointments tabs

`src/pages/admin/Appointments.jsx` subscribes to all appointments and users. `src/lib/appointmentViews.js` (`buildViews`) splits them into:

- **Today** — appointments whose date equals today.
- **Upcoming** — confirmed appointments after today, grouped by date.
- **Needs action** — cancellation requests plus past confirmed appointments still to mark (completed/no-show).
- **History** — everything else, filterable by status, date range, and search.

Stat cards at the top link to the relevant tab.

## Key files per feature

| Feature | Key files |
|---|---|
| Auth / profile | `src/context/AuthContext.jsx`, `src/lib/authErrors.js` |
| Routing / guards | `src/App.jsx`, `src/components/ProtectedRoute.jsx` |
| Booking | `src/pages/patient/Book.jsx`, `src/lib/slots.js`, `src/lib/dates.js`, `src/lib/appointments.js`, `src/lib/cloudinary.js` |
| Patient dashboard | `src/pages/patient/Dashboard.jsx` |
| Admin appointments | `src/pages/admin/Appointments.jsx`, `src/lib/appointmentViews.js` |
| Admin patients/records | `src/pages/admin/Patients.jsx`, `src/pages/admin/PatientDetail.jsx` |
| Services | `src/pages/admin/Services.jsx` |
| Settings / seed | `src/pages/admin/Settings.jsx`, `src/lib/seed.js` |
| Dialog close animation | `src/lib/useLastDefined.js`, `src/components/AppointmentDetailsDialog.jsx` |
| Formatting | `src/lib/format.js` |
| Validation limits | `src/lib/limits.js` (mirrored in `firestore.rules`) |
