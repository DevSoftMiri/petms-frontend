/**
 * Protected Route Component
 * 
 * Protects routes based on:
 * - Authentication status
 * - User role
 * - Clinic access
 * 
 * Usage:
 * <Route 
 *   element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} />}
 * >
 *   <Route path="/admin" element={<AdminDashboard />} />
 * </Route>
 */

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Unauthorized from "../pages/Unauthorized";

const ProtectedRoute = ({
    roles = [],
    clinicId = null,
    requireAuth = true
}) => {
    const { isAuthenticated, role, clinicId: userClinicId, isLoading } = useAuth();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Check if user is authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If no roles specified, only check authentication
    if (!roles || roles.length === 0) {
        return <Outlet />;
    }

    // Check if user's role is allowed
    const hasRole = roles.includes(role);
    if (!hasRole) {
        return <Unauthorized />;
    }

    // Check clinic access if specified
    if (clinicId && userClinicId?.toString() !== clinicId.toString()) {
        return <Unauthorized />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
