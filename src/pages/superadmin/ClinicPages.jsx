import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import AuthService from "../../services/AuthService";
import { ClinicContext } from "../../context/clinicContext";
import Dashboard from "../dashboard/Dashboard";
import Customers from "../customers/Customers";
import Events from "../events/Events";
import Laboratory from "../laboratory/Laboratory";
import Store from "../store/Store";
import Grooming from "../grooming/Grooming";
import Pharmacy from "../pharmacy/Pharmacy";
import Finance from "../finance/Finance";
import Supplies from "../supplies/Supplies";
import ListPet from "../pet/ListPet";
import Settings from "../settings/Settings";
import UserManagement from "./UserManagement";
import VetDashboard from "../vet/VetDashboard";
import { canAccessPage, getFirstAccessiblePage } from "../../utils/pageAccess";
import "./clinicPages.css";

const TAB_ACCESS_MAP = {
    dashboard: "dashboard",
    vet: "vet",
    customers: "customers",
    pets: "pets",
    appointments: "appointments",
    laboratory: "laboratory",
    "imaging-reports": "laboratory",
    inpatient: "laboratory",
    parameters: "laboratory",
    pharmacy: "pharmacy",
    grooming: "grooming",
    store: "store",
    supplies: "supplies",
    finance: "finance",
    settings: "settings",
    users: null,
};

const ClinicPages = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const { dispatch: dispatchClinic } = useContext(ClinicContext);
    const user = AuthService.getCurrentUser();
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");

    // Determine active tab from current URL pathname
    useEffect(() => {
        const pathname = location.pathname;
        let tab = "dashboard";

        if (pathname.includes("/events")) {
            navigate(`/clinics/${id}/appointments`, { replace: true });
            return;
        }

        if (pathname.includes("/vet")) tab = "vet";
        else if (pathname.includes("/customers")) tab = "customers";
        else if (pathname.includes("/pets")) tab = "pets";
        else if (pathname.includes("/appointments")) tab = "appointments";
        else if (pathname.includes("/imaging-reports")) tab = "imaging-reports";
        else if (pathname.includes("/laboratory")) tab = "laboratory";
        else if (pathname.includes("/grooming")) tab = "grooming";
        else if (pathname.includes("/pharmacy")) tab = "pharmacy";
        else if (pathname.includes("/store")) tab = "store";
        else if (pathname.includes("/supplies")) tab = "supplies";
        else if (pathname.includes("/finance")) tab = "finance";
        else if (pathname.includes("/settings")) tab = "settings";

        setActiveTab(tab);
    }, [id, location.pathname, navigate]);

    useEffect(() => {
        const requiredPage = TAB_ACCESS_MAP[activeTab];
        if (!requiredPage || canAccessPage(user, requiredPage)) {
            return;
        }

        const fallbackTab = getFirstAccessiblePage(user, null);
        if (!fallbackTab) {
            navigate("/unauthorized", { replace: true });
            return;
        }

        navigate(`/clinics/${id}/${fallbackTab}`, { replace: true });
    }, [activeTab, id, navigate, user]);

    const fetchClinic = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${id}`);
            const clinicData = response.data || response;
            setClinic(clinicData);

            // Store clinicId in localStorage for child components
            localStorage.setItem('selectedClinicId', id);

            // Set the clinic context
            dispatchClinic({
                type: "SET_CLINIC",
                payload: clinicData,
            });
        } catch (error) {
            console.error("Error fetching clinic:", error);
            enqueueSnackbar("Failed to fetch clinic details", { variant: "error" });
            navigate("/superadmin/dashboard");
        } finally {
            setLoading(false);
        }
    }, [id, enqueueSnackbar, navigate, dispatchClinic]);

    useEffect(() => {
        if (id) fetchClinic();
    }, [id, fetchClinic]);


    if (loading) {
        return <div className="loading">Loading clinic...</div>;
    }

    if (!clinic) {
        return <div className="error">Clinic not found</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case "vet":
                return <VetDashboard clinicId={id} />;
            case "dashboard":
                return <Dashboard clinicId={id} />;
            case "customers":
                return <Customers clinicId={id} />;
            case "pets":
                return <ListPet clinicId={id} />;
            case "appointments":
                return <Events clinicId={id} />;
            case "laboratory":
                return <Laboratory clinicId={id} subView="lab-reports" />;
            case "imaging-reports":
                return <Laboratory clinicId={id} subView="imaging-reports" />;
            case "inpatient":
                return <Laboratory clinicId={id} subView="inpatient" />;
            case "parameters":
                return <Laboratory clinicId={id} subView="parameters" />;
            case "pharmacy":
                return <Pharmacy clinicId={id} />;
            case "grooming":
                return <Grooming clinicId={id} />;
            case "store":
                return <Store clinicId={id} />;
            case "supplies":
                return <Supplies clinicId={id} />;
            case "finance":
                return <Finance clinicId={id} />;
            case "users":
                return <UserManagement clinicId={id} />;
            case "settings":
                return <Settings clinicId={id} />;
            default:
                return <div>Select a page</div>;
        }
    };

    const handleTabChange = (tab) => {
        const requiredPage = TAB_ACCESS_MAP[tab];
        if (requiredPage && !canAccessPage(user, requiredPage)) {
            enqueueSnackbar("You do not have access to that page", { variant: "warning" });
            return;
        }

        setActiveTab(tab);
        // Navigate to the clinic-scoped route for this tab
        navigate(`/clinics/${id}/${tab}`);
    };

    return (
        <div>
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                <Sidebar activeClinicTab={activeTab} onTabChange={handleTabChange} />
                <div className="clinic-pages-container">
                    <div className="clinic-pages-header">
                        <h1>{clinic.clinicName}</h1>
                        <button
                            className="back-to-clinics"
                            onClick={() => navigate(user?.role === "SUPERADMIN" ? "/superadmin/dashboard" : "/select-clinic")}
                        >
                            ← Back to Clinics
                        </button>
                    </div>

                    <div className="clinic-content">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicPages;
