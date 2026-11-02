import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import PublicLayout from "@/components/layout/PublicLayout.jsx";
import PatientLayout from "@/components/layout/PatientLayout.jsx";
import AdminLayout from "@/components/layout/AdminLayout.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import Landing from "@/pages/guest/Landing.jsx";
import Login from "@/pages/guest/Login.jsx";
import Register from "@/pages/guest/Register.jsx";
import Dashboard from "@/pages/patient/Dashboard.jsx";
import Book from "@/pages/patient/Book.jsx";
import Profile from "@/pages/patient/Profile.jsx";
const Appointments = lazy(() => import("@/pages/admin/Appointments.jsx"));
const Services = lazy(() => import("@/pages/admin/Services.jsx"));
const Settings = lazy(() => import("@/pages/admin/Settings.jsx"));
const Patients = lazy(() => import("@/pages/admin/Patients.jsx"));
const PatientDetail = lazy(() => import("@/pages/admin/PatientDetail.jsx"));
import NotFound from "@/pages/NotFound.jsx";

const titles = {
  "/": "Landing",
  "/login": "Login",
  "/register": "Create Account",
  "/book": "Book",
  "/dashboard": "Dashboard",
  "/profile": "Profile",
  "/admin/appointments": "Appointments",
  "/admin/patients": "Patients",
  "/admin/services": "Services",
  "/admin/settings": "Settings",
};

function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    document.title = titles[location.pathname] || "Clinic Appointment System";
  }, [location.pathname]);
  return null;
}

function GuestOnly({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading)
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-[#f0f0f0]" />
      </div>
    );
  if (user) {
    return <Navigate to={profile?.role === "admin" ? "/admin/appointments" : "/dashboard"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <PageTitle />
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnly>
                  <Register />
                </GuestOnly>
              }
            />
          </Route>
          <Route
            element={
              <ProtectedRoute role="patient">
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/book" element={<Book />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/appointments" element={<Appointments />} />
            <Route path="/admin/services" element={<Services />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/patients" element={<Patients />} />
            <Route path="/admin/patients/:uid" element={<PatientDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
