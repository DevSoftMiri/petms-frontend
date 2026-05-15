import AuthService from "./AuthService";

export default function AuthHeader() {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken || user?.token;

  return token
    ? { Accept: "application/json", Authorization: `Bearer ${token}` }
    : {};
}
