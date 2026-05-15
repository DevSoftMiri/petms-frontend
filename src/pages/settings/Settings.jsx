import React, { useState } from "react";
// import Navbar from "../../components/navbar/Navbar";
// import Sidebar from "../../components/sidebar/Sidebar";
import "./settings.css";

const Settings = () => {
    const [users, setUsers] = useState([
        {
            id: 1,
            name: "John Admin",
            email: "john@admin.com",
            phone: "123-456-7890",
            role: "Super Admin",
            department: "Management",
            status: "Active",
            joinDate: "2023-01-15",
            permissions: ["All Access"],
        },
        {
            id: 2,
            name: "Sarah Manager",
            email: "sarah@manager.com",
            phone: "098-765-4321",
            role: "Manager",
            department: "Operations",
            status: "Active",
            joinDate: "2023-03-20",
            permissions: ["User Management", "Report Access"],
        },
        {
            id: 3,
            name: "Mike Staff",
            email: "mike@staff.com",
            phone: "555-123-4567",
            role: "Staff",
            department: "Customer Service",
            status: "Active",
            joinDate: "2023-05-10",
            permissions: ["View Reports"],
        },
        {
            id: 4,
            name: "Emma Veterinarian",
            email: "emma@vet.com",
            phone: "555-987-6543",
            role: "Veterinarian",
            department: "Medical",
            status: "Active",
            joinDate: "2023-07-05",
            permissions: ["Patient Records", "Prescriptions", "Reports"],
        },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState("users");

    const ROLES = [
        {
            value: "Super Admin",
            label: "Super Admin",
            description: "Full system access",
            permissions: ["All Access"],
        },
        {
            value: "Admin",
            label: "Admin",
            description: "Administrative access",
            permissions: ["User Management", "Report Access", "Settings"],
        },
        {
            value: "Manager",
            label: "Manager",
            description: "Management level access",
            permissions: ["User Management", "Report Access", "View Analytics"],
        },
        {
            value: "Veterinarian",
            label: "Veterinarian",
            description: "Medical professional",
            permissions: ["Patient Records", "Prescriptions", "Reports"],
        },
        {
            value: "Staff",
            label: "Staff",
            description: "Basic staff access",
            permissions: ["View Reports", "Create Appointments"],
        },
        {
            value: "Receptionist",
            label: "Receptionist",
            description: "Reception desk access",
            permissions: ["Create Appointments", "Customer Info"],
        },
    ];

    const DEPARTMENTS = [
        "Management",
        "Operations",
        "Medical",
        "Customer Service",
        "Finance",
        "Human Resources",
    ];

    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({});
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(users.filter((u) => u.id !== id));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({});
    };

    const handleSaveUser = () => {
        if (!formData.name || !formData.email) {
            alert("Please fill in all required fields");
            return;
        }

        if (editingUser) {
            setUsers(
                users.map((u) =>
                    u.id === editingUser.id ? { ...u, ...formData } : u
                )
            );
        } else {
            setUsers([
                ...users,
                { id: Math.max(...users.map((u) => u.id), 0) + 1, ...formData },
            ]);
        }
        handleCloseModal();
    };

    const handleFormChange = (field, value) => {
        if (field === "role") {
            const selectedRole = ROLES.find((r) => r.value === value);
            setFormData({
                ...formData,
                role: value,
                permissions: selectedRole?.permissions || [],
            });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "Super Admin":
                return "role-super-admin";
            case "Admin":
                return "role-admin";
            case "Manager":
                return "role-manager";
            case "Veterinarian":
                return "role-veterinarian";
            case "Staff":
                return "role-staff";
            case "Receptionist":
                return "role-receptionist";
            default:
                return "role-default";
        }
    };

    const activeUsers = users.filter((u) => u.status === "Active").length;
    const superAdmins = users.filter((u) => u.role === "Super Admin").length;
    const managers = users.filter((u) => u.role === "Manager").length;

    return (
        <div className="settings">
            {/* <Sidebar /> */}
            <div className="settings-container">
                {/* <Navbar /> */}

                <div className="settings-content">
                    <div className="page-header">
                        <div>
                            <h1>Settings & User Management</h1>
                            <p>Manage users, roles, and permissions</p>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="stats-container">
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <h3>{users.length}</h3>
                                <p>Total Users</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <h3>{activeUsers}</h3>
                                <p>Active Users</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👑</div>
                            <div className="stat-info">
                                <h3>{superAdmins}</h3>
                                <p>Super Admins</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                                <h3>{managers}</h3>
                                <p>Managers</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tab-container">
                        <button
                            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                            onClick={() => setActiveTab("users")}
                        >
                            👥 User Management
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "roles" ? "active" : ""}`}
                            onClick={() => setActiveTab("roles")}
                        >
                            🔐 Roles & Permissions
                        </button>
                    </div>

                    {/* Users Tab */}
                    {activeTab === "users" && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>User Directory</h2>
                                <button className="btn btn-primary" onClick={handleAddUser}>
                                    ➕ Add New User
                                </button>
                            </div>

                            <div className="users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th>Department</th>
                                            <th>Status</th>
                                            <th>Join Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td className="user-name">
                                                    <strong>{user.name}</strong>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>{user.phone}</td>
                                                <td>
                                                    <span className={`role-badge ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>{user.department}</td>
                                                <td>
                                                    <span
                                                        className={`status ${user.status.toLowerCase()}`}
                                                    >
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td>{user.joinDate}</td>
                                                <td className="actions">
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => handleEditUser(user)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {user.role !== "Super Admin" && (
                                                        <button
                                                            className="btn-action delete"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            title="Delete"
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
                        </div>
                    )}

                    {/* Roles Tab */}
                    {activeTab === "roles" && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>Roles & Permissions</h2>
                            </div>

                            <div className="roles-grid">
                                {ROLES.map((role) => (
                                    <div key={role.value} className="role-card">
                                        <div className={`role-card-header ${getRoleColor(role.value)}`}>
                                            <h3>{role.label}</h3>
                                            <p>{role.description}</p>
                                        </div>
                                        <div className="role-card-body">
                                            <h4>Permissions:</h4>
                                            <ul>
                                                {role.permissions.map((perm, idx) => (
                                                    <li key={idx}>✓ {perm}</li>
                                                ))}
                                            </ul>
                                            <p className="user-count">
                                                Users: {users.filter((u) => u.role === role.value).length}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Modal */}
                    {isModalOpen && (
                        <div className="modal-overlay" onClick={handleCloseModal}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>
                                        {editingUser ? "Edit User" : "Add New User"}
                                    </h2>
                                    <button className="close-btn" onClick={handleCloseModal}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input
                                                type="text"
                                                placeholder="Enter full name"
                                                value={formData.name || ""}
                                                onChange={(e) =>
                                                    handleFormChange("name", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                value={formData.email || ""}
                                                onChange={(e) =>
                                                    handleFormChange("email", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                value={formData.phone || ""}
                                                onChange={(e) =>
                                                    handleFormChange("phone", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select
                                                value={formData.status || "Active"}
                                                onChange={(e) =>
                                                    handleFormChange("status", e.target.value)
                                                }
                                            >
                                                <option>Active</option>
                                                <option>Inactive</option>
                                                <option>Suspended</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Role *</label>
                                            <select
                                                value={formData.role || "Staff"}
                                                onChange={(e) =>
                                                    handleFormChange("role", e.target.value)
                                                }
                                            >
                                                {ROLES.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label} - {role.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Department</label>
                                            <select
                                                value={formData.department || ""}
                                                onChange={(e) =>
                                                    handleFormChange("department", e.target.value)
                                                }
                                            >
                                                <option value="">Select Department</option>
                                                {DEPARTMENTS.map((dept) => (
                                                    <option key={dept} value={dept}>
                                                        {dept}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Assigned Permissions</label>
                                        <div className="permissions-box">
                                            {(formData.permissions || []).map((perm, idx) => (
                                                <span key={idx} className="permission-tag">
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveUser}>
                                        Save User
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
