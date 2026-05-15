import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import AddIcon from "@mui/icons-material/Add";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
// import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import "./superAdminDashboard.css";

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { enqueueSnackbar } = useSnackbar();
    const [clinics, setClinics] = useState([]);
    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [activeView, setActiveView] = useState(() => {
        const view = searchParams.get("view");
        return view === "clinics" || view === "users" || view === "dashboard" ? view : "dashboard";
    });

    const handleViewChange = (view) => {
        setActiveView(view);
        navigate(`?view=${view}`, { replace: true });
    };
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "STAFF",
        clinicId: "",
    });

    const userRoles = ["ALL", "ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF", "USER"];

    const fetchClinics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth("/clinics");
            setClinics(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error fetching clinics:", error);
            enqueueSnackbar("Failed to fetch clinics", { variant: "error" });
            setClinics([]);
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth("/users");
            setUsers(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            enqueueSnackbar("Failed to fetch users", { variant: "error" });
            setUsers([]);
        }
    }, [enqueueSnackbar]);

    const fetchAllCustomers = useCallback(async () => {
        try {
            const allCustomers = [];
            for (const clinic of clinics) {
                try {
                    const response = await HttpService.getWithAuth(`/clinics/${clinic.id}/customers?limit=1000`);
                    const data = response?.data || response || [];
                    const customersArray = Array.isArray(data) ? data : data.data || [];
                    allCustomers.push(...customersArray);
                } catch (err) {
                    console.log(`No customers for clinic ${clinic.id}`);
                }
            }
            setCustomers(allCustomers);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers([]);
        }
    }, [clinics]);

    useEffect(() => {
        const view = searchParams.get("view");
        if (view && (view === "clinics" || view === "users" || view === "dashboard")) {
            setActiveView(view);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchClinics();
        fetchUsers();
    }, [fetchClinics, fetchUsers]);

    useEffect(() => {
        if (clinics.length > 0) {
            fetchAllCustomers();
        }
    }, [clinics, fetchAllCustomers]);

    const handleViewClinicPages = (clinicId) => {
        navigate(`/superadmin/clinic/${clinicId}/pages`);
    };

    const handleAddClinic = () => {
        navigate("/superadmin/add-clinic");
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setUserFormData({
            username: "",
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            phoneNumber: "",
            role: "STAFF",
            clinicId: "",
        });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserFormData({
            username: user.username,
            email: user.email,
            password: "",
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            clinicId: user.clinicId || "",
        });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async () => {
        try {
            if (!userFormData.email || !userFormData.firstName || !userFormData.role) {
                enqueueSnackbar("Email, first name, and role are required", { variant: "error" });
                return;
            }

            if (editingUser) {
                const updateData = {
                    firstName: userFormData.firstName,
                    lastName: userFormData.lastName,
                    phoneNumber: userFormData.phoneNumber,
                    role: userFormData.role,
                    clinicId: userFormData.clinicId || null,
                };
                if (userFormData.password) {
                    updateData.password = userFormData.password;
                }
                await HttpService.putWithAuth(`/users/${editingUser.id}`, updateData);
                enqueueSnackbar("User updated successfully", { variant: "success" });
            } else {
                if (!userFormData.username || !userFormData.password) {
                    enqueueSnackbar("Username and password are required", { variant: "error" });
                    return;
                }
                const createData = {
                    ...userFormData,
                    clinicId: userFormData.clinicId || null,
                };
                await HttpService.postWithAuth("/users", createData);
                enqueueSnackbar("User created successfully", { variant: "success" });
            }

            setIsUserModalOpen(false);
            fetchUsers();
        } catch (error) {
            enqueueSnackbar(
                error.response?.data?.message || "Failed to save user",
                { variant: "error" }
            );
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete this user? This action cannot be undone.")) return;
        try {
            await HttpService.deleteWithAuth(`/users/${userId}`);
            enqueueSnackbar("User deleted successfully", { variant: "success" });
            fetchUsers();
        } catch (error) {
            enqueueSnackbar(
                error.response?.data?.message || "Failed to delete user",
                { variant: "error" }
            );
        }
    };

    const handleUserFormChange = (e) => {
        const { name, value } = e.target;
        setUserFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeleteClinic = async (clinicId) => {
        if (!window.confirm("Are you sure you want to delete this clinic?")) return;
        try {
            await HttpService.deleteWithAuth(`/clinics/${clinicId}`);
            enqueueSnackbar("Clinic deleted successfully", { variant: "success" });
            fetchClinics();
        } catch (error) {
            enqueueSnackbar("Failed to delete clinic", { variant: "error" });
        }
    };

    // Helper: map role string → readable label
    const getRoleLabel = (role) => {
        const labels = {
            SUPERADMIN: "Super Admin",
            ADMIN: "Admin",
            RECEPTIONIST: "Receptionist",
            PHARMACIST: "Pharmacist",
            GROOMER: "Groomer",
            VET: "Veterinarian",
            STAFF: "Staff",
            USER: "User",
        };
        return labels[role] || role || "User";
    };

    const filteredClinics = clinics.filter(
        (clinic) =>
            clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clinic.clinicCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(
        (user) =>
            (roleFilter === "ALL" || user.role === roleFilter) &&
            [user.firstName, user.email, user.username]
                .some((field) => (field || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                {/* Left Sidebar Navigation */}
                <div className="superadmin-sidebar">
                    <nav className="sidebar-nav">
                        <button
                            className={`sidebar-nav-item ${activeView === "dashboard" ? "active" : ""}`}
                            onClick={() => handleViewChange("dashboard")}
                        >
                            <span className="sidebar-icon">📊</span>
                            <span className="sidebar-label">Dashboard</span>
                        </button>
                        <button
                            className={`sidebar-nav-item ${activeView === "clinics" ? "active" : ""}`}
                            onClick={() => handleViewChange("clinics")}
                        >
                            <span className="sidebar-icon">🏥</span>
                            <span className="sidebar-label">Centers</span>
                        </button>
                        <button
                            className={`sidebar-nav-item ${activeView === "users" ? "active" : ""}`}
                            onClick={() => handleViewChange("users")}
                        >
                            <span className="sidebar-icon">👥</span>
                            <span className="sidebar-label">Users</span>
                        </button>
                    </nav>
                </div>

                <div className="superadmin-container">

                    {/* ---- Header ---- */}
                    <div className="superadmin-header">
                        <div>
                            <h1>
                                {activeView === "dashboard"
                                    ? "Dashboard"
                                    : activeView === "clinics"
                                        ? "Center Management"
                                        : "User Management"}
                            </h1>
                            <p>
                                {activeView === "dashboard"
                                    ? "Overview of all Centre and system statistics"
                                    : activeView === "clinics"
                                        ? "Manage all centre locations and access control"
                                        : "Manage system users and roles"}
                            </p>
                        </div>
                        <div className="header-buttons">
                            {activeView === "clinics" ? (
                                <button className="add-clinic-btn" onClick={handleAddClinic}>
                                    <AddIcon sx={{ fontSize: 20 }} />
                                    <span>Add New Center</span>
                                </button>
                            ) : activeView === "users" ? (
                                <button className="add-clinic-btn" onClick={handleAddUser}>
                                    <AddIcon sx={{ fontSize: 20 }} />
                                    <span>Add User</span>
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* ============================================================
                        DASHBOARD VIEW
                    ============================================================ */}
                    {activeView === "dashboard" && !loading && (
                        <div className="dashboard-stats">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: "#e0f2fe" }}>
                                        <span style={{ color: "#0284c7" }}>🏥</span>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Total Centres</span>
                                        <span className="stat-value">{clinics.length}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: "#f0fdf4" }}>
                                        <span style={{ color: "#16a34a" }}>👥</span>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Total Users</span>
                                        <span className="stat-value">{users.length}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: "#fef3c7" }}>
                                        <span style={{ color: "#d97706" }}>🐾</span>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Total Patients</span>
                                        <span className="stat-value">{customers.length}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: "#fce7f3" }}>
                                        <span style={{ color: "#db2777" }}>⚙️</span>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Active Staff</span>
                                        <span className="stat-value">
                                            {users.filter(u => u.role !== "USER").length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Role Distribution */}
                            <div className="stats-section">
                                <h3>Users by Role</h3>
                                <div className="role-stats-grid">
                                    {["ADMIN", "VET", "RECEPTIONIST", "PHARMACIST", "GROOMER", "STAFF", "USER"].map((role) => {
                                        const count = users.filter(u => u.role === role).length;
                                        return (
                                            <div key={role} className="role-stat-card">
                                                <span className="role-name">{getRoleLabel(role)}</span>
                                                <span className="role-count">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clinics Overview */}
                            <div className="stats-section">
                                <h3>Centres Overview</h3>
                                <div className="clinics-overview-grid">
                                    {clinics.map((clinic) => {
                                        const clinicUsers = users.filter(u => u.clinicId === clinic.id).length;
                                        return (
                                            <div key={clinic.id} className="clinic-overview-card">
                                                <div className="clinic-overview-header">
                                                    <h4>{clinic.clinicName}</h4>
                                                    <span className="clinic-code">{clinic.clinicCode}</span>
                                                </div>
                                                <div className="clinic-overview-stats">
                                                    <div className="clinic-stat">
                                                        <span className="clinic-stat-label">Users</span>
                                                        <span className="clinic-stat-value">{clinicUsers}</span>
                                                    </div>
                                                    <div className="clinic-stat">
                                                        <span className="clinic-stat-label">Plan</span>
                                                        <span className="clinic-stat-value">{clinic.subscriptionPlan || "Standard"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---- Search ---- */}
                    {activeView !== "dashboard" && (
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder={
                                    activeView === "clinics"
                                        ? "Search by clinic name or code..."
                                        : "Search by name, email, or username..."
                                }
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}

                    {/* ---- Role Filter (users only) ---- */}
                    {activeView === "users" && (
                        <div className="role-filter-container">
                            <div className="role-filter-buttons">
                                {userRoles.map((role) => (
                                    <button
                                        key={role}
                                        className={`role-filter-btn ${roleFilter === role ? "active" : ""}`}
                                        onClick={() => setRoleFilter(role)}
                                    >
                                        {role === "ALL" ? "All Users" : getRoleLabel(role)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ============================================================
                        CLINICS VIEW
                    ============================================================ */}
                    {activeView === "clinics" && (
                        <>
                            {loading ? (
                                <div className="loading">Loading clinics...</div>
                            ) : filteredClinics.length === 0 ? (
                                <div className="empty-state">
                                    <p>No clinics found</p>
                                    <button onClick={handleAddClinic}>Create First Clinic</button>
                                </div>
                            ) : (
                                <div className="clinics-grid">
                                    {filteredClinics.map((clinic) => (
                                        <div key={clinic.id} className="clinic-card">
                                            <div className="clinic-header">
                                                <h3>{clinic.clinicName}</h3>
                                                <span className="status active">Active</span>
                                            </div>
                                            <div className="clinic-info">
                                                <p><strong>Code:</strong> {clinic.clinicCode}</p>
                                                <p><strong>Plan:</strong> {clinic.subscriptionPlan || "Standard"}</p>
                                                <p><strong>Max Users:</strong> {clinic.maxUsers}</p>
                                            </div>
                                            <div className="clinic-actions">
                                                <button
                                                    className="view-btn"
                                                    onClick={() => handleViewClinicPages(clinic.id)}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteClinic(clinic.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ============================================================
                        USERS VIEW
                    ============================================================ */}
                    {activeView === "users" && (
                        <>
                            {loading ? (
                                <div className="loading">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="empty-state">
                                    <p>No users found</p>
                                    <button onClick={handleAddUser}>Create First User</button>
                                </div>
                            ) : (
                                <div className="users-table-container">
                                    <table className="users-table">
                                        {/*
                                            colgroup tells the browser the column count and widths.
                                            CSS targets these via .users-table col:nth-child(n).
                                            Order must match th/td order exactly.
                                        */}
                                        <colgroup>
                                            <col /> {/* 1 Name    */}
                                            <col /> {/* 2 Email   */}
                                            <col /> {/* 3 Username*/}
                                            <col /> {/* 4 Phone   */}
                                            <col /> {/* 5 Role    */}
                                            <col /> {/* 6 Clinic  */}
                                            <col /> {/* 7 Actions */}
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Username</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                                <th>Clinic</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td title={`${user.firstName} ${user.lastName}`}>
                                                        {user.firstName} {user.lastName}
                                                    </td>
                                                    <td title={user.email}>{user.email}</td>
                                                    <td title={user.username}>{user.username}</td>
                                                    <td>{user.phoneNumber || "N/A"}</td>
                                                    <td>
                                                        <span
                                                            className={`role-badge ${(user.role || "user").toLowerCase()}`}
                                                        >
                                                            {getRoleLabel(user.role)}
                                                        </span>
                                                    </td>
                                                    <td title={
                                                        user.clinicId
                                                            ? clinics.find((c) => c.id === user.clinicId)?.clinicName
                                                            : "No Clinic"
                                                    }>
                                                        {user.clinicId
                                                            ? clinics.find((c) => c.id === user.clinicId)?.clinicName || "Clinic Not Found"
                                                            : "No Clinic"}
                                                    </td>
                                                    <td className="user-actions">
                                                        <button
                                                            className="edit-btn"
                                                            onClick={() => handleEditUser(user)}
                                                            title="Edit user"
                                                        >
                                                            ✏️
                                                        </button>
                                                        {user.role !== "SUPERADMIN" && (
                                                            <button
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                title="Delete user"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* ============================================================
                        USER MODAL
                    ============================================================ */}
                    {isUserModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
                                    <button
                                        className="close-btn"
                                        onClick={() => setIsUserModalOpen(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>First Name *</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="Enter first name"
                                                value={userFormData.firstName}
                                                onChange={handleUserFormChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Enter last name"
                                                value={userFormData.lastName}
                                                onChange={handleUserFormChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter email"
                                            value={userFormData.email}
                                            onChange={handleUserFormChange}
                                            disabled={!!editingUser}
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Username *</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    placeholder="Enter username"
                                                    value={userFormData.username}
                                                    onChange={handleUserFormChange}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Password *</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="Enter password"
                                                    value={userFormData.password}
                                                    onChange={handleUserFormChange}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {editingUser && (
                                        <div className="form-group">
                                            <label>New Password (leave blank to keep current)</label>
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="Enter new password"
                                                value={userFormData.password}
                                                onChange={handleUserFormChange}
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            placeholder="Enter phone number"
                                            value={userFormData.phoneNumber}
                                            onChange={handleUserFormChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            name="role"
                                            value={userFormData.role}
                                            onChange={handleUserFormChange}
                                        >
                                            <option value="SUPERADMIN">Super Admin</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="VET">Veterinarian</option>
                                            <option value="GROOMER">Groomer</option>
                                            <option value="RECEPTIONIST">Receptionist</option>
                                            <option value="PHARMACIST">Pharmacist</option>
                                            <option value="STAFF">Staff</option>
                                            <option value="USER">User</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Assign to Clinic</label>
                                        <select
                                            name="clinicId"
                                            value={userFormData.clinicId}
                                            onChange={handleUserFormChange}
                                        >
                                            <option value="">-- Select Clinic (Optional) --</option>
                                            {clinics.map((clinic) => (
                                                <option key={clinic.id} value={clinic.id}>
                                                    {clinic.clinicName} ({clinic.clinicCode})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setIsUserModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button className="btn-primary" onClick={handleSaveUser}>
                                        {editingUser ? "Update User" : "Add User"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;