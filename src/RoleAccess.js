import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthService from "./services/AuthService";

const RoleAccess = ({ roles = [] }) => {
  const userObj = AuthService.getCurrentUser();

  // Handle various user object structures
  let userRole = null;

  // Try different ways to extract the role
  if (userObj?.user?.role) {
    userRole = userObj.user.role;
  } else if (userObj?.role) {
    userRole = userObj.role;
  }

  console.log("🔐 RoleAccess Debug Info:");
  console.log("  - Full User Object:", userObj);
  console.log("  - Extracted User Role:", userRole);
  console.log("  - Role Type:", typeof userRole);
  console.log("  - Allowed Roles:", roles);
  console.log("  - Allowed Roles Count:", roles.length);

  if (userRole && roles.length > 0) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    console.log("  - Checking if '" + userRole + "' is in [" + rolesArray.join(", ") + "]");
    console.log("  - Include check result:", rolesArray.includes(userRole));
    console.log("  - Role match found:", rolesArray.some(r => r === userRole));
  }

  // If no roles specified, allow access
  // Otherwise, check if user's role is in the allowed roles
  const hasAccess = !roles.length || (userRole && roles.includes(userRole));

  console.log("  - Final Decision - Has Access:", hasAccess);
  console.log("🔐");

  return hasAccess ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
};

export default RoleAccess;
