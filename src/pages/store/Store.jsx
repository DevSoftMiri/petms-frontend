import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./store.css";

const Store = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "Other",
        description: "",
        price: 0,
        quantity: 0,
        supplier: "",
        expiryDate: "",
    });

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/store`
            );
            const data = Array.isArray(response) ? response : response.data || [];
            setItems(data);
        } catch (error) {
            enqueueSnackbar("Failed to load store items", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (clinicId) fetchItems();
    }, [clinicId, fetchItems]);

    const handleAddItem = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            category: "Other",
            description: "",
            price: 0,
            quantity: 0,
            supplier: "",
            expiryDate: "",
        });
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = async () => {
        try {
            if (!formData.name || !formData.price) {
                enqueueSnackbar("Item name and price are required", { variant: "error" });
                return;
            }

            if (editingItem) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/store/${editingItem._id}`,
                    formData
                );
                enqueueSnackbar("Store item updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/store`,
                    formData
                );
                enqueueSnackbar("Store item created", { variant: "success" });
            }

            setIsModalOpen(false);
            fetchItems();
        } catch {
            enqueueSnackbar("Failed to save store item", { variant: "error" });
        }
    };

    const handleDeleteItem = (id) => {
        if (!window.confirm("Delete this item?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/store/${id}`)
            .then(() => {
                enqueueSnackbar("Item deleted", { variant: "success" });
                fetchItems();
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
        <div className="store">
            <div className="store-container">
                <div className="store-content">
                    <div className="page-header">
                        <div>
                            <h1>Pet Store</h1>
                            <p>Manage pet accessories and supplies inventory</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleAddItem}>
                            ➕ Add Item
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="store-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Supplier</th>
                                        <th>Expiry Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item._id}>
                                            <td>{item.name}</td>
                                            <td>{item.category}</td>
                                            <td>${item.price?.toFixed(2)}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.supplier}</td>
                                            <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}</td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditItem(item)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteItem(item._id)}
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
                                    <h2>{editingItem ? "Edit Store Item" : "Add New Store Item"}</h2>
                                    <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Item Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Enter item name"
                                            value={formData.name}
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
                                            <option value="Toys">Toys</option>
                                            <option value="Collars">Collars</option>
                                            <option value="Beds">Beds</option>
                                            <option value="Leashes">Leashes</option>
                                            <option value="Bowls">Bowls</option>
                                            <option value="Treats">Treats</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Price *</label>
                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="Enter price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Quantity</label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                placeholder="Enter quantity"
                                                value={formData.quantity}
                                                onChange={handleInputChange}
                                                min="0"
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
                                    <button className="btn btn-primary" onClick={handleSaveItem}>
                                        {editingItem ? "Update Item" : "Add Item"}
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

export default Store;
