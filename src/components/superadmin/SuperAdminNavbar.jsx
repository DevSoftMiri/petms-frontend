import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { Tooltip } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DarkModeContext } from "../../context/darkModeContext";
import AuthService from "../../services/AuthService";
import "./superAdminNavbar.css";

// Avatar image URL
const AVATAR_URL =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face";

const SuperAdminNavbar = () => {
  const { dispatch, state: darkState } = useContext(DarkModeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const user = AuthService.getCurrentUser();
  const username = user?.username || "Guest";
  const userRole = user?.role || "Super Admin";

  // Generate initials as fallback
  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Scroll listener — triggers warm bg + blur after 10px scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = window.location.origin + "/login";
  };

  const handleNavClick = (view) => {
    navigate(`/superadmin/dashboard?view=${view}`, { replace: true });
  };

  const isActive = (view) => {
    const params = new URLSearchParams(location.search);
    return params.get("view") === view;
  };

  return (
    <div className={`sa-navbar-wrapper${scrolled ? " sa-navbar-wrapper--scrolled" : ""}`}>
      <nav className="sa-navbar">

        {/* ── LEFT: Brand ── */}
        <div className="sa-brand">
          <div className="sa-brand-icon">
            <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 22 }} />
          </div>
          <div className="sa-brand-text">
            <span className="sa-brand-name">VetAdmin</span>
            <span className="sa-brand-tag">Super Admin</span>
          </div>
        </div>

        {/* ── CENTER: Nav Menu ── */}
        <div className="sa-nav-center">
          <button
            className={`sa-nav-link ${isActive("clinics") ? "sa-nav-link--active" : ""}`}
            onClick={() => handleNavClick("clinics")}
          >
            Centers
          </button>
          <button
            className={`sa-nav-link ${isActive("users") ? "sa-nav-link--active" : ""}`}
            onClick={() => handleNavClick("users")}
          >
            Users
          </button>
        </div>

        {/* ── RIGHT: Actions + Avatar + Logout ── */}
        <div className="sa-nav-right">

          {/* Search */}
          <div className="sa-search">
            <SearchOutlinedIcon className="sa-search-icon" sx={{ fontSize: 18 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Dark mode toggle */}
          <Tooltip title={darkState?.darkMode ? "Light Mode" : "Dark Mode"} placement="bottom">
            <button
              className="sa-icon-btn"
              onClick={() => dispatch({ type: "TOGGLE" })}
              aria-label="Toggle dark mode"
            >
              {darkState?.darkMode
                ? <LightModeOutlinedIcon sx={{ fontSize: 19 }} />
                : <DarkModeOutlinedIcon sx={{ fontSize: 19 }} />}
            </button>
          </Tooltip>

          {/* Divider */}
          <div className="sa-divider" />

          {/* Avatar with hover card */}
          <div
            className="sa-avatar-wrap"
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
          >
            {/* Avatar button — shows image */}
            <button className="sa-avatar" aria-label="User profile">
              <img
                src={AVATAR_URL}
                alt={username}
                className="sa-avatar-img"
                onError={(e) => {
                  // Fallback to initials if image fails
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.classList.add("sa-avatar--initials");
                  e.currentTarget.parentElement.setAttribute("data-initials", initials);
                }}
              />
            </button>

            {/* Hover popup card — name & role only, NO sign-out */}
            <div className={`sa-profile-card ${avatarHovered ? "sa-profile-card--visible" : ""}`}>
              <div className="sa-profile-card-header">
                <img
                  src={AVATAR_URL}
                  alt={username}
                  className="sa-profile-card-img"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="sa-profile-card-info">
                  <span className="sa-profile-card-name">{username}</span>
                  <span className="sa-profile-card-role">{userRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <Tooltip title="Logout" placement="bottom">
            <button
              className="sa-icon-btn sa-logout-btn"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogoutIcon sx={{ fontSize: 19 }} />
            </button>
          </Tooltip>

        </div>
      </nav>
    </div>
  );
};

export default SuperAdminNavbar;