import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function PatientLayout() {
	const { profile, logout, user } = useAuth();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const items = [
		{ label: "Appointments", to: "/dashboard" },
		{ label: "Profile settings", to: "/profile" },
	];
	const linkClass = ({ isActive }) =>
		`flex items-center h-9 px-3 rounded-lg text-sm transition-colors ${
			isActive
				? "bg-[#ececec] text-[#0a0a0a] font-medium"
				: "text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#0a0a0a]"
		}`;
	return (
		<div className="h-screen flex flex-col md:flex-row overflow-hidden">
			<div className="md:hidden p-4 bg-white border-b border-[#e5e5e5] flex items-center justify-between">
				<button onClick={() => setOpen(!open)}>
					<Menu />
				</button>
				<Button size="sm" onClick={() => { setOpen(false); navigate("/book"); }}>
					Book Appointment
				</Button>
			</div>
			<aside
				className={`${open ? "flex" : "hidden"} md:flex w-full md:w-[260px] bg-[#fafafa] border-b md:border-r border-[#e5e5e5] flex-col h-screen overflow-hidden`}
			>
				<div className="px-7 pt-8">
					<div className="text-sm font-semibold">Clinic Appointment System</div>
					<Button className="w-full mt-4" onClick={() => { setOpen(false); navigate("/book"); }}>
						Book Appointment
					</Button>
				</div>
				<nav className="px-4 mt-6 space-y-1 flex-1">
					{items.map((it) => (
						<NavLink key={it.to} to={it.to} className={linkClass} onClick={() => setOpen(false)}>
							{it.label}
						</NavLink>
					))}
				</nav>
				<div className="border-t border-[#e5e5e5] p-4">
					<div className="flex items-center gap-3 mb-3">
						{profile?.avatarUrl ? (
							<img
								src={profile.avatarUrl}
								alt=""
								className="w-8 h-8 rounded-full object-cover"
							/>
						) : (
							<div className="w-8 h-8 rounded-full bg-[#e5e5e5] flex items-center justify-center text-xs font-medium">
								{(profile?.fullName || user?.email || "?").charAt(0).toUpperCase()}
							</div>
						)}
						<div className="min-w-0">
							<div className="text-sm font-medium truncate">
								{profile?.fullName || user?.email}
							</div>
							<div className="text-xs text-[#6b6b6b] truncate">
								{profile?.email || user?.email}
							</div>
						</div>
					</div>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => {
							logout();
							navigate("/");
						}}
					>
						Log out
					</Button>
				</div>
			</aside>
			<main className="flex-1 overflow-y-auto">
				<div className="max-w-[1080px] px-10 py-8">
					<Outlet />
				</div>
			</main>
		</div>
	);
}