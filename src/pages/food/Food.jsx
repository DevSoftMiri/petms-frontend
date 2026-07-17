import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./food.css";

const FOOD_TYPES = ["Wet Food", "Dry Food", "Medicated Food", "Fresh Food"];

const emptyGiveForm = {
    itemId: "",
    quantity: "",
    recipientType: "GENERAL_FEEDING",
    petId: "",
    recipientName: "",
    notes: "",
};

const parseArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const FOOD_HISTORY_NOTE_PREFIX = "FOOD_HISTORY::";

const buildFoodHistoryNotes = ({ recipientType, recipientName, notes }) => {
    const payload = {
        recipientType: recipientType || "GENERAL_FEEDING",
        recipientName: recipientName?.trim() || "",
        notes: notes?.trim() || "",
    };

    return `${FOOD_HISTORY_NOTE_PREFIX}${JSON.stringify(payload)}`;
};

const parseFoodHistoryNotes = (rawNotes) => {
    if (!rawNotes) {
        return {
            recipientType: "GENERAL_FEEDING",
            recipientName: "",
            notes: "",
        };
    }

    if (!rawNotes.startsWith(FOOD_HISTORY_NOTE_PREFIX)) {
        return {
            recipientType: "GENERAL_FEEDING",
            recipientName: "",
            notes: rawNotes,
        };
    }

    try {
        const parsed = JSON.parse(rawNotes.slice(FOOD_HISTORY_NOTE_PREFIX.length));
        return {
            recipientType: parsed.recipientType || "GENERAL_FEEDING",
            recipientName: parsed.recipientName || "",
            notes: parsed.notes || "",
        };
    } catch (error) {
        return {
            recipientType: "GENERAL_FEEDING",
            recipientName: "",
            notes: rawNotes,
        };
    }
};

