import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function PublicLayout() {
	const { user, profile, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const isLanding = location.pathname === "/";
	return (
		<div className="min-h-screen bg-white">
			<header className="h-16 border-b border-[#e5e5e5] px-8 flex items-center">
				<Link to="/" className="text-sm font-semibold">
					Clinic Appointment System
				</Link>
				<nav className="ml-8 flex gap-1">
					{[
						{ label: "Home", to: "/" },
						{ label: "Services", to: "/#services" },
						{ label: "About Us", to: "/#about" },
						{ label: "Contact", to: "/#contact" },
					].map((l) => (
						<Link
							key={l.label}
							to={l.to}
							className="text-sm text-[#6b6b6b] px-3 py-1.5 rounded-md hover:bg-[#f0f0f0] hover:text-[#0a0a0a]"
						>
							{l.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex gap-3">
					{user ? (
						<>
							<Button variant="outline" onClick={() => navigate(profile?.role === "admin" ? "/admin/appointments" : "/dashboard")}>
								Dashboard
							</Button>
							<Button onClick={() => logout()}>Log out</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={() => navigate("/login")}>
								Log in
							</Button>
							<Button onClick={() => navigate("/register")}>Register</Button>
						</>
					)}
				</div>
			</header>
			{isLanding ? (
				<main><Outlet /></main>
			) : (
				<main className="max-w-[1080px] px-10 py-8">
					<Outlet />
				</main>
			)}
			{!isLanding && (
				<footer className="border-t border-[#e5e5e5] py-8 text-center text-sm text-[#6b6b6b]">
					Clinic Appointment System
				</footer>
			)}
		</div>
	);
}