import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import "./store.css";

const Store = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    // Tabs state
    const [activeTab, setActiveTab] = useState("inventory"); // inventory, dispensing

    // Inventory state
    const [items, setItems] = useState([]);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemFormData, setItemFormData] = useState({
        name: "",
        category: "Other",
        description: "",
        price: 0,
        quantity: 0,
        supplier: "",
        expiryDate: "",
    });

    // Dispensing modal state
    const [isDispensingModalOpen, setIsDispensingModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [dispensingFormData, setDispensingFormData] = useState({
        quantity: 0,
        dispensingType: "sale", // sale or clinic_use
        petId: "",
        customerId: "",
        notes: "",
    });
    const [pets, setPets] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Dispensing history state
    const [dispensingHistory, setDispensingHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilter, setHistoryFilter] = useState(""); // "" for all, "sale", "clinic_use"

    // Generic loading state
    const [loading, setLoading] = useState(true);

    // Fetch store items
    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/store`);
            const data = Array.isArray(response) ? response : response.data || [];
            setItems(data);
        } catch (error) {
            enqueueSnackbar("Failed to load store items", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // Fetch pets
    const fetchPets = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pets`);
            const data = Array.isArray(response) ? response : response.data || [];
            setPets(data);
        } catch (error) {
            console.error("Failed to load pets", error);
        }
    }, [clinicId]);

    // Fetch customers
    const fetchCustomers = useCallback(async () => {
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/customers`);
            const data = Array.isArray(response) ? response : response.data || [];
            setCustomers(data);
        } catch (error) {
            console.error("Failed to load customers", error);
        }
    }, [clinicId]);

    // Fetch dispensing history
    const fetchDispensingHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const url = historyFilter
                ? `/clinics/${clinicId}/store/dispense?dispensingType=${historyFilter}`
                : `/clinics/${clinicId}/store/dispense`;
            const response = await HttpService.getWithAuth(url);
            const data = response.data || response || [];
            setDispensingHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            enqueueSnackbar("Failed to load dispensing history", { variant: "error" });
        } finally {
            setHistoryLoading(false);
        }
    }, [clinicId, historyFilter, enqueueSnackbar]);

    // Initial load
    useEffect(() => {
        if (clinicId) {
            fetchItems();
            fetchPets();
            fetchCustomers();
        }
    }, [clinicId, fetchItems, fetchPets, fetchCustomers]);

    // Load history when tab changes or filter changes
    useEffect(() => {
        if (activeTab === "dispensing") {
            fetchDispensingHistory();
        }
    }, [activeTab, historyFilter, fetchDispensingHistory]);

    // Handle item form
    const handleAddItem = () => {
        setEditingItem(null);
        setItemFormData({
            name: "",
            category: "Other",
            description: "",
            price: 0,
            quantity: 0,
            supplier: "",
            expiryDate: "",
        });
        setIsAddItemModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        const formattedDate = item.expiryDate
            ? new Date(item.expiryDate).toISOString().split("T")[0]
            : "";
        setItemFormData({
            ...item,
            expiryDate: formattedDate,
        });
        setIsAddItemModalOpen(true);
    };

    const handleSaveItem = async () => {
        try {
            if (!itemFormData.name || !itemFormData.price || !itemFormData.quantity) {
                enqueueSnackbar("Item name, price, and quantity are required", { variant: "error" });
                return;
            }

            if (editingItem) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/store/${editingItem.id || editingItem._id}`,
                    {
                        name: itemFormData.name,
                        category: itemFormData.category,
                        description: itemFormData.description,
                        price: parseFloat(itemFormData.price) || 0,
                        quantity: parseInt(itemFormData.quantity) || 0,
                        supplier: itemFormData.supplier,
                        expiryDate: itemFormData.expiryDate,
                    }
                );
                enqueueSnackbar("Store item updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/store`, {
                    name: itemFormData.name,
                    category: itemFormData.category,
                    description: itemFormData.description,
                    price: parseFloat(itemFormData.price) || 0,
                    quantity: parseInt(itemFormData.quantity) || 0,
                    supplier: itemFormData.supplier,
                    expiryDate: itemFormData.expiryDate,
                });
                enqueueSnackbar("Store item created", { variant: "success" });
            }

            setIsAddItemModalOpen(false);
            fetchItems();
        } catch (error) {
            enqueueSnackbar("Failed to save store item", { variant: "error" });
        }
    };

    const handleDeleteItem = (id) => {
        if (!window.confirm("Delete this item?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/store/${id}`)
            .then(() => {
                enqueueSnackbar("Store item deleted", { variant: "success" });
                fetchItems();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    const handleItemInputChange = (e) => {
        const { name, value } = e.target;
        setItemFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle dispensing modal
    const handleOpenDispensingModal = (item) => {
        setSelectedItem(item);
        setDispensingFormData({
            quantity: 0,
            dispensingType: "sale",
            petId: "",
            customerId: "",
            notes: "",
        });
        setIsDispensingModalOpen(true);
    };

    const handleDispensingInputChange = (e) => {
        const { name, value } = e.target;
        setDispensingFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRecordDispensing = async () => {
        try {
            if (!dispensingFormData.quantity || dispensingFormData.quantity <= 0) {
                enqueueSnackbar("Quantity must be greater than 0", { variant: "error" });
                return;
            }

            if (dispensingFormData.quantity > selectedItem.quantity) {
                enqueueSnackbar(
                    `Insufficient inventory. Available: ${selectedItem.quantity}`,
                    { variant: "error" }
                );
                return;
            }

            if (dispensingFormData.dispensingType === "sale" && !dispensingFormData.customerId) {
                enqueueSnackbar("Customer is required for sales", { variant: "error" });
                return;
            }

            if (dispensingFormData.dispensingType === "clinic_use" && !dispensingFormData.petId) {
                enqueueSnackbar("Pet is required for clinic use", { variant: "error" });
                return;
            }

            // Get current user ID (simplified)
            const userId = localStorage.getItem('userId') || 'current-user';

            await HttpService.postWithAuth(`/clinics/${clinicId}/store/dispense`, {
                storeItemId: selectedItem.id || selectedItem._id,
                quantity: parseInt(dispensingFormData.quantity),
                dispensingType: dispensingFormData.dispensingType,
                petId: dispensingFormData.dispensingType === "clinic_use" ? dispensingFormData.petId : null,
                customerId: dispensingFormData.dispensingType === "sale" ? dispensingFormData.customerId : null,
                dispensedBy: userId,
                notes: dispensingFormData.notes,
            });

            enqueueSnackbar("Store dispensing recorded", { variant: "success" });
            setIsDispensingModalOpen(false);
            fetchDispensingHistory();
            fetchItems();
        } catch (error) {
            enqueueSnackbar("Failed to record dispensing", { variant: "error" });
        }
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="store">
            <div className="store-container">
                <div className="store-content">
                    <div className="page-header">
                        <div>
                            <h1>Store</h1>
                            <p>Manage store inventory and dispensing</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="store-tabs">
                        <button
                            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
                            onClick={() => setActiveTab("inventory")}
                        >
                            📦 Inventory
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "dispensing" ? "active" : ""}`}
                            onClick={() => setActiveTab("dispensing")}
                        >
                            📋 Dispensing History
                        </button>
                    </div>

                    {/* Inventory Tab */}
                    {activeTab === "inventory" && (
                        <>
                            <div className="tab-header">
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
                                                <th>Name</th>
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
                                                <tr key={item.id || item._id}>
                                                    <td>{item.name}</td>
                                                    <td>{item.category}</td>
                                                    <td>₹{item.price?.toFixed(2)}</td>
                                                    <td>
                                                        <span
                                                            className={
                                                                item.quantity < 10 ? "low-stock" : ""
                                                            }
                                                        >
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td>{item.supplier}</td>
                                                    <td>
                                                        {item.expiryDate
                                                            ? new Date(item.expiryDate).toLocaleDateString()
                                                            : "N/A"}
                                                    </td>
                                                    <td className="actions">
                                                        <button
                                                            className="btn-action primary"
                                                            onClick={() => handleOpenDispensingModal(item)}
                                                            title="Dispense"
                                                        >
                                                            💉
                                                        </button>
                                                        <button
                                                            className="btn-action edit"
                                                            onClick={() => handleEditItem(item)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-action delete"
                                                            onClick={() => handleDeleteItem(item.id || item._id)}
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
                        </>
                    )}

                    {/* Dispensing History Tab */}
                    {activeTab === "dispensing" && (
                        <>
                            <div className="dispensing-filter">
                                <label>Filter:</label>
                                <select
                                    value={historyFilter}
                                    onChange={(e) => setHistoryFilter(e.target.value)}
                                >
                                    <option value="">All Dispensings</option>
                                    <option value="sale">Sales</option>
                                    <option value="clinic_use">Clinic Use</option>
                                </select>
                            </div>

                            {historyLoading ? (
                                <p>Loading dispensing history...</p>
                            ) : dispensingHistory.length === 0 ? (
                                <p>No dispensing history</p>
                            ) : (
                                <div className="store-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Quantity</th>
                                                <th>Type</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                                <th>Pet</th>
                                                <th>Customer</th>
                                                <th>Dispensed By</th>
                                                <th>Date</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dispensingHistory.map((dispensing) => (
                                                <tr key={dispensing.id}>
                                                    <td>{dispensing.storeItem?.name}</td>
                                                    <td>{dispensing.quantity}</td>
                                                    <td>
                                                        <span
                                                            className={
                                                                dispensing.dispensingType === "sale"
                                                                    ? "badge-sale"
                                                                    : "badge-clinic"
                                                            }
                                                        >
                                                            {dispensing.dispensingType === "sale"
                                                                ? "Sale"
                                                                : "Clinic Use"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ₹{dispensing.storeItem?.price?.toFixed(2)}
                                                    </td>
                                                    <td>
                                                        ₹
                                                        {(
                                                            dispensing.quantity *
                                                            (dispensing.storeItem?.price || 0)
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td>{dispensing.pet?.name || "-"}</td>
                                                    <td>
                                                        {dispensing.customer
                                                            ? `${dispensing.customer.firstName} ${dispensing.customer.lastName}`
                                                            : "-"}
                                                    </td>
                                                    <td>
                                                        {dispensing.staff?.firstName}{" "}
                                                        {dispensing.staff?.lastName}
                                                    </td>
                                                    <td>
                                                        {new Date(
                                                            dispensing.dispensingDate
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td>{dispensing.notes || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Add/Edit Item Modal */}
                    {isAddItemModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsAddItemModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingItem ? "Edit Store Item" : "Add New Store Item"}</h2>
                                    <button className="close-btn" onClick={() => setIsAddItemModalOpen(false)}>
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
                                            value={itemFormData.name}
                                            onChange={handleItemInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={itemFormData.category} onChange={handleItemInputChange}>
                                            <option value="Other">Other</option>
                                            <option value="Food">Food</option>
                                            <option value="Toys">Toys</option>
                                            <option value="Accessories">Accessories</option>
                                            <option value="Grooming">Grooming</option>
                                            <option value="Equipment">Equipment</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            placeholder="Enter description"
                                            value={itemFormData.description}
                                            onChange={handleItemInputChange}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Price *</label>
                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="Enter price"
                                                value={itemFormData.price}
                                                onChange={handleItemInputChange}
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
                                                value={itemFormData.quantity}
                                                onChange={handleItemInputChange}
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
                                            value={itemFormData.supplier}
                                            onChange={handleItemInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={itemFormData.expiryDate}
                                            onChange={handleItemInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsAddItemModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveItem}>
                                        {editingItem ? "Update Item" : "Add Item"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dispensing Modal */}
                    {isDispensingModalOpen && selectedItem && (
                        <div className="modal-overlay" onClick={() => setIsDispensingModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Record Item Dispensing</h2>
                                    <button className="close-btn" onClick={() => setIsDispensingModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label><strong>Item:</strong> {selectedItem.name}</label>
                                    </div>
                                    <div className="form-group">
                                        <label><strong>Available:</strong> {selectedItem.quantity}</label>
                                    </div>
                                    <div className="form-group">
                                        <label><strong>Price:</strong> ₹{selectedItem.price?.toFixed(2)}</label>
                                    </div>

                                    <div className="form-group">
                                        <label>Dispensing Type *</label>
                                        <select
                                            name="dispensingType"
                                            value={dispensingFormData.dispensingType}
                                            onChange={handleDispensingInputChange}
                                        >
                                            <option value="sale">Sale (to Customer)</option>
                                            <option value="clinic_use">Clinic Use (on Pet)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Quantity *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            placeholder="Enter quantity"
                                            value={dispensingFormData.quantity}
                                            onChange={handleDispensingInputChange}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    {dispensingFormData.dispensingType === "sale" ? (
                                        <>
                                            <div className="form-group">
                                                <label>Customer *</label>
                                                <select
                                                    name="customerId"
                                                    value={dispensingFormData.customerId}
                                                    onChange={handleDispensingInputChange}
                                                    required
                                                >
                                                    <option value="">Select Customer</option>
                                                    {customers.map((customer) => (
                                                        <option key={customer.id} value={customer.id}>
                                                            {customer.firstName} {customer.lastName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {dispensingFormData.quantity > 0 && (
                                                <div className="form-group">
                                                    <label>
                                                        <strong>Total:</strong> ₹
                                                        {(
                                                            dispensingFormData.quantity *
                                                            (selectedItem.price || 0)
                                                        ).toFixed(2)}
                                                    </label>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="form-group">
                                            <label>Pet *</label>
                                            <select
                                                name="petId"
                                                value={dispensingFormData.petId}
                                                onChange={handleDispensingInputChange}
                                                required
                                            >
                                                <option value="">Select Pet</option>
                                                {pets.map((pet) => (
                                                    <option key={pet.id} value={pet.id}>
                                                        {pet.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            name="notes"
                                            placeholder="Add any notes"
                                            value={dispensingFormData.notes}
                                            onChange={handleDispensingInputChange}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsDispensingModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleRecordDispensing}>
                                        Record Dispensing
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
