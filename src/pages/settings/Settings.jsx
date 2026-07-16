import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import AuthService from "../../services/AuthService";
import {
    PAGE_ACCESS_OPTIONS,
    ROLE_ALLOWED_PAGES,
    ROLE_LABELS,
} from "../../utils/pageAccess";
import "./settings.css";

const EDITABLE_ROLES = ["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF"];

const emptyFormState = {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "STAFF",
    isActive: true,
    allowedPages: ROLE_ALLOWED_PAGES.STAFF,
};

// ── Three-dot dropdown for allowed pages ──
// Uses a portal so the dropdown escapes table overflow:hidden/auto clipping
const PagesDropdown = ({ allowedPages }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const dropRef = useRef(null);

    const handleButtonClick = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 6,
                left: rect.left + window.scrollX + rect.width / 2,
            });
        }
        setOpen((v) => !v);
    };

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                dropRef.current && !dropRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open]);

    const dropdown = open
        ? ReactDOM.createPortal(
            <div
                ref={dropRef}
                className="pages-dropdown"
                style={{ top: coords.top, left: coords.left }}
            >
                <p className="pages-dropdown-title">Allowed Pages</p>
                {allowedPages.length === 0 ? (
                    <span className="pages-dropdown-empty">No pages assigned</span>
                ) : (
                    <div className="pages-dropdown-list">
                        {allowedPages.map((pageKey) => {
                            const page = PAGE_ACCESS_OPTIONS.find((item) => item.key === pageKey);
                            return (
                                <span key={pageKey} className="permission-tag">
                                    {page?.label || pageKey}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>,
            document.body
        )
        : null;

    return (
        <div className="pages-dropdown-wrap">
            <button
                ref={btnRef}
                className="three-dot-btn"
                onClick={handleButtonClick}
                title="View allowed pages"
            >
                •••
            </button>
            {dropdown}
        </div>
    );
};

const Settings = ({ clinicId: propClinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = AuthService.getCurrentUser();
    const clinicId = propClinicId || localStorage.getItem("selectedClinicId") || currentUser?.clinicId;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("users");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormState);

    const fetchUsers = useCallback(async () => {
        if (!clinicId) {
            setUsers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/users?clinicId=${clinicId}&limit=100`);
            const userList = Array.isArray(response?.data) ? response.data : [];
            setUsers(userList);
        } catch (error) {
            console.error(error);
            enqueueSnackbar("Failed to load clinic users", { variant: "error" });
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const roleCards = useMemo(
        () =>
            EDITABLE_ROLES.map((role) => ({
                value: role,
                label: ROLE_LABELS[role],
                count: users.filter((user) => user.role === role).length,
                defaultPages: ROLE_ALLOWED_PAGES[role] || [],
            })),
        [users]
    );

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    const usersWithSettings = users.filter((user) => (user.allowedPages || []).includes("settings")).length;

    const openEditModal = (user) => {
        setFormData({
            id: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            role: user.role || "STAFF",
            isActive: user.isActive !== false,
            allowedPages: Array.isArray(user.allowedPages)
                ? user.allowedPages
                : (ROLE_ALLOWED_PAGES[user.role] || ROLE_ALLOWED_PAGES.STAFF),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(emptyFormState);
    };

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRoleChange = (role) => {
        setFormData((prev) => ({
            ...prev,
            role,
            allowedPages: ROLE_ALLOWED_PAGES[role] || [],
        }));
    };

    const toggleAllowedPage = (pageKey) => {
        setFormData((prev) => {
            const alreadySelected = prev.allowedPages.includes(pageKey);
            return {
                ...prev,
                allowedPages: alreadySelected
                    ? prev.allowedPages.filter((page) => page !== pageKey)
                    : [...prev.allowedPages, pageKey],
            };
        });
    };

    const handleSaveUser = async () => {
        try {
            if (!formData.id) {
                enqueueSnackbar("Select a user to update", { variant: "error" });
                return;
            }

            await HttpService.putWithAuth(`/users/${formData.id}`, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                isActive: formData.isActive,
                allowedPages: formData.allowedPages,
            });

            if (currentUser?.id === formData.id) {
                AuthService.mergeCurrentUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    role: formData.role,
                    isActive: formData.isActive,
                    allowedPages: formData.allowedPages,
                });
            }

            enqueueSnackbar("User settings updated", { variant: "success" });
            closeModal();
            fetchUsers();
        } catch (error) {
            console.error(error);
            enqueueSnackbar(error?.response?.data?.message || "Failed to update user", {
                variant: "error",
            });
        }
    };

    const getFullName = (user) =>
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Unnamed User";

    if (!clinicId) {
        return (
            <div className="settings">
                <div className="settings-container">
                    <div className="settings-content">
                        <div className="tab-content">
                            <p>No clinic selected.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings">
            <div className="settings-container">
                <div className="settings-content">
                    <div className="page-header">
                        <div>
                            <h1>Clinic Settings</h1>
                            <p>Manage real clinic users, roles, and page visibility</p>
                        </div>
                    </div>

                    <div className="stats-container">
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{totalUsers}</h3>
                                <p>Total Users</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{activeUsers}</h3>
                                <p>Active Users</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{inactiveUsers}</h3>
                                <p>Inactive Users</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{usersWithSettings}</h3>
                                <p>Users With Settings Access</p>
                            </div>
                        </div>
                    </div>

                    <div className="tab-container">
                        <button
                            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                            onClick={() => setActiveTab("users")}
                        >
                            User Directory
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "roles" ? "active" : ""}`}
                            onClick={() => setActiveTab("roles")}
                        >
                            Roles & Page Access
                        </button>
                    </div>

                    {activeTab === "users" && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>User Directory</h2>
                                {/* <span className="settings-note">Users are loaded from the real superadmin user records for this clinic.</span> */}
                            </div>

                            {loading ? (
                                <p>Loading users...</p>
                            ) : (
                                <div className="users-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Pages</th>
                                                <th>Joined</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="user-name">
                                                        <strong>{getFullName(user)}</strong>
                                                    </td>
                                                    <td>{user.email || "-"}</td>
                                                    <td>{user.phoneNumber || "-"}</td>
                                                    <td>
                                                        <span className={`role-badge role-${(user.role || "").toLowerCase()}`}>
                                                            {ROLE_LABELS[user.role] || user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status ${user.isActive ? "active" : "inactive"}`}>
                                                            {user.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <PagesDropdown allowedPages={user.allowedPages || []} />
                                                    </td>
                                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                                                    <td className="actions">
                                                        <button
                                                            className="btn-action edit-text"
                                                            onClick={() => openEditModal(user)}
                                                        >
                                                            Edit Access
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="empty-state">
                                                        No users found for this clinic.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "roles" && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>Roles & Default Page Access</h2>
                            </div>

                            <div className="roles-grid">
                                {roleCards.map((role) => (
                                    <div key={role.value} className="role-card">
                                        <div className={`role-card-header role-${role.value.toLowerCase()}`}>
                                            <h3>{role.label}</h3>
                                            <p>{role.count} users</p>
                                        </div>
                                        <div className="role-card-body">
                                            <h4>Default Pages</h4>
                                            <div className="page-tag-list">
                                                {role.defaultPages.map((pageKey) => {
                                                    const page = PAGE_ACCESS_OPTIONS.find((item) => item.key === pageKey);
                                                    return (
                                                        <span key={pageKey} className="permission-tag">
                                                            {page?.label || pageKey}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isModalOpen && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <div className="modal modal-wide" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Edit User Access</h2>
                                    <button className="close-btn" onClick={closeModal}>
                                        x
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(event) => handleFieldChange("firstName", event.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(event) => handleFieldChange("lastName", event.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(event) => handleFieldChange("email", event.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input
                                                type="text"
                                                value={formData.phoneNumber}
                                                onChange={(event) => handleFieldChange("phoneNumber", event.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Role</label>
                                            <select
                                                value={formData.role}
                                                onChange={(event) => handleRoleChange(event.target.value)}
                                            >
                                                {EDITABLE_ROLES.map((role) => (
                                                    <option key={role} value={role}>
                                                        {ROLE_LABELS[role]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select
                                                value={formData.isActive ? "active" : "inactive"}
                                                onChange={(event) => handleFieldChange("isActive", event.target.value === "active")}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Visible Pages</label>
                                        <div className="page-access-grid">
                                            {PAGE_ACCESS_OPTIONS.map((page) => (
                                                <label key={page.key} className="page-access-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowedPages.includes(page.key)}
                                                        onChange={() => toggleAllowedPage(page.key)}
                                                    />
                                                    <span>{page.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveUser}>
                                        Save Changes
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

export default Settings;