import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function PublicLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <header className="min-h-[74px] bg-[#f8f9fb] border-b border-[#e5e5e5] flex items-center px-4 md:px-8 flex-wrap gap-2 py-2">
        <Link to="/" className="font-semibold">Clinic Appointment System</Link>
        <nav className="ml-0 md:ml-8 flex gap-4 text-sm flex-wrap">
          <Link to="/">Home</Link>
          <Link to="/#services">Services</Link>
          <Link to="/#about">About Us</Link>
          <Link to="/#contact">Contact</Link>
        </nav>
        <div className="ml-auto flex gap-3">
          {user ? (
            <>
              <Button variant="outline" onClick={() => navigate(profile?.role === "admin" ? "/admin/appointments" : "/dashboard")}>Dashboard</Button>
              <Button onClick={() => logout()}>Log out</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/login")}>Log in</Button>
              <Button onClick={() => navigate("/register")}>Register</Button>
            </>
          )}
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto p-8">
        <Outlet />
      </main>
      <footer className="border-t border-[#e5e5e5] p-8 text-sm text-[#737373] text-center">
        Clinic Appointment System
      </footer>
    </div>
  );
}