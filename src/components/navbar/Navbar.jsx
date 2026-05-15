import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import { Tooltip } from "@mui/material";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DarkModeContext } from "../../context/darkModeContext";
import AuthService from "../../services/AuthService";
import "./navbar.css";

const Navbar = () => {
  const { dispatch } = useContext(DarkModeContext);
  const navigate = useNavigate();

  const user = AuthService.getCurrentUser();
  const username = user?.username || "Guest";
  const userRole = user?.role;

  // Different nav items based on role
  const navMenuItems = userRole === "ROLE_SUPERADMIN"
    ? [
      { label: "Clinic", path: "/superadmin/dashboard" },
      { label: "User", path: "/superadmin/users" },
    ]
    : [
      { label: "General Information", path: "/general-info" },
      { label: "History", path: "/history" },
      { label: "Medical Record", path: "/medical-record" },
      { label: "Appointment", path: "/appointment" },
    ];

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  return (
    <div className="navbar-wrapper">
      <div className="navbar">
        <div className="wrapper">
          <div className="search">
            <input type="text" placeholder="Search..." />
            <SearchOutlinedIcon />
          </div>

          {/* Navigation Menu */}
          <nav className="navbar-menu">
            {navMenuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="navbar-menu-item"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="items">
            <div className="item">
              <DarkModeOutlinedIcon
                className="icon"
                onClick={() => dispatch({ type: "TOGGLE" })}
              />
            </div>
            <div className="item">
              {user ? (
                <>
                  <Tooltip title={`Logged in as: ${username} (${userRole})`} placement="right">
                    <div className="logo" style={{ cursor: 'pointer', padding: '5px' }}>
                      <img
                        src="/profile.png"
                        alt="Profile"
                        style={{ height: '40px', width: 'auto' }}
                      />
                    </div>
                  </Tooltip>
                  <button
                    className="auth-btn logout-btn"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogoutIcon sx={{ fontSize: 18 }} />
                  </button>
                </>
              ) : (
                <button
                  className="auth-btn login-btn"
                  onClick={() => navigate("/login")}
                  title="Login"
                >
                  <LoginIcon sx={{ fontSize: 18 }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
