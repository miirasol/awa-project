# Guest and patient screens (current design)

Shells and tokens: see `design-tokens.md`. Routes and access are unchanged:
`/` Landing, `/login`, `/register` (guests only); `/book`, `/dashboard`, `/profile` (patient); after login admin -> `/admin/appointments`, patient -> `/dashboard`. Unknown routes show the 404 page.

## Landing (`/`)

Container `max-w-[1140px] mx-auto px-6`. Sections:

1. **Hero** (two columns, vertically centered). Left: muted `text-sm` "Care starts with you"; h1 "Book a dental visit with confidence"; muted "Schedule your appointment in minutes."; black "Book an appointment" (to `/book`) and outline "View services" (scrolls to `#services`). Right: clinic photo (existing `src/assets` image), `rounded-xl`, about 580px wide, wide aspect, `object-cover`.
2. **Services** (`id="services"`): heading "Services"; 3-column grid gap-4 of cards (`rounded-xl border p-3`): image area `h-52 rounded-lg` showing `service.imageUrl`, or a dashed-border `#fafafa` placeholder when none; name (font-medium); muted description; divider; row with price left (`font-semibold text-sm`, formatted like "₱500 – ₱800") and outline sm "Book now" right (to `/book?service=<id>`). Active services only.
3. **About Us** (`id="about"`): heading; subheading "Our specialties" and a responsive grid (5 / 3 / 2 columns) of five cards, each a title (font-medium) and one-line muted description, held in a constant array in the component:
   - General Dentistry: check-ups, cleanings, and fillings
   - Orthodontics: braces and teeth alignment
   - Esthetic Dentistry: whitening and smile improvement
   - Oral Surgery: extractions and minor surgical procedures
   - Prosthodontics: crowns, bridges, and dentures
     Then three equal info cards (label muted `text-xs`, value `font-semibold`): Open days (Monday to Sunday order, comma-separated), Hours (12h format), Break ("No break" when break times are empty). From `settings/clinic`.
4. **Footer** (`id="contact"`): full-width bg `#f9f9f9` `border-t`; four columns: brand + clinic name; Contact (address, phone, email); Clinic hours (days, hours, "Break: ..." muted); Account (Log in, Register). Bottom row: muted "(c) 2026 Clinic Appointment System".
   Nav links scroll to these sections.

## Login (`/login`)

Centered card `max-w-md rounded-xl border p-6` about 100px below the header (no split panel). Title "Log in" (`text-lg font-semibold`), muted "Welcome back. Enter your details to continue.", Email, Password, "Remember me" checkbox, full-width black "Log In", underlined "Forgot password?" link, centered muted "or", full-width outline "Continue with Google", centered "Don't have an account? Sign up".

## Register (`/register`)

Same card. Title "Create account", muted "Create an account to book and manage appointments." Fields: Full name, Email, Phone, Password (hint "At least 8 characters."), Confirm password. Black full-width "Create account", "or", "Continue with Google", "Already have an account? Log in". Validate: password 8+ characters, passwords match, errors under fields. No terms checkbox.

## Booking (`/book`)

No progress bar, no service images. Each step: muted `text-sm` "Step N of 3 · <Service | Date and time | Confirm>" above a `text-2xl font-semibold` title.

1. **Choose a service:** 3-column grid gap-6 of cards (`rounded-xl border p-5`): name, muted description, row with price left and black sm "Select" right. `?service=<id>` preselects and skips to step 2.
2. **Pick a date and time:** outline "Change service" at the top right; muted "Booking: <service>". Two columns. Left: calendar card (~490px, `rounded-xl border p-6`): outline sm "Previous" / "Next" with centered "Month YYYY"; weekday labels Su..Sa; 7-column day cells (~59x38, `rounded-lg border`, `text-sm`); closed weekdays, closed dates and past days shaded `#f0f0f0`, muted, not clickable; selected day black. Footnote: "Closed days: <weekdays from settings.openDays> (shaded)". Right: "Morning" and "Afternoon" labels with 3-column grids of slot buttons (`h-9 outline rounded-lg text-sm`); selected black; taken and past `#f3f3f3` muted line-through disabled. Before a date is chosen: muted "Select a date to see available times." Below: outline "Back" and black "Continue" (disabled until a slot is selected). Logic in `booking-logic.md`.
3. **Confirm:** summary card (`max-w-[640px] rounded-xl border p-6`) with rows Service, Date, Time, Location (clinic name + address), muted label left and value right, dividers between. "Reason for visit" textarea, "Photo (optional)" file input, outline "Back", black "Confirm booking". Block with a message at 2 upcoming confirmed appointments; handle `SLOT_TAKEN`.
4. **Success:** centered; 56px black circle with a white check (lucide `Check`); "Appointment booked"; "<Service> · <Date> · <Time>"; muted "You can review or cancel it from your dashboard."; black "View my appointments" and outline "Book another".

## Dashboard (`/dashboard`)

Muted "Patient dashboard", title "Welcome back", muted "N upcoming appointments · N past visits", segmented tabs "Upcoming (N)" and "Visit history (N)".

- Upcoming: cards (`rounded-xl border px-6 py-4`, flex between, gap-3): service (font-semibold) + muted "Nov 4, 2026 · 10:00 AM"; right: status badge + outline sm "Cancel" or "Request cancellation" per the 24-hour rule; `cancel_requested` shows the strong "Cancel requested" badge and no button. No date box. No reschedule.
- Visit history: cards with service (font-semibold) and an outline "Completed" badge, muted "date · time", the notes/procedure text, muted "Next: <suggestion>", attachment thumbnails if any. Lists visit records plus past appointments (as built).
- Empty states with a "Book an appointment" button.

## Profile (`/profile`)

Centered. 128px circle avatar (image or initials), name (`text-3xl font-semibold`) with a small "Patient" badge, muted email. Card (`max-w-[760px] rounded-xl border`): "Profile settings", muted "Update your personal information."; Avatar file input; Full name + Phone; Birthdate + Email (read-only); Address. Footer band with black "Save". Never touches `role`.

## 404

No header/footer. Centered "404" (`text-4xl font-bold`), muted "Page not found", black "Go home" (to `/`).

## Appointment details dialog (shared component `AppointmentDetailsDialog`)

Opened by an outline sm "Details" button on dashboard cards (Upcoming and Visit history). shadcn Dialog showing: service, date, time, status badge; **Reason** (or muted "No reason given"); **Your photo** if `photoUrl` exists (max-h-80, `rounded-lg`, `object-contain`, click opens the full image in a new tab). For `completed` appointments that have a visit record, also a **Visit record** section: procedure, notes, "Next: <suggestion>", and the attached images (`attachmentUrls`) as clickable thumbnails.
Patient side must NOT query visit records by appointmentId alone (the rules only allow reading your own records). Match from the records already loaded with `where('patientId','==',uid)`, in JS, by `appointmentId`.
