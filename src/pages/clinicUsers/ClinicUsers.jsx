import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./clinicUsers.css";

const ClinicUsers = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { state: clinicState } = useContext(ClinicContext);
    const clinicId = clinicState?.selectedClinicId;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "STAFF",
    });

    const userRoles = ["ALL", "ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF"];

    const fetchUsers = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/users`);
            const data = Array.isArray(response) ? response : response.data || [];
            setUsers(data);
        } catch (error) {
            enqueueSnackbar("Failed to load users", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    useEffect(() => {
        if (clinicId) {
            fetchUsers();
        }
    }, [clinicId, fetchUsers]);

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
        });
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserFormData({
            username: user.username,
            email: user.email,
            password: "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            role: user.role,
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
        try {
            if (!userFormData.email || !userFormData.firstName || !userFormData.role) {
                enqueueSnackbar("Email, first name, and role are required", { variant: "error" });
                return;
            }

            if (!editingUser && (!userFormData.username || !userFormData.password)) {
                enqueueSnackbar("Username and password are required for new users", { variant: "error" });
                return;
            }

            const payload = { ...userFormData };

            if (editingUser) {
                await HttpService.putWithAuth(`/users/${editingUser.id}`, payload);
                enqueueSnackbar("User updated successfully", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/users`, payload);
                enqueueSnackbar("User created successfully", { variant: "success" });
            }

            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to save user", { variant: "error" });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete this user? This action cannot be undone.")) return;
        try {
            await HttpService.deleteWithAuth(`/users/${userId}`);
            enqueueSnackbar("User deleted successfully", { variant: "success" });
            fetchUsers();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Delete failed", { variant: "error" });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserFormData((prev) => ({ ...prev, [name]: value }));
    };

    const getRoleBadgeClass = (role) => {
        const roleLower = role?.toLowerCase() || "";
        if (roleLower.includes("admin")) return "role-admin";
        if (roleLower.includes("vet")) return "role-vet";
        if (roleLower.includes("groomer")) return "role-groomer";
        if (roleLower.includes("pharmacist")) return "role-pharmacist";
        if (roleLower.includes("receptionist")) return "role-receptionist";
        return "role-staff";
    };

    if (!clinicId) return <div className="clinic-users-error">No clinic selected</div>;

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            !searchTerm ||
            (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.username?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === "ALL" || user.role?.toUpperCase() === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="clinic-users">
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>Clinic Users</h1>
                        <p>Manage users for this clinic</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddUser}>
                        Add User
                    </button>
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="role-filters">
                        {userRoles.map((role) => (
                            <button
                                key={role}
                                className={`role-filter-btn ${roleFilter === role ? "active" : ""}`}
                                onClick={() => setRoleFilter(role)}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.username}</td>
                                            <td>{user.phoneNumber || "-"}</td>
                                            <td>
                                                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditUser(user)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit User Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
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
                                        value={userFormData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={userFormData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={userFormData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={userFormData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                            {!editingUser && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Username *</label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={userFormData.username}
                                                onChange={handleInputChange}
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Password *</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={userFormData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter password"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="form-group">
                                <label>Role *</label>
                                <select name="role" value={userFormData.role} onChange={handleInputChange}>
                                    <option value="STAFF">Staff</option>
                                    <option value="VET">Veterinarian</option>
                                    <option value="GROOMER">Groomer</option>
                                    <option value="RECEPTIONIST">Receptionist</option>
                                    <option value="PHARMACIST">Pharmacist</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveUser}>
                                {editingUser ? "Update User" : "Add User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicUsers;