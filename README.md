# Dental Clinic Appointment System

A web app for a single-dentist clinic. Patients can register, book 30-minute appointments, view their dashboard and visit history, and manage their profile. The dentist (admin) manages appointments, patients, services, and clinic settings.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in Firebase and Cloudinary values.
3. Run:
   ```bash
   npm run dev
   ```

## Environment variables

See `.env.example` for the full list: `VITE_FIREBASE_*` and `VITE_CLOUDINARY_*`.

## Making an admin account

1. Register a normal account in the app.
2. In the Firebase console, open Firestore and find `users/{uid}`.
3. Set `role` to `"admin"`.
4. Sign in again; the user lands on `/admin/appointments`.