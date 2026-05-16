import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./pet.css";

const PetsList = ({ clinicId: propClinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { state: clinicState } = useContext(ClinicContext);

    const clinicId = propClinicId || clinicState?.selectedClinicId;

    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [editingPetId, setEditingPetId] = useState(null);
    const [customerFilter, setCustomerFilter] = useState("");
    const [customers, setCustomers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const initialFormState = {
        name: "",
        species: "",
        gender: "",
        colour: "",
        breed: "",
        age: "",
        weight: "",
        medicalNotes: "",
        customerId: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Customers for dropdown
    const fetchCustomers = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/customers?limit=100`
            );
            const data = response?.data || response || [];
            const customersList = Array.isArray(data) ? data : data.data || [];
            setCustomers(customersList);
        } catch (error) {
            console.error("Error loading customers:", error);
        }
    }, [clinicId]);

    // Fetch Pets
    const fetchPets = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/clinics/${clinicId}/pets?limit=100`;
            if (customerFilter) {
                url += `&search=${customerFilter}`;
            }
            const response = await HttpService.getWithAuth(url);
            const data = response?.data || response || [];
            const petsList = Array.isArray(data) ? data : data.data || [];
            setPets(petsList);
        } catch (error) {
            console.error("Error loading pets:", error);
            const errorMsg =
                error.response?.data?.message ||
                error.message ||
                "Failed to load pets";
            enqueueSnackbar(errorMsg, { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, customerFilter, enqueueSnackbar]);

    useEffect(() => {
        if (clinicId) {
            fetchCustomers();
            fetchPets();
        }
    }, [clinicId, fetchCustomers, fetchPets]);

    // Open Add Modal
    const handleAddPet = () => {
        setEditingPet(null);
        setEditingPetId(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    // Open Edit Modal
    const handleEditPet = (pet) => {
        const petId = pet.id || pet._id;
        setEditingPet(pet);
        setEditingPetId(petId);
        setFormData({
            name: pet.name || "",
            species: pet.species || "",
            gender: pet.gender || "",
            colour: pet.colour || "",
            breed: pet.breed || "",
            age: pet.age ? String(pet.age) : "",
            weight: pet.weight ? String(pet.weight) : "",
            medicalNotes: pet.medicalNotes || "",
            customerId: pet.customerId || "",
        });
        setIsModalOpen(true);
    };

    // Save Pet
    const handleSavePet = async () => {
        try {
            if (!formData.name || !formData.species) {
                enqueueSnackbar("Pet name and species are required", {
                    variant: "error",
                });
                return;
            }
            if (!editingPet && !formData.customerId) {
                enqueueSnackbar("Please select a customer", {
                    variant: "error",
                });
                return;
            }

            const submittedData = {
                name: formData.name,
                species: formData.species,
                gender: formData.gender || undefined,
                colour: formData.colour || undefined,
                breed: formData.breed || undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                medicalNotes: formData.medicalNotes || undefined,
                ...(editingPet ? {} : { customerId: formData.customerId }),
            };

            if (editingPet) {
                if (!editingPetId) {
                    enqueueSnackbar("Pet ID is missing", { variant: "error" });
                    return;
                }
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/pets/${editingPetId}`,
                    submittedData
                );
                enqueueSnackbar("Pet updated successfully", {
                    variant: "success",
                });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/pets`,
                    submittedData
                );
                enqueueSnackbar("Pet created successfully", {
                    variant: "success",
                });
            }

            setIsModalOpen(false);
            setFormData(initialFormState);
            setEditingPet(null);
            setEditingPetId(null);
            fetchPets();
        } catch (error) {
            console.error("Error saving pet:", error);
            const errorMsg =
                error.response?.data?.message ||
                error.message ||
                "Failed to save pet";
            enqueueSnackbar(errorMsg, { variant: "error" });
        }
    };

    // Delete Pet
    const handleDeletePet = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this pet?"
        );
        if (!confirmDelete) return;

        try {
            await HttpService.deleteWithAuth(`/clinics/${clinicId}/pets/${id}`);
            enqueueSnackbar("Pet deleted successfully", { variant: "success" });
            fetchPets();
        } catch (error) {
            console.error("Error deleting pet:", error);
            const errorMsg =
                error.response?.data?.message ||
                error.message ||
                "Failed to delete pet";
            enqueueSnackbar(errorMsg, { variant: "error" });
        }
    };

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Helper: resolve owner from various API shapes
    const resolveOwner = (pet) => {
        return pet.owner || pet.customer || pet.client || null;
    };

    // Helper: species icon
    const speciesIcon = (species) => {
        const map = {
            Dog: "🐶",
            Cat: "🐱",
            Bird: "🐦",
            Rabbit: "🐰",
            Hamster: "🐹",
            "Guinea Pig": "🐾",
        };
        return map[species] || "🐾";
    };

    // Helper: gender badge class
    const genderClass = (gender) => {
        if (!gender) return "";
        if (gender.toLowerCase() === "male") return "badge badge-male";
        if (gender.toLowerCase() === "female") return "badge badge-female";
        return "badge badge-unknown";
    };

    // No clinic selected — render nothing instead of an empty container
    if (!clinicId) {
        return (
            <div className="no-clinic-state">
                <div className="empty-icon">🏥</div>
                <p>No clinic selected</p>
                <small>Please select a clinic to view pets</small>
            </div>
        );
    }

    return (
        <div className="pets-list">
            <div className="pets-list-container">
                <div className="pets-list-content">

                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1>🐾 Pets</h1>
                            <p>Manage all clinic pets</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleAddPet}>
                            + Add Pet
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="filter-section">
                        <input
                            type="text"
                            placeholder="Search by pet name, species, or owner..."
                            value={customerFilter}
                            onChange={(e) => { setCustomerFilter(e.target.value); setCurrentPage(1); }}
                            className="filter-input"
                        />
                        {customerFilter && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCustomerFilter("")}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading pets...</p>
                        </div>
                    ) : (
                        <div className="pets-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Pet Name</th>
                                        <th>Owner</th>
                                        <th>Species</th>
                                        <th>Breed</th>
                                        <th>Colour</th>
                                        <th>Gender</th>
                                        <th>Created</th>
                                        <th className="center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pets.length > 0 ? (
                                        pets
                                            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                                            .map((pet) => {
                                                const petId = pet.id || pet._id;
                                                const owner = resolveOwner(pet);
                                                const ownerName = owner
                                                    ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
                                                    : "-";
                                                const ownerCode = owner?.code || owner?.customerId || null;
                                                const createdDate = pet.createdAt
                                                    ? new Date(pet.createdAt).toLocaleDateString()
                                                    : "-";

                                                return (
                                                    <tr key={petId}>
                                                        {/* Customer Code */}
                                                        <td>
                                                            {ownerCode ? (
                                                                <span className="customer-code">{ownerCode}</span>
                                                            ) : (
                                                                <span className="muted">—</span>
                                                            )}
                                                        </td>
                                                        {/* Pet Name */}
                                                        <td>
                                                            <div className="pet-name-cell">
                                                                <span className="species-icon">
                                                                    {speciesIcon(pet.species)}
                                                                </span>
                                                                <div>
                                                                    <div className="pet-name">{pet.name}</div>
                                                                    {pet.petId && (
                                                                        <div className="pet-id-sub">#{pet.petId}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Owner */}
                                                        <td>
                                                            <div className="owner-cell">
                                                                <div className="owner-name">{ownerName}</div>
                                                            </div>
                                                        </td>



                                                        {/* Species */}
                                                        <td>
                                                            <span className="species-tag">
                                                                {pet.species || "-"}
                                                            </span>
                                                        </td>

                                                        {/* Breed */}
                                                        <td>{pet.breed || <span className="muted">—</span>}</td>

                                                        {/* Colour */}
                                                        <td>
                                                            {pet.colour ? (
                                                                <div className="colour-cell">
                                                                    <span
                                                                        className="colour-dot"
                                                                        style={{ background: pet.colour.toLowerCase() }}
                                                                    ></span>
                                                                    {pet.colour}
                                                                </div>
                                                            ) : (
                                                                <span className="muted">—</span>
                                                            )}
                                                        </td>

                                                        {/* Gender */}
                                                        <td>
                                                            {pet.gender ? (
                                                                <span className={genderClass(pet.gender)}>
                                                                    {pet.gender}
                                                                </span>
                                                            ) : (
                                                                <span className="muted">—</span>
                                                            )}
                                                        </td>

                                                        {/* Created */}
                                                        <td className="date-cell">{createdDate}</td>

                                                        {/* Actions */}
                                                        <td className="actions-cell">
                                                            <button
                                                                className="btn-action edit"
                                                                onClick={() => handleEditPet(pet)}
                                                                title="Edit pet"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="btn-action delete"
                                                                onClick={() => handleDeletePet(petId)}
                                                                title="Delete pet"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="empty-state">
                                                <div>
                                                    <div className="empty-icon">🐾</div>
                                                    <p>No pets found</p>
                                                    {customerFilter && (
                                                        <small>Try clearing the search filter</small>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pets.length > 0 && (() => {
                        const totalPages = Math.ceil(pets.length / PAGE_SIZE);
                        const start = (currentPage - 1) * PAGE_SIZE + 1;
                        const end = Math.min(currentPage * PAGE_SIZE, pets.length);

                        // Build page number buttons: always show first, last, current ±1
                        const pages = [];
                        for (let i = 1; i <= totalPages; i++) {
                            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                                pages.push(i);
                            } else if (pages[pages.length - 1] !== "...") {
                                pages.push("...");
                            }
                        }

                        return (
                            <div className="pagination-bar">
                                <span className="pagination-info">
                                    Showing <strong>{start}–{end}</strong> of <strong>{pets.length}</strong> pets
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        className="page-btn arrow"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        title="First page"
                                    >«</button>
                                    <button
                                        className="page-btn arrow"
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={currentPage === 1}
                                        title="Previous page"
                                    >‹</button>

                                    {pages.map((p, i) =>
                                        p === "..." ? (
                                            <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#aaa" }}>…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                className={`page-btn${currentPage === p ? " active" : ""}`}
                                                onClick={() => setCurrentPage(p)}
                                            >{p}</button>
                                        )
                                    )}

                                    <button
                                        className="page-btn arrow"
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage === totalPages}
                                        title="Next page"
                                    >›</button>
                                    <button
                                        className="page-btn arrow"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        title="Last page"
                                    >»</button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="modal">
                        {/* Header */}
                        <div className="modal-header">
                            <h2>{editingPet ? "✏️ Edit Pet" : "🐾 Add New Pet"}</h2>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {/* Customer — only on create */}
                            {!editingPet && (
                                <div className="form-group">
                                    <label>Owner / Customer *</label>
                                    <select
                                        name="customerId"
                                        value={formData.customerId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select a customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.firstName} {customer.lastName}
                                                {customer.customerId ? ` (${customer.customerId})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Pet Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter pet name"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Species *</label>
                                    <select
                                        name="species"
                                        value={formData.species}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select species</option>
                                        <option value="Dog">🐶 Dog</option>
                                        <option value="Cat">🐱 Cat</option>
                                        <option value="Bird">🐦 Bird</option>
                                        <option value="Rabbit">🐰 Rabbit</option>
                                        <option value="Hamster">🐹 Hamster</option>
                                        <option value="Guinea Pig">🐾 Guinea Pig</option>
                                        <option value="Other">🐾 Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">♂ Male</option>
                                        <option value="Female">♀ Female</option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Colour</label>
                                    <input
                                        type="text"
                                        name="colour"
                                        value={formData.colour}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Brown, Black, White"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Breed</label>
                                    <input
                                        type="text"
                                        name="breed"
                                        value={formData.breed}
                                        onChange={handleInputChange}
                                        placeholder="Enter breed"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Age (months)</label>
                                    <input
                                        type="number"
                                        name="age"
                                        min="0"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Age in months"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        step="0.1"
                                        min="0"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        placeholder="Weight in kg"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Medical Notes</label>
                                <textarea
                                    name="medicalNotes"
                                    value={formData.medicalNotes}
                                    onChange={handleInputChange}
                                    placeholder="Any medical notes or allergies"
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSavePet}>
                                {editingPet ? "Update Pet" : "Create Pet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetsList;