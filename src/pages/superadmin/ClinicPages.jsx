import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
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
import "./clinicPages.css";

const ClinicPages = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { dispatch: dispatchClinic } = useContext(ClinicContext);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");

    const fetchClinic = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${id}`);
            const clinicData = response.data || response;
            setClinic(clinicData);

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
            case "dashboard":
                return <Dashboard clinicId={id} />;
            case "customers":
                return <Customers clinicId={id} />;
            case "pets":
                return <ListPet clinicId={id} />;
            case "events":
                return <Events clinicId={id} />;
            case "laboratory":
                return <Laboratory clinicId={id} subView="lab-reports" />;
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

    return (
        <div>
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                <Sidebar activeClinicTab={activeTab} onTabChange={setActiveTab} />
                <div className="clinic-pages-container">
                    <div className="clinic-pages-header">
                        <h1>{clinic.clinicName}</h1>
                        <button
                            className="back-to-clinics"
                            onClick={() => navigate("/superadmin/dashboard")}
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
