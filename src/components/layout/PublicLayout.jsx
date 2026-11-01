import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function PublicLayout() {
	const { user, profile, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(false);
	}, [location.pathname, location.hash]);

	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") setOpen(false);
		};
		const onResize = () => {
			if (window.innerWidth >= 768) setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("resize", onResize);
		};
	}, []);

	const navLinks = [
		{ label: "Home", to: "/" },
		{ label: "Services", to: "/#services" },
		{ label: "About Us", to: "/#about" },
		{ label: "Contact", to: "/#contact" },
	];

	const go = (path) => {
		setOpen(false);
		navigate(path);
	};

	return (
		<div className="min-h-screen bg-white">
			<div className="sticky top-0 z-50 bg-white">
				<header className="h-16 border-b border-[#e5e5e5] px-8 flex items-center">
					<Link to="/" className="text-sm font-semibold" onClick={() => setOpen(false)}>
						Clinic Appointment System
					</Link>
					<nav className="hidden md:flex ml-8 gap-1">
						{navLinks.map((l) => (
							<Link
								key={l.label}
								to={l.to}
								onClick={(e) => {
									if (l.label === "Home") {
										if (location.pathname === "/") {
											e.preventDefault();
											window.scrollTo({ top: 0, behavior: "smooth" });
										}
									}
									setOpen(false);
								}}
								className="text-sm text-[#6b6b6b] px-3 py-1.5 rounded-md hover:bg-[#f0f0f0] hover:text-[#0a0a0a]"
							>
								{l.label}
							</Link>
						))}
					</nav>
					<div className="hidden md:flex ml-auto gap-3">
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
					<Button
						variant="outline"
						size="sm"
						className="md:hidden ml-auto"
						aria-label="Toggle menu"
						aria-expanded={open}
						onClick={() => setOpen((v) => !v)}
					>
						{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
					</Button>
				</header>
				{open && (
					<div className="md:hidden border-b border-[#e5e5e5] bg-white px-8 py-4 space-y-2">
						<nav className="flex flex-col gap-1">
							{navLinks.map((l) => (
								<Link
									key={l.label}
									to={l.to}
									onClick={(e) => {
										if (l.label === "Home" && location.pathname === "/") {
											e.preventDefault();
											window.scrollTo({ top: 0, behavior: "smooth" });
										}
										setOpen(false);
									}}
									className="text-sm text-[#6b6b6b] px-3 py-2 rounded-md hover:bg-[#f0f0f0] hover:text-[#0a0a0a]"
								>
									{l.label}
								</Link>
							))}
						</nav>
						<div className="flex flex-col gap-2 pt-2">
							{user ? (
								<>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => go(profile?.role === "admin" ? "/admin/appointments" : "/dashboard")}
									>
										Dashboard
									</Button>
									<Button
										className="w-full"
										onClick={() => {
											setOpen(false);
											logout();
										}}
									>
										Log out
									</Button>
								</>
							) : (
								<>
									<Button variant="outline" className="w-full" onClick={() => go("/login")}>
										Log in
									</Button>
									<Button className="w-full" onClick={() => go("/register")}>
										Register
									</Button>
								</>
							)}
						</div>
					</div>
				)}
			</div>
			<main className="w-full py-8">
				<Outlet />
			</main>
			<footer className="border-t border-[#e5e5e5] py-8 text-center text-sm text-[#6b6b6b]">
				Clinic Appointment System
			</footer>
		</div>
	);
}