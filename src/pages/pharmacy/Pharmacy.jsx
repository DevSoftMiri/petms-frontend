import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./pharmacy.css";

const Pharmacy = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [formData, setFormData] = useState({
        medicineName: "",
        dosage: "",
        unitPrice: 0,
        quantity: 0,
        supplier: "",
        expiryDate: "",
        category: "Other",
        description: "",
    });

    const fetchMedicines = useCallback(async () => {
        try {
            setLoading(true);
            // Use supplies endpoint instead of pharmacy for medicine inventory
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/supplies`
            );
            const data = Array.isArray(response) ? response : response.data || [];
            // Map supply fields to medicine fields for compatibility
            const medicines = data.map(item => ({
                ...item,
                medicineName: item.name,
                unitPrice: item.cost || 0,
                expiryDate: item.expiryDate,
            }));
            setMedicines(medicines);
        } catch (error) {
            console.error("Error loading medicines:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to load medicines";
            enqueueSnackbar(errorMsg, { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (clinicId) fetchMedicines();
    }, [clinicId, fetchMedicines]);

    const handleAddMedicine = () => {
        setEditingMedicine(null);
        setFormData({
            medicineName: "",
            dosage: "",
            unitPrice: 0,
            quantity: 0,
            supplier: "",
            expiryDate: "",
            category: "Other",
            description: "",
        });
        setIsModalOpen(true);
    };

    const handleEditMedicine = (medicine) => {
        setEditingMedicine(medicine);
        // Format date for input field: convert ISO to yyyy-MM-dd
        const formattedDate = medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : "";
        setFormData({
            ...medicine,
            expiryDate: formattedDate,
        });
        setIsModalOpen(true);
    };

    const handleSaveMedicine = async () => {
        try {
            if (!formData.medicineName || !formData.unitPrice || !formData.quantity) {
                enqueueSnackbar("Medicine name, price, and quantity are required", { variant: "error" });
                return;
            }

            if (editingMedicine) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/supplies/${editingMedicine.id || editingMedicine._id}`,
                    {
                        name: formData.medicineName,
                        dosage: formData.dosage,
                        quantity: parseInt(formData.quantity) || 0,
                        supplier: formData.supplier,
                        expiryDate: formData.expiryDate,
                        category: formData.category,
                        description: formData.description,
                    }
                );
                enqueueSnackbar("Medicine updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/supplies`,
                    {
                        name: formData.medicineName,
                        dosage: formData.dosage,
                        quantity: parseInt(formData.quantity) || 0,
                        supplier: formData.supplier,
                        expiryDate: formData.expiryDate,
                        category: formData.category,
                        description: formData.description,
                    }
                );
                enqueueSnackbar("Medicine created", { variant: "success" });
            }

            setIsModalOpen(false);
            fetchMedicines();
        } catch (error) {
            console.error("Error saving medicine:", error);
            enqueueSnackbar("Failed to save medicine", { variant: "error" });
        }
    };

    const handleDeleteMedicine = (id) => {
        if (!window.confirm("Delete this medicine?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/supplies/${id}`)
            .then(() => {
                enqueueSnackbar("Medicine deleted", { variant: "success" });
                fetchMedicines();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="pharmacy">
            <div className="pharmacy-container">
                <div className="pharmacy-content">
                    <div className="page-header">
                        <div>
                            <h1>Pharmacy</h1>
                            <p>Manage medicines and inventory</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleAddMedicine}>
                            ➕ Add Medicine
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="pharmacy-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Dosage</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Supplier</th>
                                        <th>Category</th>
                                        <th>Expiry Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicines.map((medicine) => (
                                        <tr key={medicine.id}>
                                            <td>{medicine.medicineName}</td>
                                            <td>{medicine.dosage}</td>
                                            <td>₹{medicine.unitPrice?.toFixed(2)}</td>
                                            <td>{medicine.quantity}</td>
                                            <td>{medicine.supplier}</td>
                                            <td>{medicine.category}</td>
                                            <td>{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : "N/A"}</td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditMedicine(medicine)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteMedicine(medicine.id)}
                                                    title="Delete"
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

                    {isModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h2>
                                    <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Medicine Name *</label>
                                        <input
                                            type="text"
                                            name="medicineName"
                                            placeholder="Enter medicine name"
                                            value={formData.medicineName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange}>
                                            <option key="Other" value="Other">Other</option>
                                            <option key="Antibiotic" value="Antibiotic">Antibiotic</option>
                                            <option key="Painkiller" value="Painkiller">Painkiller</option>
                                            <option key="Vaccine" value="Vaccine">Vaccine</option>
                                            <option key="Supplement" value="Supplement">Supplement</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Dosage</label>
                                        <input
                                            type="text"
                                            name="dosage"
                                            placeholder="Enter dosage (e.g., 250mg)"
                                            value={formData.dosage}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            placeholder="Enter description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Unit Price *</label>
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                placeholder="Enter price"
                                                value={formData.unitPrice}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Quantity *</label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                placeholder="Enter quantity"
                                                value={formData.quantity}
                                                onChange={handleInputChange}
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Supplier</label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            placeholder="Enter supplier name"
                                            value={formData.supplier}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveMedicine}>
                                        {editingMedicine ? "Update Medicine" : "Add Medicine"}
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

export default Pharmacy;
