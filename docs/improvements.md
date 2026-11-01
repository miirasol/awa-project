# Potential improvements / audit (2026-11-01)

## High
1. Closed-date range uses UTC parsing (`src/pages/admin/Settings.jsx`, `addClosed`) — parse `YYYY-MM-DD` manually into local dates.
2. Google sign-in profile race (`src/context/AuthContext.jsx`, guest pages) — wait for `users/{uid}` before navigating.
3. No validation on admin schedule inputs (`src/pages/admin/Settings.jsx`) — reject `openTime >= closeTime` and invalid break windows.

## Medium
4. Missing empty/error states (`Book.jsx`, `Patients.jsx`, `Appointments.jsx`, `PatientDetail.jsx`).
5. Unguarded form inputs (Services, Profile, PatientDetail visit records).
6. Cloudinary uploads unguarded (`src/lib/cloudinary.js`) — add size/type checks and clearer errors.
7. Password length mismatch (Register 8 vs Firebase default 6).
8. `creatingRef` never cleared in `AuthContext.jsx`.
9. Admin patient map is snapshot-once (`Appointments.jsx`) — new patients missing until reload.
10. `ProtectedRoute`/`GuestOnly` render `null` while loading — use skeletons.

## Low
11. Lint cleanup (unused imports in `Dashboard.jsx`, `Book.jsx`, `Landing.jsx`).
12. Hook dependency warnings (`Book.jsx`, `PatientDetail.jsx`, `Patients.jsx`).
13. UTC date parsing in dashboard ordering (`Dashboard.jsx`).
14. `formatPrice` does not guard NaN (`src/lib/format.js`).
15. Accessibility gaps (alt text, labels, dialog context).
16. Performance/chunking (large input bundle, full appointments collection).

## UI/UX improvements
- Skeletons for auth/profile loading instead of blank screens.
- Inline validation and disabled submit states across admin forms.
- Clear empty states with CTAs.
- Specific Cloudinary upload errors and progress.
- Mobile-friendly tables (horizontal scroll or cards).
- Consistent confirmation dialogs for destructive actions.
- Pagination or date-range scoping for admin appointments.
