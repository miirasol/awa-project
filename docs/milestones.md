# Milestones

Do one at a time. After each, run `npm run dev`, check the "done when" list, and stop for the user to review before moving on. Don't build ahead.

## M0: Setup check
- Install if missing: `firebase`, `react-router-dom`, `clsx`, `tailwind-merge`; shadcn components: button card input label textarea select calendar tabs table badge dialog sonner avatar checkbox switch skeleton dropdown-menu.
- Create `src/lib/firebase.js` (init app, export `auth`, `db`, `googleProvider`) reading `VITE_FIREBASE_*`.
- Done when: app runs, `.env` is gitignored, firebase.js imports without errors.

## M1: Auth and routing
- `AuthContext` (user, profile from `users/{uid}`, role, loading), Login, Register, Google sign-in, logout, password reset.
- `App.jsx` routes with `ProtectedRoute` (by role), layouts as empty shells, redirect rules from `screens-patient.md`.
- Done when: registering creates a `users` doc with role patient; login works with email and Google; admin (role changed by hand in the console) lands on `/admin/appointments`, patient on `/dashboard`; visiting another role's route redirects.

## M2: Settings and services (admin)
- Admin Settings page and Services page fully working, Cloudinary upload helper (`src/lib/cloudinary.js`: `uploadImage(file)` -> `secure_url`, unsigned preset via `fetch` to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`).
- Dev-only seed button: default settings (open days Sun/Wed/Sat = `[0,3,6]`, 09:00-17:00, break 12:00-13:00, 30 min) and sample services (Consultation, Oral prophylaxis (cleaning), Tooth filling, Tooth extraction, Braces adjustment, Teeth whitening) with placeholder prices.
- Done when: admin can edit settings and add, edit, and deactivate services with images; data shows in the Firebase console.

## M3: Landing page and layouts
- `PublicLayout`, `PatientLayout`, `AdminLayout` finished per design tokens. Landing page reading settings and services.
- Done when: guest sees services and hours from Firestore; nav changes when signed in.

## M4: Booking flow
- `slots.js`, `dates.js`, `appointments.js` from `booking-logic.md`; `/book` with all steps and success screen.
- Done when: only open days are selectable; taken and past slots are disabled live; booking creates both the appointment and the slot doc; booking the same slot from a second browser fails with the friendly message; the 2-appointment cap works; optional photo uploads.

## M5: Patient dashboard and profile
- Upcoming and Visit history tabs, cancel and request-cancellation with the 24h rule, profile settings with avatar upload.
- Done when: cancelling more than 24h ahead frees the slot immediately (it becomes selectable again); inside 24h only "Request cancellation" appears and sets `cancel_requested`.

## M6: Admin appointments
- Stats, Cancellations / Today / All tabs, all actions from `booking-logic.md`.
- Done when: approving a cancellation frees the slot; rejecting returns to confirmed; completed and no-show work on past appointments; filters and search work.

## M7: Admin patients and visit records
- Patients list, detail page, visit record create and edit with image uploads; patient sees records in Visit history.
- Done when: a record added by admin appears on that patient's dashboard and no one else's.

## M8: Polish and demo prep
- Loading, empty, and error states everywhere; responsive pass; consistent toasts; 404 page; README with setup steps (env vars, how to make an admin).
- Done when: a clean walkthrough works end to end: register, book, cancel, admin approves, complete a visit, record shows up for the patient.
