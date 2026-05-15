import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardCard from "../../components/dashboardCard/DashboardCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import PetsIcon from "@mui/icons-material/Pets";
import ScienceIcon from "@mui/icons-material/Science";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ImageIcon from "@mui/icons-material/Image";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import HomeIcon from "@mui/icons-material/Home";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./home.css";

// ── Hard-coded card data matching the screenshot ──────────────────────────────
const CARDS = [
  {
    id: 1,
    icon: <SettingsIcon />,
    color: "#FF9800",          // orange
    title: "General Settings",
    count: "",
    buttonLabel: "Settings",
    buttonColor: "#FF9800",
    buttonIcon: <WarningAmberIcon />,
  },
  {
    id: 2,
    icon: <PersonIcon />,
    color: "#E91E8C",          // pink/magenta
    title: "Users",
    count: 9,
    buttonLabel: "Add Users",
    buttonColor: "#E91E8C",
    buttonIcon: <PersonIcon />,
  },
  {
    id: 3,
    icon: <GroupsIcon />,
    color: "#4CAF50",          // green
    title: "Owners",
    count: 18,
    buttonLabel: "Add Owners",
    buttonColor: "#4CAF50",
    buttonIcon: <GroupsIcon />,
  },
  {
    id: 4,
    icon: <PetsIcon />,
    color: "#00BCD4",          // cyan/teal
    title: "Patients",
    count: 39,
    buttonLabel: "Add Patients",
    buttonColor: "#00BCD4",
    buttonIcon: <PetsIcon />,
  },
  {
    id: 5,
    icon: <ScienceIcon />,
    color: "#E91E8C",          // pink
    title: "Laboratory",
    count: 17,
    buttonLabel: "Add Lab Tests",
    buttonColor: "#F44336",
    buttonIcon: <ScienceIcon />,
  },
  {
    id: 6,
    icon: <AddBoxIcon />,
    color: "#4CAF50",          // green
    title: "Pharmacy",
    count: 21,
    buttonLabel: "Add Drugs",
    buttonColor: "#4CAF50",
    buttonIcon: <AddBoxIcon />,
  },
  {
    id: 7,
    icon: <ImageIcon />,
    color: "#F44336",          // red
    title: "Imaging",
    count: 4,
    buttonLabel: "Add Imaging Tests",
    buttonColor: "#F44336",
    buttonIcon: <ImageIcon />,
  },
  {
    id: 8,
    icon: <VaccinesIcon />,
    color: "#FF9800",          // orange
    title: "Vaccines",
    count: 23,
    buttonLabel: "Add Vaccines",
    buttonColor: "#FF9800",
    buttonIcon: <VaccinesIcon />,
  },
  {
    id: 9,
    icon: <HomeIcon />,
    color: "#607D8B",          // blue-grey
    title: "Procedures",
    count: 5,
    buttonLabel: "Add Procedures",
    buttonColor: "#607D8B",
    buttonIcon: <HomeIcon />,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectBasedOnRole = async () => {
      try {
        const user = AuthService.getCurrentUser();
        const userRole = user?.role;

        // Redirect super admin users to their dashboard
        if (userRole === "ROLE_SUPERADMIN") {
          navigate("/superadmin/dashboard", { replace: true });
          return;
        }

        // For staff and admin users, fetch their assigned clinic
        if (userRole === "ROLE_STAFF" || userRole === "ROLE_ADMIN") {
          try {
            const response = await HttpService.getWithAuth("/clinics/my-clinic/info");
            const clinics = Array.isArray(response) ? response : response.data || [];

            if (clinics.length === 0) {
              // No clinic assigned - show error message
              console.warn("No clinic assigned to this user");
              setLoading(false);
              return;
            }

            // Redirect to the first assigned clinic's pages
            const clinicId = clinics[0]._id;
            navigate(`/superadmin/clinic/${clinicId}/pages`, { replace: true });
          } catch (error) {
            console.error("Error fetching user's clinic:", error);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in role-based redirect:", error);
        setLoading(false);
      }
    };

    redirectBasedOnRole();
  }, [navigate]);

  if (!loading) {
    return (
      <div className="single">
        <Sidebar />
        <div className="singleContainer">
          <Navbar />
          <div className="home-content">
            <div className="dashboard-grid">
              {CARDS.map((card, i) => (
                <div
                  key={card.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <DashboardCard {...card} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking role and redirecting
  return (
    <div className="single">
      <Sidebar />
      <div className="singleContainer">
        <Navbar />
        <div className="home-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid #f0f0f0",
              borderTop: "4px solid #FF9800",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }}></div>
            <p style={{
              fontSize: "18px",
              color: "#333",
              fontWeight: "500",
              marginTop: "10px"
            }}>Loading clinic information...</p>
            <p style={{
              fontSize: "14px",
              color: "#999",
              marginTop: "10px"
            }}>Please wait while we redirect you...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default Home;