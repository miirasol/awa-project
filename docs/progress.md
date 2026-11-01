# Progress log (newest first)

## 2026-11-01
- Fixed in-page hash navigation in PublicLayout: clicking Services/About/Contact (or Home) again while already on the landing page now scrolls even when the URL hash is unchanged; also updated docs for removed aboutText, Monday-first open days, and "No break".
- Removed editable About paragraph (`settings/clinic.aboutText`) from Settings and Landing; About Us now shows only specialties and the three info cards.

## 2026-11-01
- Admin Services: price range entry uses numeric Start/Max inputs (stored as existing `"start-end"` string).
- Added `src/lib/authErrors.js` mapping Firebase auth errors to friendly toasts; used in Login/Register (incl. Google and password reset). Added 8-char password validation on register.
- Added "No break" option in admin Settings; Landing/footer show "No break" when break times empty.
- Open days now display Monday→Sunday on Settings checkboxes and Landing.
- Forced sticky public header via inline style and html scroll-padding-top; menu panel overlays.
- Made public header sticky with overlay mobile menu panel; added scroll-mt-20 to landing sections.
- Mobile public header with collapsible panel; responsive grids on Landing; no horizontal scroll at 320/375/414.
- Added STATUS_LABELS, statusLabel, formatDate, formatTime to src/lib/format.js; applied across admin Appointments, PatientDetail, patient Dashboard, AppointmentDetailsDialog. Fixed status filter trigger labels and filter row layout.
- Fixed patient Dashboard Visit history to one card per visit via merged list (completed appointments + orphan records), formatted dates, clickable thumbnails, Details button.
- Added shared AppointmentDetailsDialog with Details buttons on admin Appointments (Today/All), Patient detail Appointments, and patient Dashboard (Upcoming/Visit history); visit-record attachment thumbnails clickable. Patient visit records matched in JS by appointmentId.
- Restyled Landing per spec: centered containers, hero outline "View services" scrolls, service cards with divider + price/Book now, About Us with specialties and info cards, full footer. Added src/lib/format.js (formatPrice, to12Hour); used in Landing, Book, admin Services.
- Restyled admin pages (Appointments, Patients, PatientDetail, Services, Settings) to design tokens: muted text colors and font weights aligned. No logic changes.
- Restyled patient pages (Book, Dashboard, Profile) to design tokens: muted text colors and font weights aligned. No logic changes.
- Restyled guest pages to design tokens (Landing, Login, Register, NotFound); added optional aboutText field to Settings clinic info (saved via merge) and Landing About section uses it with fallback.

Each entry: date, tool/model, what changed (files), decisions or differences from the other docs, known issues / next steps. Keep entries under 10 lines.

## 2026-11-01
- M0-M7 built earlier; M8 partly done. Deployed to Firebase Hosting (project awa-project-75e8f).
- Fixes pending or done: local-date helper for "Today" tab, AuthContext profile via onSnapshot, settings writes use merge, patient names link to detail, scrollbar fix.
- UI redesign to the new Figma in progress. design-tokens.md and screens-*.md already describe the target design; implement against them.
- Differences from older docs already in the app: landing hero image comes from src/assets; Visit history lists past appointments as well as visit records; closed dates accept a From/To range.
