import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./grooming.css";

const Grooming = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [groomings, setGroomings] = useState([]);
    const [pets, setPets] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGrooming, setEditingGrooming] = useState(null);

    const [formData, setFormData] = useState({
        petId: "",
        services: [],
        groomingDate: "",
        groomerId: "",
        cost: "",
        notes: "",
    });

    const fetchGroomings = useCallback(async () => {
        try {
            setLoading(true);

            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/grooming`
            );

            const data = Array.isArray(response)
                ? response
                : response.data || [];

            setGroomings(data);
        } catch (error) {
            console.error("Error fetching grooming records:", error);
            enqueueSnackbar("Failed to load grooming records", {
                variant: "error",
            });
            setGroomings([]);
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchPets = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/pets`
            );

            const data = Array.isArray(response)
                ? response
                : response.data || [];

            setPets(data);
        } catch (error) {
            console.error("Error fetching pets:", error);
        }
    }, [clinicId]);

    const fetchStaff = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth(
                `/users?clinicId=${clinicId}`
            );

            const data = Array.isArray(response)
                ? response
                : response.data || [];

            // Only show GROOMER role
            const filteredStaff = data.filter((user) =>
                user.role === "GROOMER"
            );

            setStaff(filteredStaff);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    }, [clinicId]);

    useEffect(() => {
        if (clinicId) {
            fetchGroomings();
            fetchPets();
            fetchStaff();
        }
    }, [clinicId, fetchGroomings, fetchPets, fetchStaff]);

    const resetForm = () => {
        setFormData({
            petId: "",
            services: [],
            groomingDate: "",
            groomerId: "",
            cost: "",
            notes: "",
        });
    };

    const handleAddGrooming = () => {
        setEditingGrooming(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditGrooming = (grooming) => {
        setEditingGrooming(grooming);

        const formattedDate = grooming.groomingDate
            ? new Date(grooming.groomingDate)
                .toISOString()
                .slice(0, 16)
            : "";

        let parsedServices = [];

        try {
            parsedServices =
                typeof grooming.services === "string"
                    ? JSON.parse(grooming.services)
                    : grooming.services || [];
        } catch (error) {
            parsedServices = [];
        }

        setFormData({
            petId: grooming.petId || "",
            services: parsedServices,
            groomingDate: formattedDate,
            groomerId: grooming.groomerId || "",
            cost: grooming.cost || "",
            notes: grooming.notes || "",
        });

        setIsModalOpen(true);
    };

    const handleSaveGrooming = async () => {
        try {
            if (
                !formData.petId ||
                !formData.groomingDate ||
                formData.services.length === 0
            ) {
                enqueueSnackbar(
                    "Pet, service and grooming date are required",
                    {
                        variant: "error",
                    }
                );
                return;
            }

            const payload = {
                petId: formData.petId,
                groomerId: formData.groomerId || null,
                services: JSON.stringify(formData.services),
                groomingDate: formData.groomingDate,
                cost: parseFloat(formData.cost) || 0,
                notes: formData.notes,
            };

            if (editingGrooming) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/grooming/${editingGrooming.id}`,
                    payload
                );

                enqueueSnackbar("Grooming updated successfully", {
                    variant: "success",
                });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/grooming`,
                    payload
                );

                enqueueSnackbar("Grooming created successfully", {
                    variant: "success",
                });
            }

            setIsModalOpen(false);
            resetForm();
            fetchGroomings();
        } catch (error) {
            console.error("Error saving grooming:", error);

            const errorMessage =
                error.response?.data?.message ||
                "Failed to save grooming";

            enqueueSnackbar(errorMessage, {
                variant: "error",
            });
        }
    };

    const handleDeleteGrooming = async (id) => {
        const confirmDelete = window.confirm(
            "Delete this grooming record?"
        );

        if (!confirmDelete) return;

        try {
            await HttpService.deleteWithAuth(
                `/clinics/${clinicId}/grooming/${id}`
            );

            enqueueSnackbar("Grooming deleted successfully", {
                variant: "success",
            });

            fetchGroomings();
        } catch (error) {
            console.error("Error deleting grooming:", error);

            enqueueSnackbar("Failed to delete grooming", {
                variant: "error",
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (!clinicId) {
        return <div>No clinic selected</div>;
    }

    return (
        <div className="grooming">
            <div className="grooming-container">
                <div className="grooming-content">
                    <div className="page-header">
                        <div>
                            <h1>Grooming Services</h1>
                            <p>
                                Manage grooming appointments and services
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleAddGrooming}
                        >
                            ➕ Add Grooming
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading grooming records...</p>
                    ) : groomings.length === 0 ? (
                        <div className="no-data">
                            <p>No grooming records found.</p>

                            <button
                                className="btn btn-primary"
                                onClick={handleAddGrooming}
                            >
                                Add First Grooming
                            </button>
                        </div>
                    ) : (
                        <div className="grooming-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Pet</th>
                                        <th>Services</th>
                                        <th>Groomer</th>
                                        <th>Date</th>
                                        <th>Cost</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {groomings.map((grooming) => {
                                        let services = [];

                                        try {
                                            services =
                                                typeof grooming.services ===
                                                    "string"
                                                    ? JSON.parse(
                                                        grooming.services
                                                    )
                                                    : grooming.services || [];
                                        } catch (error) {
                                            services = [];
                                        }

                                        return (
                                            <tr key={grooming.id}>
                                                <td>
                                                    {grooming.pet?.name ||
                                                        "N/A"}
                                                </td>

                                                <td>
                                                    {Array.isArray(services) ? services.join(", ") : "N/A"}
                                                </td>

                                                <td>
                                                    {grooming.groomer
                                                        ? `${grooming.groomer.firstName || ""} ${grooming.groomer
                                                            .lastName ||
                                                        ""
                                                        }`
                                                        : "N/A"}
                                                </td>

                                                <td>
                                                    {new Date(
                                                        grooming.groomingDate
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    ₹
                                                    {Number(
                                                        grooming.cost || 0
                                                    ).toFixed(2)}
                                                </td>

                                                <td>
                                                    {grooming.notes || "N/A"}
                                                </td>

                                                <td className="actions">
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() =>
                                                            handleEditGrooming(
                                                                grooming
                                                            )
                                                        }
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() =>
                                                            handleDeleteGrooming(
                                                                grooming.id
                                                            )
                                                        }
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {isModalOpen && (
                        <div
                            className="modal-overlay"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <div
                                className="modal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <h2>
                                        {editingGrooming
                                            ? "Edit Grooming"
                                            : "Add Grooming"}
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
                                    <div className="form-group">
                                        <label>Pet *</label>

                                        <select
                                            name="petId"
                                            value={formData.petId}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">
                                                Select Pet
                                            </option>

                                            {pets.map((pet) => (
                                                <option
                                                    key={pet.id}
                                                    value={pet.id}
                                                >
                                                    {pet.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Services *</label>

                                        <div className="checkbox-group">
                                            {["Bath", "Hair Cut", "Nail Trim", "Full Grooming"].map((service) => (
                                                <label key={service} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.services.includes(service)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    services: [...prev.services, service],
                                                                }));
                                                            } else {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    services: prev.services.filter((s) => s !== service),
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                    {service}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Groomer</label>

                                        <select
                                            name="groomerId"
                                            value={formData.groomerId}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">
                                                Select Groomer
                                            </option>

                                            {staff.map((user) => (
                                                <option
                                                    key={user.id}
                                                    value={user.id}
                                                >
                                                    {user.firstName}{" "}
                                                    {user.lastName} (
                                                    {user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Grooming Date *
                                        </label>

                                        <input
                                            type="datetime-local"
                                            name="groomingDate"
                                            value={
                                                formData.groomingDate
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Cost</label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            name="cost"
                                            placeholder="Enter cost"
                                            value={formData.cost}
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Notes</label>

                                        <textarea
                                            name="notes"
                                            rows="3"
                                            placeholder="Enter notes"
                                            value={formData.notes}
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>
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
                                        onClick={handleSaveGrooming}
                                    >
                                        {editingGrooming
                                            ? "Update Grooming"
                                            : "Add Grooming"}
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

export default Grooming;