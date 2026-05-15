/**
 * Auth Context
 * Manages authentication state globally across the application
 * 
 * Provides:
 * - token: JWT access token
 * - user: User object with role, clinicId, email, username
 * - role: User role for easy access (SUPERADMIN, ADMIN, VET, etc.)
 * - clinicId: User's clinic ID
 * - isAuthenticated: Boolean indicating auth status
 * - login(username, password): Login function
 * - logout(): Logout function
 * - isLoading: Loading state during auth operations
 * 
 * Compatible with PostgreSQL + Prisma backend
 */

import React, { createContext, useState, useCallback, useEffect } from "react";
import AuthService from "../services/AuthService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedUser = AuthService.getCurrentUser();
        if (storedUser?.accessToken) {
            setToken(storedUser.accessToken);
            // Extract essential user data
            setUser({
                id: storedUser.id,
                username: storedUser.username,
                email: storedUser.email,
                firstName: storedUser.firstName,
                lastName: storedUser.lastName,
                role: storedUser.role,
                clinicId: storedUser.clinicId,
            });
        }
    }, []);

    // Login function
    const login = useCallback(
        async (usernameOrEmail, password) => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await AuthService.login({
                    username: usernameOrEmail,
                    email: usernameOrEmail,
                    password,
                });

                if (response?.success && response?.data) {
                    const { user: userData, accessToken } = response.data;

                    setToken(accessToken);
                    setUser({
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        role: userData.role,
                        clinicId: userData.clinicId,
                    });

                    return response;
                } else {
                    throw new Error(response?.message || "Invalid response from server");
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || "Login failed";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Logout function
    const logout = useCallback(() => {
        AuthService.logout(user?.id);
        setToken(null);
        setUser(null);
        setError(null);
    }, [user?.id]);

    // Check if user is authenticated
    const isAuthenticated = !!token && !!user;

    // Extract role and clinicId for easy access
    const role = user?.role || null;
    const clinicId = user?.clinicId || null;

    const value = {
        token,
        user,
        role,
        clinicId,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        setUser,
        setToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