const formatStaffName = (staff) => {
    if (!staff) return "-";
    const fullName = `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
    return fullName || staff.email || "-";
};

const formatRecipientType = (recipientType) => {
    switch (recipientType) {
    case "SHELTER_ANIMAL":
        return "Shelter Animal";
    case "RESCUE_CASE":
        return "Rescue Case";
    case "FEEDING_PACK":
        return "Feeding Pack";
    default:
        return "General Feeding";
    }
};

const Food = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = AuthService.getCurrentUser();
    const [activeTab, setActiveTab] = useState("give");
    const [foodItems, setFoodItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [pets, setPets] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState(FOOD_TYPES[0]);
    const [giveModalOpen, setGiveModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [giveForm, setGiveForm] = useState(emptyGiveForm);

    const fetchFoodItems = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/supplies`);
            const items = parseArrayResponse(response).filter((item) => FOOD_TYPES.includes(item.category));
            setFoodItems(items);
        } catch (error) {
            enqueueSnackbar("Failed to load food inventory", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchPets = useCallback(async () => {
        if (!clinicId) return;
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pets?limit=100`);
            setPets(parseArrayResponse(response));
        } catch (error) {
            console.error("Failed to load pets for food page:", error);
        }
    }, [clinicId]);

    const fetchHistory = useCallback(async () => {
        if (!clinicId) return;
        try {
            setHistoryLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/store/dispense?limit=100`);
            const entries = parseArrayResponse(response)
                .filter((entry) => FOOD_TYPES.includes(entry.storeItem?.category))
                .map((entry) => ({
                    ...entry,
                    foodHistoryMeta: parseFoodHistoryNotes(entry.notes),
                }));
            setHistory(entries);
        } catch (error) {
            enqueueSnackbar("Failed to load food given history", { variant: "error" });
        } finally {
            setHistoryLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    useEffect(() => {
        fetchFoodItems();
        fetchPets();
        fetchHistory();
    }, [fetchFoodItems, fetchPets, fetchHistory]);

    const filteredFoodItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return foodItems;
        return foodItems.filter((item) => (
            item.name?.toLowerCase().includes(query)
            || item.category?.toLowerCase().includes(query)
            || item.supplier?.toLowerCase().includes(query)
        ));
    }, [foodItems, search]);

    const filteredHistory = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return history;
        return history.filter((entry) => (
            entry.storeItem?.name?.toLowerCase().includes(query)
            || entry.pet?.name?.toLowerCase().includes(query)
            || entry.foodHistoryMeta?.recipientName?.toLowerCase().includes(query)
            || formatRecipientType(entry.foodHistoryMeta?.recipientType).toLowerCase().includes(query)
            || formatStaffName(entry.staff).toLowerCase().includes(query)
        ));
    }, [history, search]);

    const groupedSections = useMemo(() => FOOD_TYPES.map((type) => ({
        type,
        items: filteredFoodItems.filter((item) => item.category === type),
        totalQuantity: filteredFoodItems
            .filter((item) => item.category === type)
            .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    })), [filteredFoodItems]);

    const selectedSection = useMemo(
        () => groupedSections.find((section) => section.type === selectedType) || groupedSections[0],
        [groupedSections, selectedType],
    );

    const totalFoodUnits = useMemo(
        () => filteredFoodItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [filteredFoodItems],
    );

    const lowStockCount = useMemo(
        () => filteredFoodItems.filter((item) => Number(item.quantity || 0) <= Number(item.reorderLevel || 0)).length,
        [filteredFoodItems],
    );

    const openGiveModal = (item) => {
        setSelectedItem(item);
        setGiveForm({
            ...emptyGiveForm,
            itemId: item.id,
        });
        setGiveModalOpen(true);
    };

    const handleGiveChange = (event) => {
        const { name, value } = event.target;
        setGiveForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleGiveFood = async () => {
        if (!selectedItem) return;
        if (!currentUser?.id) {
            enqueueSnackbar("Logged-in user not found", { variant: "error" });
            return;
        }

        const quantityToGive = Number(giveForm.quantity || 0);
        const availableQuantity = Number(selectedItem.quantity || 0);

        if (quantityToGive <= 0) {
            enqueueSnackbar("Enter a valid quantity to give", { variant: "error" });
            return;
        }

        if (quantityToGive > availableQuantity) {
            enqueueSnackbar(`Only ${availableQuantity} available in stock`, { variant: "error" });
            return;
        }

        try {
            setSubmitting(true);
            await HttpService.postWithAuth(`/clinics/${clinicId}/store/dispense`, {
                sourceSupplyId: selectedItem.id,
                quantity: quantityToGive,
                dispensingType: "CLINIC_USE",
                petId: giveForm.petId || null,
                customerId: null,
                dispensedBy: currentUser.id,
                notes: buildFoodHistoryNotes(giveForm),
            });
            enqueueSnackbar("Food given and history recorded", { variant: "success" });
            setGiveModalOpen(false);
            setSelectedItem(null);
            setGiveForm(emptyGiveForm);
            fetchFoodItems();
            fetchHistory();
            setActiveTab("history");
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to give food", { variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="food-page">
            <div className="food-container">
                <div className="food-content">
                    <div className="page-header">
                        <div>
                            <h1>Food</h1>
                            <p>Give food from available stock and review complete given history</p>
                        </div>
                    </div>

                    <div className="store-tabs">
                        <button className={`tab-btn ${activeTab === "give" ? "active" : ""}`} onClick={() => setActiveTab("give")}>
                            Give Food
                        </button>
                        <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                            Given History
                        </button>
                    </div>

                    <div className="food-hero">
                        <div className="food-hero-copy">
                            <span className="food-eyebrow">Animal Feeding Desk</span>
                            <h2>Serve from live food inventory</h2>
                            <p>Choose a food category, review available items, and deduct stock when staff issue meals or feeding packs.</p>
                        </div>
                        <div className="food-stats">
                            <div className="food-stat-card">
                                <span>Total Food Items</span>
                                <strong>{filteredFoodItems.length}</strong>
                            </div>
                            <div className="food-stat-card">
                                <span>Available Units</span>
                                <strong>{totalFoodUnits}</strong>
                            </div>
                            <div className="food-stat-card">
                                <span>Low Stock</span>
                                <strong>{lowStockCount}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="inventory-toolbar">
                        <input
                            type="search"
                            placeholder={activeTab === "give" ? "Search food item, vendor, or type" : "Search food history, recipient, or staff"}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    {activeTab === "give" && (
                        <>
                            <div className="food-type-row">
                                {groupedSections.map((section) => (
                                    <button
                                        type="button"
                                        key={section.type}
                                        className={`food-type-card ${selectedSection?.type === section.type ? "active" : ""}`}
                                        onClick={() => setSelectedType(section.type)}
                                    >
                                        <span className="food-type-card__title">{section.type}</span>
                                        <span className="food-type-card__meta">{section.items.length} item{section.items.length === 1 ? "" : "s"}</span>
                                        <strong>{section.totalQuantity}</strong>
                                    </button>
                                ))}
                            </div>

                            <section className="food-panel">
                                <div className="section-header">
                                    <div>
                                        <h2>{selectedSection?.type || "Food Stock"}</h2>
                                        <p className="info-text">Available products for staff to issue right now</p>
                                    </div>
                                </div>

                                {loading ? <p>Loading food stock...</p> : selectedSection?.items?.length ? (
                                    <div className="food-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Food Item</th>
                                                    <th>Vendor</th>
                                                    <th>Available Qty</th>
                                                    <th>Reorder Level</th>
                                                    <th>Expiry Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedSection.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div className="food-item-name">
                                                                <strong>{item.name}</strong>
                                                                <span>{item.description || item.category}</span>
                                                            </div>
                                                        </td>
                                                        <td>{item.supplier || "-"}</td>
                                                        <td>{item.quantity || 0}</td>
                                                        <td>{item.reorderLevel || 0}</td>
                                                        <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</td>
                                                        <td className="actions">
                                                            <button className="btn-action primary" onClick={() => openGiveModal(item)}>Give Food</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="food-empty">
                                        <h3>No food items ready in this category</h3>
                                        <p>Add stock from the Supplies page under the Food section to start issuing it here.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {activeTab === "history" && (
                        <section className="food-panel">
                            <div className="section-header">
                                <div>
                                    <h2>Food Given History</h2>
                                    <p className="info-text">Superadmin and clinic staff can review who gave food and where it went</p>
                                </div>
                            </div>

                            {historyLoading ? <p>Loading given history...</p> : filteredHistory.length ? (
                                <div className="food-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Food Item</th>
                                                <th>Qty</th>
                                                <th>Given For</th>
                                                <th>Pet</th>
                                                <th>Recipient</th>
                                                <th>Given By</th>
                                                <th>Date</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td>{entry.storeItem?.name || "-"}</td>
                                                    <td>{entry.quantity || 0}</td>
                                                    <td>{formatRecipientType(entry.foodHistoryMeta?.recipientType)}</td>
                                                    <td>{entry.pet?.name || "-"}</td>
                                                    <td>{entry.foodHistoryMeta?.recipientName || "-"}</td>
                                                    <td>{formatStaffName(entry.staff)}</td>
                                                    <td>{entry.dispensingDate ? new Date(entry.dispensingDate).toLocaleDateString() : "-"}</td>
                                                    <td>{entry.foodHistoryMeta?.notes || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="food-empty">
                                    <h3>No food given history yet</h3>
                                    <p>Once staff give food from stock, the full record will show here with the user who issued it.</p>
                                </div>
                            )}
                        </section>
                    )}

                    {giveModalOpen && selectedItem && (
                        <div className="modal-overlay" onClick={() => setGiveModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Give Food</h2>
                                    <button className="close-btn" onClick={() => setGiveModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="food-give-summary">
                                        <strong>{selectedItem.name}</strong>
                                        <span>{selectedItem.category}</span>
                                        <p>Available stock: {selectedItem.quantity || 0}</p>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Quantity to Give *</label>
                                            <input type="number" min="1" name="quantity" value={giveForm.quantity} onChange={handleGiveChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Given For</label>
                                            <select name="recipientType" value={giveForm.recipientType} onChange={handleGiveChange}>
                                                <option value="GENERAL_FEEDING">General Feeding</option>
                                                <option value="SHELTER_ANIMAL">Shelter Animal</option>
                                                <option value="RESCUE_CASE">Rescue Case</option>
                                                <option value="FEEDING_PACK">Feeding Pack</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Pet Name</label>
                                            <select name="petId" value={giveForm.petId} onChange={handleGiveChange}>
                                                <option value="">Select pet</option>
                                                {pets.map((pet) => (
                                                    <option key={pet.id} value={pet.id}>{pet.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Recipient / Batch Name</label>
                                            <input name="recipientName" value={giveForm.recipientName} onChange={handleGiveChange} placeholder="Optional" />
                                        </div>
                                        <div className="form-group form-grid-wide">
                                            <label>Notes</label>
                                            <textarea name="notes" rows="3" value={giveForm.notes} onChange={handleGiveChange} placeholder="Optional notes for staff reference" />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setGiveModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleGiveFood} disabled={submitting}>
                                        {submitting ? "Updating..." : "Confirm Give"}
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

export default Food;
