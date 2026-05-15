import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./customers.css";

const Customers = ({ clinicId: propClinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { state: clinicState } = useContext(ClinicContext);

    // Use prop clinicId if provided, otherwise use context clinic ID
    const clinicId = propClinicId || clinicState?.selectedClinicId;

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    const initialFormState = {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        pets: [],
    };

    const initialPetState = {
        name: "",
        species: "",
        gender: "",
        colour: "",
        breed: "",
        age: "",
        weight: "",
        medicalNotes: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Customers
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/customers?limit=100`
            );

            // Handle response format
            const data = response?.data || response || [];
            const customers = Array.isArray(data) ? data : data.data || [];

            console.log("Customers loaded:", customers);
            setCustomers(customers);
        } catch (error) {
            console.error("Error loading customers:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to load customers";

            enqueueSnackbar(errorMsg, {
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // Load Customers
    useEffect(() => {
        if (clinicId) {
            fetchCustomers();
        }
    }, [clinicId, fetchCustomers]);

    // Open Add Modal
    const handleAddCustomer = () => {
        setEditingCustomer(null);
        setEditingCustomerId(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    // Open Edit Modal
    const handleEditCustomer = (customer) => {
        const customerId = customer.id || customer._id;

        setEditingCustomer(customer);
        setEditingCustomerId(customerId);

        setFormData({
            firstName: customer.firstName || "",
            lastName: customer.lastName || "",
            email: customer.email || "",
            phoneNumber: customer.phoneNumber || "",
            address: customer.address || "",
            city: customer.city || "",
            state: customer.state || "",
            zipCode: customer.zipCode || "",
            country: customer.country || "",
            pets: [], // Don't edit pets in customer form
        });

        setIsModalOpen(true);
    };

    // Add Pet to Form
    const handleAddPetToForm = () => {
        setFormData((prev) => ({
            ...prev,
            pets: [...prev.pets, { ...initialPetState }],
        }));
    };

    // Remove Pet from Form
    const handleRemovePetFromForm = (index) => {
        setFormData((prev) => ({
            ...prev,
            pets: prev.pets.filter((_, i) => i !== index),
        }));
    };

    // Update Pet Field
    const handlePetFieldChange = (index, field, value) => {
        setFormData((prev) => {
            const updatedPets = [...prev.pets];
            updatedPets[index] = {
                ...updatedPets[index],
                [field]: value,
            };
            return {
                ...prev,
                pets: updatedPets,
            };
        });
    };

    // Save Customer
    const handleSaveCustomer = async () => {
        try {
            if (
                !formData.firstName ||
                !formData.lastName ||
                !formData.phoneNumber
            ) {
                enqueueSnackbar(
                    "First name, last name and phone number are required",
                    {
                        variant: "error",
                    }
                );

                return;
            }

            // Validate pets if any
            const validPets = formData.pets.every((pet) => {
                if (pet.name && pet.species) return true;
                if (!pet.name && !pet.species && !pet.gender && !pet.colour) return true; // Empty pet is ok
                return false;
            });

            if (!validPets) {
                enqueueSnackbar(
                    "Each pet must have at least a name and species",
                    {
                        variant: "error",
                    }
                );
                return;
            }

            // Prepare data - only include non-empty pets
            const submittedData = {
                ...formData,
                pets: formData.pets.filter((pet) => pet.name && pet.species),
            };

            if (editingCustomer) {
                if (!editingCustomerId) {
                    enqueueSnackbar("Customer ID is missing", {
                        variant: "error",
                    });

                    return;
                }

                // For update, don't include pets (use separate API)
                const { pets, ...customerData } = submittedData;

                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/customers/${editingCustomerId}`,
                    customerData
                );

                enqueueSnackbar("Customer updated successfully", {
                    variant: "success",
                });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/customers`,
                    submittedData
                );

                enqueueSnackbar("Customer created successfully", {
                    variant: "success",
                });
            }

            setIsModalOpen(false);
            setFormData(initialFormState);
            setEditingCustomer(null);
            setEditingCustomerId(null);

            fetchCustomers();
        } catch (error) {
            console.error("Error saving customer:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to save customer";

            enqueueSnackbar(errorMsg, {
                variant: "error",
            });
        }
    };

    // Delete Customer
    const handleDeleteCustomer = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this customer? (This will also delete associated pets)"
        );

        if (!confirmDelete) return;

        try {
            await HttpService.deleteWithAuth(
                `/clinics/${clinicId}/customers/${id}`
            );

            enqueueSnackbar("Customer deleted successfully", {
                variant: "success",
            });

            fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to delete customer";

            enqueueSnackbar(errorMsg, {
                variant: "error",
            });
        }
    };

    // View Customer Details
    const handleViewCustomer = (customer) => {
        const customerId = customer.id || customer._id;
        console.log("Viewing customer:", customer);

        // Could open a detail view modal or navigate to detail page
    };

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // No Clinic Selected
    if (!clinicId) {
        return (
            <div className="customers">
                <div className="customers-container">
                    <div className="customers-content">
                        <p>No clinic selected</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="customers">
            <div className="customers-container">
                <div className="customers-content">

                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1>Clients</h1>
                            <p>Manage your clinic customers and their pets</p>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleAddCustomer}
                        >
                            + Add Client
                        </button>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <p>Loading customers...</p>
                    ) : (
                        <div className="customers-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                        <th>Pets</th>
                                        <th>Created</th>
                                        <th className="center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {customers.length > 0 ? (
                                        customers.map((customer) => {
                                            const customerId = customer.id || customer._id;
                                            const petCount = customer.pets?.length || customer._count?.pets || 0;
                                            const createdDate = customer.createdAt
                                                ? new Date(customer.createdAt).toLocaleDateString()
                                                : "-";

                                            return (
                                                <tr key={customerId}>
                                                    <td>
                                                        <strong>{customer.code || "-"}</strong>
                                                    </td>

                                                    <td>
                                                        {customer.firstName} {customer.lastName}
                                                    </td>

                                                    <td>
                                                        {customer.phoneNumber || "-"}
                                                    </td>

                                                    <td>
                                                        {customer.email || "-"}
                                                    </td>

                                                    <td className="center">
                                                        <span className="badge">{petCount}</span>
                                                    </td>

                                                    <td>{createdDate}</td>

                                                    <td className="actions">
                                                        <button
                                                            className="btn-action view"
                                                            onClick={() =>
                                                                handleViewCustomer(customer)
                                                            }
                                                            title="View Details"
                                                        >
                                                            👁️
                                                        </button>

                                                        <button
                                                            className="btn-action edit"
                                                            onClick={() =>
                                                                handleEditCustomer(
                                                                    customer
                                                                )
                                                            }
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>

                                                        <button
                                                            className="btn-action delete"
                                                            onClick={() =>
                                                                handleDeleteCustomer(
                                                                    customerId
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="center"
                                            >
                                                No customers found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal modal-large">

                        {/* Header */}
                        <div className="modal-header">
                            <h2>
                                {editingCustomer
                                    ? "Edit Customer"
                                    : "Add New Customer"}
                            </h2>

                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            <div className="form-section">
                                <h3>Customer Information</h3>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>

                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            placeholder="Enter first name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Last Name *</label>

                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email</label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter email"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number *</label>

                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Address</label>

                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Enter address"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City</label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="Enter city"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>State</label>

                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            placeholder="Enter state"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Zip Code</label>

                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            placeholder="Enter zip code"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Country</label>

                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        placeholder="Enter country"
                                    />
                                </div>
                            </div>

                            {/* Pets Section - only show when creating new customer */}
                            {!editingCustomer && (
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Pets</h3>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={handleAddPetToForm}
                                        >
                                            + Add Pet
                                        </button>
                                    </div>

                                    {formData.pets.length === 0 ? (
                                        <p className="empty-message">No pets added yet</p>
                                    ) : (
                                        formData.pets.map((pet, index) => (
                                            <div key={index} className="pet-form-card">
                                                <div className="pet-card-header">
                                                    <h4>Pet {index + 1}</h4>
                                                    <button
                                                        className="btn-remove"
                                                        onClick={() => handleRemovePetFromForm(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Pet Name *</label>
                                                        <input
                                                            type="text"
                                                            value={pet.name}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "name", e.target.value)
                                                            }
                                                            placeholder="Enter pet name"
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Species *</label>
                                                        <select
                                                            value={pet.species}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "species", e.target.value)
                                                            }
                                                        >
                                                            <option value="">Select species</option>
                                                            <option value="Dog">Dog</option>
                                                            <option value="Cat">Cat</option>
                                                            <option value="Bird">Bird</option>
                                                            <option value="Rabbit">Rabbit</option>
                                                            <option value="Hamster">Hamster</option>
                                                            <option value="Guinea Pig">Guinea Pig</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Gender</label>
                                                        <select
                                                            value={pet.gender}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "gender", e.target.value)
                                                            }
                                                        >
                                                            <option value="">Select gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Unknown">Unknown</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Colour</label>
                                                        <input
                                                            type="text"
                                                            value={pet.colour}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "colour", e.target.value)
                                                            }
                                                            placeholder="e.g., Brown, Black, White"
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Breed</label>
                                                        <input
                                                            type="text"
                                                            value={pet.breed}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "breed", e.target.value)
                                                            }
                                                            placeholder="Enter breed"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Age (months)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={pet.age}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "age", e.target.value)
                                                            }
                                                            placeholder="Age in months"
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Weight (kg)</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            value={pet.weight}
                                                            onChange={(e) =>
                                                                handlePetFieldChange(index, "weight", e.target.value)
                                                            }
                                                            placeholder="Weight in kg"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Medical Notes</label>
                                                    <textarea
                                                        value={pet.medicalNotes}
                                                        onChange={(e) =>
                                                            handlePetFieldChange(index, "medicalNotes", e.target.value)
                                                        }
                                                        placeholder="Any medical notes or allergies"
                                                        rows="3"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleSaveCustomer}
                            >
                                {editingCustomer
                                    ? "Update Customer"
                                    : "Create Customer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;