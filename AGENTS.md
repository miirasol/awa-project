# Dental Clinic Appointment System: Agent Guide

Read this file first. Then read only the docs the current milestone needs (see `docs/milestones.md`).

## What this is

A web app for a single-dentist clinic (class project, Advanced Web Applications). Two roles: **patient** and **admin** (the dentist). No walk-ins; every patient has an account. Bookings are auto-confirmed. Fixed 30-minute slots. The clinic is open only on days set in settings (default Wed, Sat, Sun).

## Stack (already installed, do not swap)

- Vite 8 + React 19, **JavaScript only** (no TypeScript). Import alias `@/` -> `src/` (see `jsconfig.json`).
- Tailwind 4 via `@tailwindcss/vite`. Theme lives in `src/index.css`. There is no `tailwind.config.js`.
- shadcn/ui built on **Base UI** (`@base-ui/react`), NOT Radix. Always open the generated file in `src/components/ui/` before using a component's props. Base UI uses a `render` prop where Radix examples use `asChild`.
- `lucide-react` icons, `sonner` toasts, Geist font (`@fontsource-variable/geist`).
- Firebase JS SDK, modular API: Auth + Firestore only.
- `react-router-dom` for routing.
- Cloudinary for images, called with plain `fetch` (no SDK).

## Hard constraints

- Firebase **Spark (free) plan only**. Do not use Cloud Functions, Firebase Storage, the Admin SDK, or anything that needs Blaze.
- No secrets in code. Config comes from `VITE_*` env vars (`.env.example` lists them). Cloudinary: cloud name + unsigned preset only, never an API secret.
- Do not edit `firestore.rules`. If code can't work under the rules, stop and tell the user.
- Admin accounts are made by hand in the Firebase console (set `role: "admin"` on the `users` doc). The app never creates admins.
- Dates are strings `"YYYY-MM-DD"`, times are strings `"HH:mm"` (24h), and `startAt` is a Firestore `Timestamp`. Build date strings from local date parts, never `toISOString()` (it shifts the day in UTC).
- Use `serverTimestamp()` for `createdAt`.
- Avoid Firestore composite indexes: query on one field, filter and sort the rest in JS. Data volume is tiny.

## Folder structure

```
src/
  lib/          firebase.js, cloudinary.js, dates.js, slots.js, appointments.js, seed.js, utils.js, format.js, authErrors.js, limits.js, appointmentViews.js
  context/      AuthContext.jsx   (user, profile, role, loading, login/register/google/logout)
  components/
    ui/         shadcn components (generated, don't hand-edit unless needed)
    layout/     PublicLayout.jsx, PatientLayout.jsx, AdminLayout.jsx
    ProtectedRoute.jsx
  pages/
    guest/      Landing.jsx, Login.jsx, Register.jsx
    patient/    Book.jsx, Dashboard.jsx, Profile.jsx
    admin/      Appointments.jsx, Patients.jsx, PatientDetail.jsx, Services.jsx, Settings.jsx
  App.jsx       routes
  main.jsx
```

## Conventions

- Function components + hooks. One page per file. Keep Firestore calls in `src/lib/`, not inside JSX.
- Every page handles loading (shadcn `Skeleton`), empty, and error states. Toasts via `sonner`.
- Realtime where it helps (`onSnapshot` for the admin queue and the patient dashboard), one-off `getDocs` elsewhere.
- Follow `docs/design-tokens.md` for all visuals. Each screen must be its own route so it can be captured separately (the team will import pages into Figma with html.to.design).
- Desktop-first layout (1440px), but keep it usable on mobile.

## Docs

- `docs/data-model.md`: collections, fields, statuses
- `docs/booking-logic.md`: slot generation, booking, cancelling, admin actions (with code)
- `docs/screens-patient.md`: guest and patient pages
- `docs/screens-admin.md`: admin pages
- `docs/design-tokens.md`: look and feel
- `docs/milestones.md`: build order with "done when" checklists
- `docs/progress.md`: progress log (newest first)
- `docs/improvements.md`: potential improvements / audit
