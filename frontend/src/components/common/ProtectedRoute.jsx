import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAccessibleRoutes } from "../../utils/helpers";

/**
 * ProtectedRoute — FireSentrix RBAC
 *
 * Guards both authentication AND role-based page access.
 * - Unauthenticated users → redirect to /login
 * - Authenticated users accessing a restricted page → redirect to /dashboard
 *
 * Route IDs must match the keys used in getAccessibleRoutes().
 * If no allowedRoles / routeId is specified, any authenticated user can access.
 */
const ProtectedRoute = ({ children, routeId }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based page access check
  if (routeId && user?.role) {
    const accessible = getAccessibleRoutes(user.role);
    if (!accessible.includes(routeId)) {
      // Redirect to dashboard with a state flag so UI can show "Access Denied"
      return <Navigate to="/dashboard" replace state={{ accessDenied: true, from: location.pathname }} />;
    }
  }

  return children;
};

export default ProtectedRoute;
