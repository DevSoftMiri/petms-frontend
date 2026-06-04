import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { superAdminMenuItems, regularMenuItems, getClinicMenuItems } from "../../utils/menuConfig";
import AuthService from "../../services/AuthService";

import "./sidebar.css";

// Correct image paths
const DOG_IMAGES = [
  `${process.env.PUBLIC_URL}/dogpicture/pictures/Boo%20the%20'Cutest%20dog%20ever'_.jpg`,
  `${process.env.PUBLIC_URL}/dogpicture/pictures/I%20want%20that%20bone!%20_(.jpg`,
  `${process.env.PUBLIC_URL}/dogpicture/pictures/Look%20at%20this%20adorable%20dog%20with%20a%20pretty%20hat!.jpg`,
  `${process.env.PUBLIC_URL}/dogpicture/pictures/Pretty%20looking%20pooch%20lying%20down%20and%20%20thinking%20of….jpg`,
];

const Sidebar = ({ activeClinicTab = null, onTabChange = null }) => {
  const location = useLocation();
  const params = useParams();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Current user
  const user = AuthService.getCurrentUser();
  const userRole = user?.role;

  // Detect if we're on a clinic page
  // Check both URL pattern AND if clinicId is provided via props or localStorage
  const storedClinicId = localStorage.getItem('selectedClinicId');
  const isClinicPageFromUrl = location.pathname.includes("/superadmin/clinic/") && location.pathname.includes("/pages");
  const isClinicPageFromContext = (activeClinicTab !== null && onTabChange !== null) || !!storedClinicId;
  const isClinicPage = isClinicPageFromUrl || isClinicPageFromContext;
  const clinicId = params.id || storedClinicId;

  // Get appropriate menu items
  let menuItems = [];
  if (isClinicPage && clinicId) {
    menuItems = getClinicMenuItems(clinicId, userRole);
  } else if (userRole === "ROLE_SUPERADMIN" || userRole === "SUPERADMIN") {
    menuItems = superAdminMenuItems;
  } else {
    menuItems = regularMenuItems;
  }

  // Toggle dropdown
  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Determine if menu item is active
  const isActiveItem = (item) => {
    if (isClinicPage) {
      // For clinic pages, check if the tab value matches
      if (activeClinicTab !== null) {
        return item.value === activeClinicTab;
      }
      return activeClinicTab ? item.value === activeClinicTab : false;
    } else {
      // For regular pages, check if the path matches (with query param support)
      if (item.path && item.path.includes("?")) {
        const [basePath, queryString] = item.path.split("?");
        const isPathMatch = location.pathname === basePath;
        if (!isPathMatch) return false;

        const params = new URLSearchParams(queryString);
        const currentParams = new URLSearchParams(location.search);

        for (let [key, value] of params) {
          if (currentParams.get(key) !== value) return false;
        }
        return true;
      }

      return location.pathname === item.path;
    }
  };

  // Check if dropdown item is active
  const isDropdownItemActive = (child) => {
    return location.pathname === child.path;
  };

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentImageIndex(
          (prev) => (prev + 1) % DOG_IMAGES.length
        );
        setFade(true);
      }, 600);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle window resize to auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse when going to mobile (< 1024px)
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        // Auto-expand when going back to desktop (>= 1024px)
        setIsCollapsed(false);
      }
    };

    // Run on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (item) => {
    if (isClinicPage && onTabChange) {
      onTabChange(item.value);
    }
    // Close sidebar on mobile after clicking an item
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button - Outside sidebar to always be visible */}
      <button
        className={`sidebar-toggle-btn ${isCollapsed ? "show" : ""}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <MenuIcon sx={{ fontSize: 24 }} />
        ) : (
          <CloseIcon sx={{ fontSize: 24 }} />
        )}
      </button>

      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
        onClick={(e) => {
          // Close sidebar when clicking on the backdrop (the ::before overlay)
          if (window.innerWidth <= 1024 && !isCollapsed && e.target === e.currentTarget) {
            setIsCollapsed(true);
          }
        }}
      >

        {/* Background Image */}
        <div
          className={`sidebar-bg ${fade ? "fade-in" : "fade-out"
            }`}
          style={{
            backgroundImage: `url(${DOG_IMAGES[currentImageIndex]})`,
          }}
        />

        {/* Overlay */}
        <div className="sidebar-overlay" />

        {/* Sidebar Content */}
        <div className="sidebar-content">

          {/* Logo */}
          <div className="sidebar-logo">
            <span className="logo-vet">vet</span>
            <span className="logo-pms">Managment</span>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const isActive = isActiveItem(item);
              const isClinicItem = isClinicPage;
              const key = item.value || item.label;
              const hasDropdown = item.hasDropdown && item.children;

              // Check if any child is active
              const isChildActive = hasDropdown && item.children.some(child => isDropdownItemActive(child));

              if (isClinicItem) {
                // For clinic pages, render with dropdown support
                if (hasDropdown) {
                  // Render dropdown for clinic items
                  return (
                    <div key={key} className="sidebar-item-wrapper">
                      <button
                        className={`sidebar-item ${isChildActive ? "active" : ""}`}
                        onClick={() => toggleDropdown(item.label)}
                      >
                        <span className="sidebar-icon">
                          {item.icon}
                        </span>
                        <span className="sidebar-label">
                          {item.label}
                        </span>
                        <span className="sidebar-dropdown-arrow">
                          {openDropdowns[item.label] ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                        </span>
                      </button>
                      {openDropdowns[item.label] && (
                        <div className="sidebar-dropdown">
                          {item.children.map((child, index) => (
                            <button
                              key={`${child.label}-${index}`}
                              className={`sidebar-dropdown-item ${isActive && activeClinicTab === child.value ? "active" : ""}`}
                              onClick={() => onTabChange && onTabChange(child.value)}
                            >
                              <span className="sidebar-dropdown-icon">
                                {child.icon}
                              </span>
                              <span className="sidebar-dropdown-label">
                                {child.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Render simple button for non-dropdown clinic items
                  return (
                    <button
                      key={key}
                      className={`sidebar-item ${isActive ? "active" : ""}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="sidebar-icon">
                        {item.icon}
                      </span>

                      <span className="sidebar-label">
                        {item.label}
                      </span>

                      {item.hasArrow && (
                        <span className="sidebar-arrow">
                          &#8250;
                        </span>
                      )}
                    </button>
                  );
                }
              } else {
                // For regular pages, use links
                return (
                  <div key={key} className="sidebar-item-wrapper">
                    {hasDropdown ? (
                      <>
                        <button
                          className={`sidebar-item ${isChildActive ? "active" : ""}`}
                          onClick={() => toggleDropdown(item.label)}
                        >
                          <span className="sidebar-icon">
                            {item.icon}
                          </span>
                          <span className="sidebar-label">
                            {item.label}
                          </span>
                          <span className="sidebar-dropdown-arrow">
                            {openDropdowns[item.label] ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                          </span>
                        </button>
                        {openDropdowns[item.label] && (
                          <div className="sidebar-dropdown">
                            {item.children.map((child, index) => (
                              <Link
                                key={`${child.label}-${index}`}
                                to={child.path}
                                className={`sidebar-dropdown-item ${isDropdownItemActive(child) ? "active" : ""}`}
                              >
                                <span className="sidebar-dropdown-icon">
                                  {child.icon}
                                </span>
                                <span className="sidebar-dropdown-label">
                                  {child.label}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        className={`sidebar-item ${isActive ? "active" : ""}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="sidebar-icon">
                          {item.icon}
                        </span>

                        <span className="sidebar-label">
                          {item.label}
                        </span>

                        {item.hasArrow && (
                          <span className="sidebar-arrow">
                            &#8250;
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              }
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;