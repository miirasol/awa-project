import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AdminLayout() {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = [
    { label: "Appointments", to: "/admin/appointments" },
    { label: "Patients", to: "/admin/patients" },
    { label: "Services", to: "/admin/services" },
    { label: "Settings", to: "/admin/settings" },
  ];
  return (
    <div className="h-screen bg-[#f2f2f2] flex flex-col md:flex-row overflow-hidden">
      <div className="md:hidden p-4 bg-white border-b border-[#e5e5e5]">
        <button onClick={() => setOpen(!open)}><Menu /></button>
      </div>
      <aside className={`${open ? "flex" : "hidden"} md:flex w-full md:w-[260px] bg-white border-b md:border-r border-[#e5e5e5] p-4 flex-col overflow-hidden`}>
        <div className="flex items-center gap-3 mb-6">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#e5e5e5]" />
          )}
          <div>
            <div className="font-medium text-sm">{profile?.fullName || user?.email}</div>
            <div className="text-xs text-[#737373]">{profile?.email || user?.email}</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="block px-3 py-2 rounded-lg text-sm hover:bg-[#f2f2f2]">
              {it.label}
            </Link>
          ))}
        </nav>
        <Button variant="outline" className="mt-4" onClick={() => { logout(); navigate("/"); }}>Log out</Button>
      </aside>
      <main className="flex-1 p-8 max-w-[1100px] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}