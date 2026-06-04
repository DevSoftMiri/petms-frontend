import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./userManagement.css";

const UserManagement = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = AuthService.getCurrentUser();
    const canManageMultipleClinics = currentUser?.role === "SUPERADMIN";

    const [users, setUsers] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const initialFormState = {
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "STAFF",
        clinicIds: clinicId ? [clinicId] : [],
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await HttpService.getWithAuth(
                `/users?clinicId=${clinicId}`
            );

            console.log("Users Response:", response);

            const usersData =
                response?.data?.data ||
                response?.data ||
                [];

            setUsers(usersData);
        } catch (error) {
            console.error(error);

            enqueueSnackbar("Failed to load users", {
                variant: "error",
            });

            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchClinics = useCallback(async () => {
        if (!canManageMultipleClinics) {
            setClinics([]);
            return;
        }

        try {
            const response = await HttpService.getWithAuth("/clinics?limit=100");
            setClinics(Array.isArray(response) ? response : response?.data || []);
        } catch (error) {
            console.error(error);
            enqueueSnackbar("Failed to load clinics", {
                variant: "error",
            });
            setClinics([]);
        }
    }, [canManageMultipleClinics, enqueueSnackbar]);

    useEffect(() => {
        if (clinicId) {
            fetchUsers();
        }
    }, [clinicId, fetchUsers]);

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    // Add User
    const handleAddUser = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    // Edit User
    const handleEditUser = (user) => {
        setEditingUser(user);

        setFormData({
            username: user.username || "",
            email: user.email || "",
            password: "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            role: user.role || "STAFF",
            clinicIds: user.clinicIds?.length ? user.clinicIds : (user.clinicId ? [user.clinicId] : [clinicId]),
        });

        setIsModalOpen(true);
    };

    // Save User
    const handleSaveUser = async () => {
        try {
            if (
                !formData.email ||
                !formData.firstName ||
                !formData.role
            ) {
                enqueueSnackbar(
                    "Email, first name and role are required",
                    {
                        variant: "error",
                    }
                );

                return;
            }

            if (canManageMultipleClinics && formData.clinicIds.length === 0) {
                enqueueSnackbar(
                    "Select at least one clinic",
                    {
                        variant: "error",
                    }
                );

                return;
            }

            if (editingUser) {
                // UPDATE USER
                const updateData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    role: formData.role,
                    clinicId: formData.clinicIds[0] || clinicId,
                    clinicIds: formData.clinicIds,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await HttpService.putWithAuth(
                    `/users/${editingUser.id}`,
                    updateData
                );

                enqueueSnackbar(
                    "User updated successfully",
                    {
                        variant: "success",
                    }
                );
            } else {
                // CREATE USER
                if (
                    !formData.username ||
                    !formData.password
                ) {
                    enqueueSnackbar(
                        "Username and password are required",
                        {
                            variant: "error",
                        }
                    );

                    return;
                }

                const createData = {
                    ...formData,
                    clinicId: formData.clinicIds[0] || clinicId,
                    clinicIds: formData.clinicIds,
                };

                await HttpService.postWithAuth(
                    "/users",
                    createData
                );

                enqueueSnackbar(
                    "User created successfully",
                    {
                        variant: "success",
                    }
                );
            }

            setIsModalOpen(false);
            setEditingUser(null);
            setFormData(initialFormState);

            fetchUsers();
        } catch (error) {
            console.error(error);

            // Handle validation errors with field details
            if (error?.response?.data?.code === 'VALIDATION_ERROR' && error?.response?.data?.errors) {
                const validationErrors = error.response.data.errors;

                // Show all errors at once
                if (validationErrors.length === 1) {
                    // Single error
                    enqueueSnackbar(
                        `${validationErrors[0].field}: ${validationErrors[0].message}`,
                        {
                            variant: "error",
                            autoHideDuration: 6000,
                        }
                    );
                } else {
                    // Multiple errors - show first few
                    const errorSummary = validationErrors
                        .slice(0, 3)
                        .map(err => `• ${err.field}: ${err.message}`)
                        .join(' | ');

                    const fullMessage = validationErrors.length > 3
                        ? `${errorSummary} and ${validationErrors.length - 3} more errors`
                        : errorSummary;

                    enqueueSnackbar(
                        fullMessage,
                        {
                            variant: "error",
                            autoHideDuration: 7000,
                        }
                    );
                }
            } else {
                enqueueSnackbar(
                    error?.response?.data?.message ||
                    "Failed to save user",
                    {
                        variant: "error",
                    }
                );
            }
        }
    };

    // Delete User
    const handleDeleteUser = async (id) => {
        const confirmDelete = window.confirm(
            "Delete this user?"
        );

        if (!confirmDelete) return;

        try {
            await HttpService.deleteWithAuth(
                `/users/${id}`
            );

            enqueueSnackbar(
                "User deleted successfully",
                {
                    variant: "success",
                }
            );

            fetchUsers();
        } catch (error) {
            console.error(error);

            enqueueSnackbar(
                error?.response?.data?.message ||
                "Failed to delete user",
                {
                    variant: "error",
                }
            );
        }
    };

    // Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleClinicToggle = (selectedClinicId) => {
        setFormData((prev) => ({
            ...prev,
            clinicIds: prev.clinicIds.includes(selectedClinicId)
                ? prev.clinicIds.filter((id) => id !== selectedClinicId)
                : [...prev.clinicIds, selectedClinicId],
        }));
    };

    const getUserClinicNames = (user) => {
        if (user.clinics?.length) {
            return user.clinics.map((clinic) => clinic.clinicName).join(", ");
        }

        if (user.clinicId) {
            return clinics.find((clinic) => clinic.id === user.clinicId)?.clinicName || "Current clinic";
        }

        return "N/A";
    };

    if (!clinicId) {
        return <div>No clinic selected</div>;
    }

    return (
        <div className="user-management">
            <div className="user-management-container">
                <div className="user-management-content">

                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1>User Management</h1>
                            <p>
                                Add and manage clinic users
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleAddUser}
                        >
                            ➕ Add User
                        </button>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <p>Loading users...</p>
                    ) : users.length === 0 ? (
                        <div className="no-data">
                            <p>No users found</p>

                            <button
                                className="btn btn-primary"
                                onClick={handleAddUser}
                            >
                                Add First User
                            </button>
                        </div>
                    ) : (
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Username</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Clinics</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                {user.firstName}{" "}
                                                {user.lastName}
                                            </td>

                                            <td>
                                                {user.email}
                                            </td>

                                            <td>
                                                {user.username}
                                            </td>

                                            <td>
                                                {user.phoneNumber ||
                                                    "N/A"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge role-${user.role?.toLowerCase()}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td title={getUserClinicNames(user)}>
                                                {getUserClinicNames(user)}
                                            </td>

                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() =>
                                                        handleEditUser(
                                                            user
                                                        )
                                                    }
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    className="btn-action delete"
                                                    onClick={() =>
                                                        handleDeleteUser(
                                                            user.id
                                                        )
                                                    }
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modal */}
                    {isModalOpen && (
                        <div
                            className="modal-overlay"
                            onClick={() =>
                                setIsModalOpen(false)
                            }
                        >
                            <div
                                className="modal"
                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                            >
                                <div className="modal-header">
                                    <h2>
                                        {editingUser
                                            ? "Edit User"
                                            : "Add User"}
                                    </h2>

                                    <button
                                        className="close-btn"
                                        onClick={() =>
                                            setIsModalOpen(false)
                                        }
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="modal-body">

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>
                                                First Name *
                                            </label>

                                            <input
                                                type="text"
                                                name="firstName"
                                                value={
                                                    formData.firstName
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Last Name
                                            </label>

                                            <input
                                                type="text"
                                                name="lastName"
                                                value={
                                                    formData.lastName
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Email *</label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            disabled={
                                                editingUser
                                            }
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>
                                                    Username *
                                                </label>

                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={
                                                        formData.username
                                                    }
                                                    onChange={
                                                        handleInputChange
                                                    }
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    Password *
                                                </label>

                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={
                                                        formData.password
                                                    }
                                                    onChange={
                                                        handleInputChange
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {editingUser && (
                                        <div className="form-group">
                                            <label>
                                                New Password
                                            </label>

                                            <input
                                                type="password"
                                                name="password"
                                                value={
                                                    formData.password
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                                placeholder="Leave blank to keep current password"
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>
                                            Phone Number
                                        </label>

                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={
                                                formData.phoneNumber
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Role *</label>

                                        <select
                                            name="role"
                                            value={
                                                formData.role
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        >
                                            <option value="ADMIN">
                                                ADMIN
                                            </option>

                                            <option value="VET">
                                                VET
                                            </option>

                                            <option value="GROOMER">
                                                GROOMER
                                            </option>

                                            <option value="RECEPTIONIST">
                                                RECEPTIONIST
                                            </option>

                                            <option value="PHARMACIST">
                                                PHARMACIST
                                            </option>

                                            <option value="STAFF">
                                                STAFF
                                            </option>
                                        </select>
                                    </div>

                                    {canManageMultipleClinics && (
                                        <div className="form-group">
                                            <label>
                                                Assign to Clinics
                                            </label>

                                            <div className="clinic-checkbox-list">
                                                {clinics.map((clinic) => (
                                                    <label
                                                        className="clinic-checkbox-option"
                                                        key={clinic.id}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.clinicIds.includes(clinic.id)}
                                                            onChange={() => handleClinicToggle(clinic.id)}
                                                        />

                                                        <span>
                                                            {clinic.clinicName} ({clinic.clinicCode})
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>

                                            {formData.clinicIds.length === 0 && (
                                                <p className="field-hint">
                                                    Select at least one clinic.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setIsModalOpen(false)
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={
                                            handleSaveUser
                                        }
                                    >
                                        {editingUser
                                            ? "Update User"
                                            : "Create User"}
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

export default UserManagement;
