import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading, role: userRole } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin/appointments" : "/dashboard"} replace />;
  }
  return children;
}