import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import Appointments from "@/pages/admin/Appointments.jsx";
import Services from "@/pages/admin/Services.jsx";
import Settings from "@/pages/admin/Settings.jsx";
import Patients from "@/pages/admin/Patients.jsx";
import PatientDetail from "@/pages/admin/PatientDetail.jsx";
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
	if (loading) return null;
	if (user) {
		return (
			<Navigate
				to={profile?.role === "admin" ? "/admin/appointments" : "/dashboard"}
				replace
			/>
		);
	}
	return children;
}

export default function App() {
	return (
		<>
			<PageTitle />
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
		</>
	);
}
