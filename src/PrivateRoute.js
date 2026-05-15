import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AuthService from "./services/AuthService";

const PrivateRoute = () => {
  const user = AuthService.getCurrentUser();

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;