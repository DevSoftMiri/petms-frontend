import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./supplies.css";

const Supplies = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState(null);
    const [formData, setFormData] = useState({
        itemName: "",
        category: "Other",
        description: "",
        quantity: 0,
        unitCost: 0,
        supplier: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
    });

    const fetchSupplies = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/supplies`
            );
            const data = Array.isArray(response) ? response : response.data || [];
            setSupplies(data);
        } catch (error) {
            enqueueSnackbar("Failed to load supplies", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (clinicId) fetchSupplies();
    }, [clinicId, fetchSupplies]);

    const handleAddSupply = () => {
        setEditingSupply(null);
        setFormData({
            itemName: "",
            category: "Other",
            description: "",
            quantity: 0,
            unitCost: 0,
            supplier: "",
            purchaseDate: new Date().toISOString().split("T")[0],
            expiryDate: "",
        });
        setIsModalOpen(true);
    };

    const handleEditSupply = (supply) => {
        setEditingSupply(supply);
        setFormData(supply);
        setIsModalOpen(true);
    };

    const handleSaveSupply = async () => {
        try {
            if (!formData.itemName || !formData.quantity || !formData.unitCost) {
                enqueueSnackbar("Item name, quantity, and unit cost are required", { variant: "error" });
                return;
            }

            if (editingSupply) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/supplies/${editingSupply._id}`,
                    formData
                );
                enqueueSnackbar("Supply updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/supplies`,
                    formData
                );
                enqueueSnackbar("Supply created", { variant: "success" });
            }

            setIsModalOpen(false);
            fetchSupplies();
        } catch {
            enqueueSnackbar("Failed to save supply", { variant: "error" });
        }
    };

    const handleDeleteSupply = (id) => {
        if (!window.confirm("Delete this supply?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/supplies/${id}`)
            .then(() => {
                enqueueSnackbar("Supply deleted", { variant: "success" });
                fetchSupplies();
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
        <div className="supplies">
            <div className="supplies-container">
                <div className="supplies-content">
                    <div className="page-header">
                        <div>
                            <h1>Supplies</h1>
                            <p>Manage clinic supplies and inventory</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleAddSupply}>
                            ➕ Add Supply
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="supplies-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Unit Cost</th>
                                        <th>Total Cost</th>
                                        <th>Supplier</th>
                                        <th>Purchase Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplies.map((supply) => (
                                        <tr key={supply._id}>
                                            <td>{supply.itemName}</td>
                                            <td>{supply.category}</td>
                                            <td>{supply.quantity}</td>
                                            <td>${supply.unitCost?.toFixed(2)}</td>
                                            <td>${supply.totalCost?.toFixed(2)}</td>
                                            <td>{supply.supplier}</td>
                                            <td>{supply.purchaseDate ? new Date(supply.purchaseDate).toLocaleDateString() : "N/A"}</td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditSupply(supply)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteSupply(supply._id)}
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
                                    <h2>{editingSupply ? "Edit Supply" : "Add New Supply"}</h2>
                                    <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Item Name *</label>
                                        <input
                                            type="text"
                                            name="itemName"
                                            placeholder="Enter item name"
                                            value={formData.itemName}
                                            onChange={handleInputChange}
                                            required
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
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange}>
                                            <option value="Other">Other</option>
                                            <option value="Medical">Medical</option>
                                            <option value="Cleaning">Cleaning</option>
                                            <option value="Office">Office</option>
                                            <option value="Food">Food</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
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
                                        <div className="form-group">
                                            <label>Unit Cost *</label>
                                            <input
                                                type="number"
                                                name="unitCost"
                                                placeholder="Enter unit cost"
                                                value={formData.unitCost}
                                                onChange={handleInputChange}
                                                step="0.01"
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
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Purchase Date</label>
                                            <input
                                                type="date"
                                                name="purchaseDate"
                                                value={formData.purchaseDate}
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
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveSupply}>
                                        {editingSupply ? "Update Supply" : "Add Supply"}
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

export default Supplies;
