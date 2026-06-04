import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./store.css";

const emptyDispense = {
    storeItemId: "",
    quantity: "",
    dispensingType: "SALE",
    petId: "",
    customerId: "",
    notes: "",
};

const parseArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const toCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const Store = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = AuthService.getCurrentUser();
    const [activeTab, setActiveTab] = useState("give");
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [pets, setPets] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [dispenseForm, setDispenseForm] = useState(emptyDispense);

    const fetchItems = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/store`);
            setItems(parseArrayResponse(response));
        } catch (error) {
            enqueueSnackbar("Failed to load store items", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchHistory = useCallback(async () => {
        if (!clinicId) return;
        try {
            setHistoryLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/store/dispense`);
            setHistory(parseArrayResponse(response));
        } catch (error) {
            enqueueSnackbar("Failed to load store history", { variant: "error" });
        } finally {
            setHistoryLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchRecipients = useCallback(async () => {
        if (!clinicId) return;
        try {
            const [petsResponse, customersResponse] = await Promise.all([
                HttpService.getWithAuth(`/clinics/${clinicId}/pets?limit=100`),
                HttpService.getWithAuth(`/clinics/${clinicId}/customers?limit=100`),
            ]);
            setPets(parseArrayResponse(petsResponse));
            setCustomers(parseArrayResponse(customersResponse));
        } catch (error) {
            console.error("Failed to load store recipients:", error);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchItems();
        fetchHistory();
        fetchRecipients();
    }, [fetchItems, fetchHistory, fetchRecipients]);

    const filteredItems = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) => (
            item.name?.toLowerCase().includes(query)
            || item.supplier?.toLowerCase().includes(query)
            || item.category?.toLowerCase().includes(query)
        ));
    }, [items, searchTerm]);

    const filteredHistory = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return history;
        return history.filter((entry) => (
            entry.storeItem?.name?.toLowerCase().includes(query)
            || entry.pet?.name?.toLowerCase().includes(query)
            || entry.customer?.firstName?.toLowerCase().includes(query)
            || entry.customer?.lastName?.toLowerCase().includes(query)
        ));
    }, [history, searchTerm]);

    const openDispense = (item) => {
        setDispenseForm({
            ...emptyDispense,
            storeItemId: item.id,
        });
        setDispenseModalOpen(true);
    };

    const handleDispenseChange = (event) => {
        const { name, value } = event.target;
        setDispenseForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleGiveItem = async () => {
        if (!currentUser?.id) {
            enqueueSnackbar("Logged-in user not found", { variant: "error" });
            return;
        }
        if (!dispenseForm.storeItemId || !dispenseForm.quantity || Number(dispenseForm.quantity) <= 0) {
            enqueueSnackbar("Select an item and enter a valid quantity", { variant: "error" });
            return;
        }
        if (dispenseForm.dispensingType === "SALE" && !dispenseForm.customerId) {
            enqueueSnackbar("Customer is required for sale", { variant: "error" });
            return;
        }
        if (dispenseForm.dispensingType === "CLINIC_USE" && !dispenseForm.petId) {
            enqueueSnackbar("Pet is required for clinic use", { variant: "error" });
            return;
        }

        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/store/dispense`, {
                ...dispenseForm,
                quantity: Number(dispenseForm.quantity),
                dispensedBy: currentUser.id,
                petId: dispenseForm.dispensingType === "CLINIC_USE" ? dispenseForm.petId : null,
                customerId: dispenseForm.dispensingType === "SALE" ? dispenseForm.customerId : null,
            });
            enqueueSnackbar("Store item given successfully", { variant: "success" });
            setDispenseModalOpen(false);
            fetchItems();
            fetchHistory();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to give store item", { variant: "error" });
        }
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="store">
            <div className="store-container">
                <div className="store-content">
                    <div className="page-header">
                        <div>
                            <h1>Other Store</h1>
                            <p>Give store items and review dispensing history</p>
                        </div>
                    </div>

                    <div className="store-tabs">
                        <button className={`tab-btn ${activeTab === "give" ? "active" : ""}`} onClick={() => setActiveTab("give")}>Give Item</button>
                        <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>Given History</button>
                    </div>

                    <div className="inventory-toolbar">
                        <input
                            type="search"
                            placeholder={activeTab === "give" ? "Search product, vendor, or type" : "Search history"}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    {activeTab === "give" && (loading ? <p>Loading...</p> : (
                        <div className="store-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Vendor</th>
                                        <th>Type</th>
                                        <th>Expiry Date</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.supplier || "-"}</td>
                                            <td>{item.category || "-"}</td>
                                            <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</td>
                                            <td>{toCurrency(item.price)}</td>
                                            <td>{item.quantity || 0}</td>
                                            <td className="actions">
                                                <button className="btn-action primary" onClick={() => openDispense(item)}>Give</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {activeTab === "history" && (historyLoading ? <p>Loading history...</p> : (
                        <div className="store-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Type</th>
                                        <th>Total</th>
                                        <th>Pet</th>
                                        <th>Customer</th>
                                        <th>Given By</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((entry) => (
                                        <tr key={entry.id}>
                                            <td>{entry.storeItem?.name || "-"}</td>
                                            <td>{entry.quantity}</td>
                                            <td>{entry.dispensingType === "SALE" ? "Sale" : "Clinic Use"}</td>
                                            <td>{toCurrency((entry.quantity || 0) * (entry.storeItem?.price || 0))}</td>
                                            <td>{entry.pet?.name || "-"}</td>
                                            <td>{entry.customer ? `${entry.customer.firstName || ""} ${entry.customer.lastName || ""}`.trim() : "-"}</td>
                                            <td>{entry.staff ? `${entry.staff.firstName || ""} ${entry.staff.lastName || ""}`.trim() : "-"}</td>
                                            <td>{entry.dispensingDate ? new Date(entry.dispensingDate).toLocaleDateString() : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {dispenseModalOpen && (
                        <div className="modal-overlay" onClick={() => setDispenseModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Give Store Item</h2>
                                    <button className="close-btn" onClick={() => setDispenseModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Quantity *</label>
                                            <input type="number" min="1" name="quantity" value={dispenseForm.quantity} onChange={handleDispenseChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Type</label>
                                            <select name="dispensingType" value={dispenseForm.dispensingType} onChange={handleDispenseChange}>
                                                <option value="SALE">Sale to Customer</option>
                                                <option value="CLINIC_USE">Clinic Use on Pet</option>
                                            </select>
                                        </div>
                                        {dispenseForm.dispensingType === "SALE" ? (
                                            <div className="form-group">
                                                <label>Customer *</label>
                                                <select name="customerId" value={dispenseForm.customerId} onChange={handleDispenseChange}>
                                                    <option value="">Select customer</option>
                                                    {customers.map((customer) => (
                                                        <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label>Pet *</label>
                                                <select name="petId" value={dispenseForm.petId} onChange={handleDispenseChange}>
                                                    <option value="">Select pet</option>
                                                    {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group form-grid-wide">
                                            <label>Notes</label>
                                            <textarea name="notes" rows="2" value={dispenseForm.notes} onChange={handleDispenseChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setDispenseModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleGiveItem}>Give Item</button>
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
