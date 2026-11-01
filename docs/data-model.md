# Data model (Firestore)

Security rules are in `firestore.rules`. Code must conform to them.

## users/{uid}
Document ID = Firebase Auth uid. Created on first registration or first Google sign-in.
| field | type | notes |
|---|---|---|
| email | string | |
| role | `"patient"` \| `"admin"` | self-registration is always `"patient"`; users can't change it |
| fullName | string | |
| phone | string | |
| birthdate | string `YYYY-MM-DD` | optional |
| address | string | optional |
| avatarUrl | string | Cloudinary URL, optional |
| createdAt | Timestamp | |

## services/{serviceId}
| field | type |
|---|---|
| name | string |
| description | string |
| imageUrl | string (Cloudinary, optional) |
| priceRange | string, e.g. `"500-800"` (display only) |
| isActive | boolean (hidden from booking when false; never delete) |

## appointments/{appointmentId}
Auto-generated ID.
| field | type | notes |
|---|---|---|
| patientId | string | = patient's uid |
| serviceId, serviceName | string | name copied in for easy listing |
| date | string `YYYY-MM-DD` | |
| time | string `HH:mm` | |
| startAt | Timestamp | date + time, local time zone |
| status | see below | |
| reason | string | optional |
| photoUrl | string | optional Cloudinary URL |
| createdAt | Timestamp | `serverTimestamp()` |

Exactly these fields on create, no extras (the rules use `hasOnly`).

### Statuses
`confirmed`, `cancel_requested`, `cancelled`, `completed`, `no_show`
- New bookings start as `confirmed`.
- `confirmed` -> `cancelled` (patient, only if more than 24h before `startAt`; slot deleted in the same batch)
- `confirmed` -> `cancel_requested` (patient, any time before start; used inside the 24h window)
- `cancel_requested` -> `cancelled` (admin approves; slot deleted) or back to `confirmed` (admin rejects)
- `confirmed` -> `completed` or `no_show` (admin, after the visit)
- Slot is held while status is `confirmed` or `cancel_requested`. It is deleted when status becomes `cancelled`.

## slots/{date_time}
ID format: `2026-11-04_0930` = `date + "_" + time without colon`.
| field | type |
|---|---|
| appointmentId | string |
| patientId | string |
| date | string |
| time | string |
Never updated. Exists only while the time is taken. This is the double-booking guard.

## visitRecords/{recordId}
Written by admin only; patients read their own.
| field | type |
|---|---|
| appointmentId | string |
| patientId | string |
| date | string |
| procedure | string |
| notes | string |
| nextVisitSuggestion | string (optional, free text like "6-month cleaning") |
| attachmentUrls | string[] (Cloudinary, X-rays and photos) |
| createdAt | Timestamp |

## settings/clinic (single document)
| field | type | example |
|---|---|---|
| clinicName | string | "Your Dental Clinic" |
| address, phone, email | string | |
| openDays | number[] (0=Sun..6=Sat) | `[0, 3, 6]` |
| openTime, closeTime | string `HH:mm` | `"09:00"`, `"17:00"` |
| breakStart, breakEnd | string `HH:mm` (optional) | `"12:00"`, `"13:00"` |
| slotMinutes | number | `30` |
| closedDates | string[] `YYYY-MM-DD` | holidays, dentist away |
