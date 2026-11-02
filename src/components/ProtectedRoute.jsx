import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedRoute({ children, role }) {
  const { user, loading, role: userRole } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin/appointments" : "/dashboard"} replace />;
  }
  return children;
}