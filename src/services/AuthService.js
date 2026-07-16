import axios from "./axios";

/**
 * Authentication Service
 * Handles login, signup, logout, and token management
 * Connects to PostgreSQL + Prisma backend
 */

/**
 * Authentication Service
 * Handles login, signup, logout, and token management
 * Connects to PostgreSQL + Prisma backend
 */

const login = (body) => {
  // Backend accepts either username or email
  const loginData = {
    username: body.email || body.username,
    password: body.password,
  };

  const url = "/auth/login";
  return axios.post(url, loginData).then((response) => {
    // New API response format includes: { success, message, data: { user, accessToken, refreshToken } }
    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken } = response.data.data;

      // Store user with backend role format (SUPERADMIN, ADMIN, etc.)
      const userWithTokens = {
        ...user,
        accessToken,
        refreshToken,
      };

      localStorage.setItem("user", JSON.stringify(userWithTokens));
      return response.data;
    }
    throw new Error(response.data.message || "Login failed");
  });
};

const signup = (body) => {
  const url = "/auth/signup";
  return axios.post(url, body).then((response) => {
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Signup failed");
  });
};

const logout = (userId) => {
  // Optional: Notify backend of logout
  if (userId) {
    axios.post("/auth/logout", { userId }).catch(() => {
      // Continue logout even if request fails
    });
  }
  localStorage.removeItem("user");
  localStorage.removeItem("selectedClinicId");
  localStorage.removeItem("selectedClinic");
};

const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }
  return null;
};

const setCurrentUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

const mergeCurrentUser = (partialUser) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const nextUser = {
    ...currentUser,
    ...partialUser,
  };

  localStorage.setItem("user", JSON.stringify(nextUser));
  return nextUser;
};

const changePassword = (oldPassword, newPassword) => {
  const url = "/auth/change-password";
  return axios.put(url, { oldPassword, newPassword }).then((response) => {
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || "Password change failed");
  });
};

const getProfile = () => {
  const url = "/auth/me";
  return axios.get(url).then((response) => {
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch profile");
  });
};

const AuthService = {
  login,
  signup,
  logout,
  getCurrentUser,
  setCurrentUser,
  mergeCurrentUser,
  changePassword,
  getProfile,
};

export default AuthService;
