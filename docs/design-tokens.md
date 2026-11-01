# Design tokens (matches the current Figma)

Flat, monochrome, shadcn-style. White surfaces, thin borders, black primary. This replaces the earlier grey-background look.

## Colors (define as CSS variables in `src/index.css`)
- Page background `#ffffff`, text `#0a0a0a`, muted text `#6b6b6b`
- Borders `#e5e5e5`; hover / active surface `#f0f0f0`; muted surface `#f5f5f5`; table header and card footer bands `#f9f9f9` / `#fafafa`
- Sidebar background `#fafafa`
- Primary: `#0a0a0a` with white text
- Disabled / taken / closed: bg `#f0f0f0` (slots `#f3f3f3`), muted text, strikethrough for slots
- No shadows on cards. Radius base 8px: inputs and buttons `rounded-lg`, cards `rounded-xl`.

## Typography
Geist (already installed). Page titles `text-2xl font-semibold`; landing hero `text-5xl font-semibold tracking-tight`. Body `text-sm`. Small labels `text-xs` muted.

## Components
- **Button:** default `h-9 text-sm rounded-lg`; `sm` = `h-8 text-xs`; `outline` = white with border.
- **Input / Select / Textarea:** `h-9` (textarea taller), `rounded-lg`, border, `text-sm`. Checkbox: black square when checked.
- **Badge** (small pill): default = `#f0f0f0` bg (Confirmed); outline = border `#d4d4d4`, transparent (Completed); strong = black border and text (Cancel requested); grey (Cancelled); outline muted (No-show).
- **Tabs:** segmented control. List: inline-flex, bg `#f3f3f3`, `rounded-lg`, `p-1`. Trigger: `text-sm px-3 py-1 rounded-md`, muted. Active: white bg, dark text, subtle shadow.
- **Table:** wrapper `rounded-xl border overflow-hidden`; header row `#f9f9f9` muted `text-sm`; rows with bottom border; cells `px-3 py-2.5 text-sm`.
- **Cards with a footer band:** body `p-6`; footer `bg #fafafa border-t px-6 py-4` holding a right-aligned black button.
- **Dialogs:** same card style.

## App shell (Admin and Patient)
- No top bar on desktop. Fixed sidebar 260px, `h-screen`, bg `#fafafa`, `border-r`.
- Sidebar top: "Clinic Appointment System" (`text-sm font-semibold`, `px-7 pt-8`). Patient only: full-width black "Book Appointment" button (to `/book`) under it.
- Nav items inside a `px-4` container: `h-9 px-3 rounded-lg text-sm`, muted; active = bg `#ececec`, dark text, `font-medium`.
  - Admin: Appointments, Patients, Services, Settings.
  - Patient: Appointments (dashboard), Profile settings.
- Sidebar bottom (`border-t p-4`): 32px circle avatar (Cloudinary image or initials), name (`text-sm font-medium`) and email (`text-xs` muted) beside it, then a full-width outline "Log out".
- Main: the full-width element scrolls (`flex-1 overflow-y-auto`, so the scrollbar sits at the window edge). Inside it a **left-aligned** wrapper `max-w-[1080px] px-10 py-8` (no `mx-auto`). Exceptions: Profile content is centered.
- Mobile: keep the existing collapsed navigation.

## Public shell (guest pages)
- Header `h-16 border-b px-8`. Left: brand "Clinic Appointment System" (`text-sm font-semibold`) + links Home, Services, About Us, Contact (`text-sm` muted, `px-3 py-1.5 rounded-md`; current page `bg #f0f0f0` dark text). Right: outline "Log in" + black "Register" (signed in: "Dashboard" button).
- Footer on non-landing public pages: `border-t`, centered muted `text-sm` "Clinic Appointment System", `py-8`. The landing page has its own full footer.
- Mobile header (below md): brand on the left, outline sm menu button (lucide Menu/X) on the right; nav links and account buttons collapse into a stacked panel that overlays the page content beneath the sticky header. The header stays sticky (top-0) so the menu can be opened from anywhere on the page; `html` uses `scroll-padding-top` matching the header height for in-page anchor scrolling. Panel closes on link/button click, route change, Escape, or viewport >= md.
