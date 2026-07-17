import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import "./clinicDetail.css";

const ClinicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [clinic, setClinic] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [selectedAdminId, setSelectedAdminId] = useState("");
    const [selectedStaffId, setSelectedStaffId] = useState("");

    const fetchClinicAndUsers = useCallback(async () => {
        try {
            setLoading(true);
            const [clinicRes, usersRes] = await Promise.all([
                HttpService.getWithAuth(`/clinics/${id}`),
                HttpService.getWithAuth("/users"),
            ]);
            setClinic(clinicRes.data);
            setAllUsers(usersRes.data || []);
        } catch (error) {
            enqueueSnackbar("Failed to fetch clinic details", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [id, enqueueSnackbar]);

    useEffect(() => {
        if (id) fetchClinicAndUsers();
    }, [id, fetchClinicAndUsers]);

    const getAvailableAdmins = () => {
        return allUsers.filter(
            (user) =>
                user.role === "ROLE_ADMIN" &&
                !clinic.admins.some((admin) => admin._id === user._id)
        );
    };

    const getAvailableStaff = () => {
        return allUsers.filter(
            (user) =>
                user.role === "ROLE_STAFF" &&
                !clinic.staff.some((staff) => staff._id === user._id)
        );
    };

    const handleAddAdmin = async () => {
        if (!selectedAdminId) {
            enqueueSnackbar("Please select an admin", { variant: "warning" });
            return;
        }

        try {
            await HttpService.postWithAuth("/clinics/admin/add", {
                clinicId: id,
                adminId: selectedAdminId,
            });
            enqueueSnackbar("Admin added successfully", { variant: "success" });
            setShowAddAdmin(false);
            setSelectedAdminId("");
            fetchClinicAndUsers();
        } catch (error) {
            enqueueSnackbar("Failed to add admin", { variant: "error" });
        }
    };

    const handleRemoveAdmin = async (adminId) => {
        if (window.confirm("Are you sure you want to remove this admin?")) {
            try {
                await HttpService.postWithAuth("/clinics/admin/remove", {
                    clinicId: id,
                    adminId: adminId,
                });
                enqueueSnackbar("Admin removed successfully", { variant: "success" });
                fetchClinicAndUsers();
            } catch (error) {
                enqueueSnackbar("Failed to remove admin", { variant: "error" });
            }
        }
    };

    const handleAddStaff = async () => {
        if (!selectedStaffId) {
            enqueueSnackbar("Please select staff member", { variant: "warning" });
            return;
        }

        try {
            await HttpService.postWithAuth("/clinics/staff/add", {
                clinicId: id,
                staffId: selectedStaffId,
            });
            enqueueSnackbar("Staff member added successfully", { variant: "success" });
            setShowAddStaff(false);
            setSelectedStaffId("");
            fetchClinicAndUsers();
        } catch (error) {
            enqueueSnackbar("Failed to add staff member", { variant: "error" });
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (window.confirm("Are you sure you want to remove this staff member?")) {
            try {
                await HttpService.postWithAuth("/clinics/staff/remove", {
                    clinicId: id,
                    staffId: staffId,
                });
                enqueueSnackbar("Staff member removed successfully", { variant: "success" });
                fetchClinicAndUsers();
            } catch (error) {
                enqueueSnackbar("Failed to remove staff member", { variant: "error" });
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading centre details...</div>;
    }

    if (!clinic) {
        return <div className="error">Centre not found</div>;
    }

    return (
        <div>
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                <Sidebar />
                <div className="clinic-detail-container">
                    <div className="clinic-detail-header">
                        <button
                            className="back-btn"
                            onClick={() => navigate("/superadmin/dashboard")}
                        >
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                            Back
                        </button>
                        <div>
                            <h1>{clinic.clinicName}</h1>
                            <p className="clinic-code">Code: {clinic.clinicCode}</p>
                        </div>
                    </div>

                    {/* Clinic Information */}
                    <div className="clinic-info-section">
                        <h2>Clinic Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Email:</span>
                                <span className="value">{clinic.email || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Phone:</span>
                                <span className="value">{clinic.phoneNumber || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">License Number:</span>
                                <span className="value">{clinic.licenseNumber || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">License Expiry:</span>
                                <span className="value">
                                    {clinic.licenseExpiry
                                        ? new Date(clinic.licenseExpiry).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Location Information */}
                    <div className="clinic-info-section">
                        <h2>Location Details</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Address:</span>
                                <span className="value">{clinic.address || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">City:</span>
                                <span className="value">{clinic.city || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">State:</span>
                                <span className="value">{clinic.state || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Zip Code:</span>
                                <span className="value">{clinic.zipCode || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Country:</span>
                                <span className="value">{clinic.country || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="clinic-info-section">
                        <h2>Business Hours</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Business Hours:</span>
                                <span className="value">{clinic.businessHours || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Operating Days:</span>
                                <span className="value">
                                    {clinic.operatingDays?.length > 0
                                        ? clinic.operatingDays.join(", ")
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Information */}
                    <div className="clinic-info-section">
                        <h2>Subscription & Users</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Subscription Start Date:</span>
                                <span className="value">
                                    {clinic.subscriptionStartDate
                                        ? new Date(clinic.subscriptionStartDate).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Subscription End Date:</span>
                                <span className="value">
                                    {clinic.subscriptionEndDate
                                        ? new Date(clinic.subscriptionEndDate).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Max Users:</span>
                                <span className="value">{clinic.maxUsers}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Current Users:</span>
                                <span className="value">
                                    {clinic.admins.length + clinic.staff.length} / {clinic.maxUsers}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Status:</span>
                                <span className={`value status ${clinic.isActive ? "active" : "inactive"}`}>
                                    {clinic.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    {clinic.features && clinic.features.length > 0 && (
                        <div className="clinic-info-section">
                            <h2>Features</h2>
                            <div className="features-list">
                                {clinic.features.map((feature, idx) => (
                                    <div key={idx} className="feature-item">
                                        <input
                                            type="checkbox"
                                            checked={feature.enabled}
                                            disabled
                                            readOnly
                                        />
                                        <span>{feature.featureName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admins Section */}
                    <div className="access-section">
                        <div className="section-header">
                            <h2>Centre Admins ({clinic.admins.length})</h2>
                            {getAvailableAdmins().length > 0 && (
                                <button
                                    className="add-btn"
                                    onClick={() => setShowAddAdmin(!showAddAdmin)}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                    Add Admin
                                </button>
                            )}
                        </div>

                        {showAddAdmin && (
                            <div className="add-form">
                                <div className="form-group">
                                    <label>Select Admin</label>
                                    <select
                                        value={selectedAdminId}
                                        onChange={(e) => setSelectedAdminId(e.target.value)}
                                    >
                                        <option value="">-- Choose Admin --</option>
                                        {getAvailableAdmins().map((admin) => (
                                            <option key={admin._id} value={admin._id}>
                                                {admin.name} ({admin.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button
                                        className="cancel-btn"
                                        onClick={() => {
                                            setShowAddAdmin(false);
                                            setSelectedAdminId("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button className="submit-btn" onClick={handleAddAdmin}>
                                        Add Admin
                                    </button>
                                </div>
                            </div>
                        )}

                        {clinic.admins.length === 0 ? (
                            <p className="empty-message">No admins assigned to this centre</p>
                        ) : (
                            <div className="users-list">
                                {clinic.admins.map((admin) => (
                                    <div key={admin._id} className="user-item">
                                        <div className="user-info">
                                            <h4>{admin.name}</h4>
                                            <p>{admin.email}</p>
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveAdmin(admin._id)}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Staff Section */}
                    <div className="access-section">
                        <div className="section-header">
                            <h2>Centre Staff ({clinic.staff.length})</h2>
                            {getAvailableStaff().length > 0 && (
                                <button
                                    className="add-btn"
                                    onClick={() => setShowAddStaff(!showAddStaff)}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                    Add Staff
                                </button>
                            )}
                        </div>

                        {showAddStaff && (
                            <div className="add-form">
                                <div className="form-group">
                                    <label>Select Staff Member</label>
                                    <select
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                    >
                                        <option value="">-- Choose Staff --</option>
                                        {getAvailableStaff().map((staff) => (
                                            <option key={staff._id} value={staff._id}>
                                                {staff.name} ({staff.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button
                                        className="cancel-btn"
                                        onClick={() => {
                                            setShowAddStaff(false);
                                            setSelectedStaffId("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button className="submit-btn" onClick={handleAddStaff}>
                                        Add Staff
                                    </button>
                                </div>
                            </div>
                        )}

                        {clinic.staff.length === 0 ? (
                            <p className="empty-message">No staff members assigned to this Centre</p>
                        ) : (
                            <div className="users-list">
                                {clinic.staff.map((staff) => (
                                    <div key={staff._id} className="user-item">
                                        <div className="user-info">
                                            <h4>{staff.name}</h4>
                                            <p>{staff.email}</p>
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveStaff(staff._id)}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicDetail;
