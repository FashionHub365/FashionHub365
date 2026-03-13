import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { hasAnyRole } from "../utils/roleUtils";

/**
 * RoleRoute component protects routes based on user roles.
 * It checks if the user is logged in, and if their role matches any of the allowedRoles.
 * 
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access the route (e.g., ['admin', 'seller'])
 */
const RoleRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full animate-spin border-y-2 border-black" />
                    <p className="mt-4 text-sm text-gray-500">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Not logged in -> Redirect to login
        return <Navigate to="/login" replace />;
    }

    if (!hasAnyRole(user, allowedRoles)) {
        // Logged in but insufficient permissions -> Redirect to Forbidden
        return <Navigate to="/forbidden" replace />;
    }

    // User is logged in and has correct role
    return <Outlet />;
};

export default RoleRoute;
