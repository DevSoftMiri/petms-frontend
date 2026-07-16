import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthService from "./services/AuthService";
import { canAccessPage } from "./utils/pageAccess";

const PageAccessRoute = ({ pageKey }) => {
  const user = AuthService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return canAccessPage(user, pageKey) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default PageAccessRoute;
