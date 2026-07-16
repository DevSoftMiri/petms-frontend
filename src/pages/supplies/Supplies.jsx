import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import "./supplies.css";

const MEDICINE_TYPES = ["Syrup", "Ointment", "Tablet", "Injection", "Drop"];
const STORE_TYPES = ["Bed", "Treat"];
const FOOD_TYPES = ["Wet Food", "Dry Food", "Medicated Food", "Fresh Food"];

const emptyMedicine = {
    productName: "",
    dosage: "",
    power: "",
    type: "",
    weight: "",
    mfgDate: "",
    expDate: "",
    mrp: "",
    discount: "",
    vendor: "",
    payable: "",
    stock: "",
    inwardDate: "",
};

const emptyStoreItem = {
    name: "",
    supplier: "",
    category: "",
    expiryDate: "",
    price: "",
    quantity: "",
    inwardDate: "",
    outwardDate: "",
};

const emptyFoodItem = {
    name: "",
    category: "",
    quantity: "",
    supplier: "",
    expiryDate: "",
    cost: "",
    reorderLevel: "",
    description: "",
};

const parseArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const toCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const Supplies = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [activeSection, setActiveSection] = useState("medicine");
    const [medicines, setMedicines] = useState([]);
    const [storeItems, setStoreItems] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [loadingMedicines, setLoadingMedicines] = useState(true);
    const [loadingStoreItems, setLoadingStoreItems] = useState(true);
    const [loadingFoodItems, setLoadingFoodItems] = useState(true);
    const [search, setSearch] = useState("");
    const [medicineModalOpen, setMedicineModalOpen] = useState(false);
    const [storeModalOpen, setStoreModalOpen] = useState(false);
    const [foodModalOpen, setFoodModalOpen] = useState(false);
    const [medicineForm, setMedicineForm] = useState(emptyMedicine);
    const [storeForm, setStoreForm] = useState(emptyStoreItem);
    const [foodForm, setFoodForm] = useState(emptyFoodItem);
    const [selectedFoodType, setSelectedFoodType] = useState(FOOD_TYPES[0]);

    const fetchMedicines = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoadingMedicines(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pharmacy`);
            setMedicines(parseArrayResponse(response));
        } finally {
            setLoadingMedicines(false);
        }
    }, [clinicId]);

    const fetchStoreItems = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoadingStoreItems(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/store`);
            setStoreItems(parseArrayResponse(response));
        } finally {
            setLoadingStoreItems(false);
        }
    }, [clinicId]);

    const fetchFoodItems = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoadingFoodItems(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/supplies`);
            const items = parseArrayResponse(response).filter((item) => FOOD_TYPES.includes(item.category));
            setFoodItems(items);
        } finally {
            setLoadingFoodItems(false);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchMedicines();
        fetchStoreItems();
        fetchFoodItems();
    }, [fetchFoodItems, fetchMedicines, fetchStoreItems]);

    const filteredMedicines = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return medicines;
        return medicines.filter((medicine) => (
            medicine.productName?.toLowerCase().includes(query)
            || medicine.dosage?.toLowerCase().includes(query)
            || medicine.type?.toLowerCase().includes(query)
            || medicine.vendor?.toLowerCase().includes(query)
        ));
    }, [medicines, search]);

    const filteredStoreItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return storeItems;
        return storeItems.filter((item) => (
            item.name?.toLowerCase().includes(query)
            || item.supplier?.toLowerCase().includes(query)
            || item.category?.toLowerCase().includes(query)
        ));
    }, [storeItems, search]);

    const filteredFoodItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return foodItems;
        return foodItems.filter((item) => (
            item.name?.toLowerCase().includes(query)
            || item.category?.toLowerCase().includes(query)
            || item.supplier?.toLowerCase().includes(query)
        ));
    }, [foodItems, search]);

    const groupedFoodItems = useMemo(() => FOOD_TYPES.map((type) => ({
        type,
        items: filteredFoodItems.filter((item) => item.category === type),
    })), [filteredFoodItems]);

    const selectedFoodSection = useMemo(
        () => groupedFoodItems.find((section) => section.type === selectedFoodType) || groupedFoodItems[0],
        [groupedFoodItems, selectedFoodType],
    );

    const handleMedicineChange = (event) => {
        const { name, value } = event.target;
        setMedicineForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStoreChange = (event) => {
        const { name, value } = event.target;
        setStoreForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFoodChange = (event) => {
        const { name, value } = event.target;
        setFoodForm((prev) => ({ ...prev, [name]: value }));
    };

    const saveMedicine = async () => {
        if (!medicineForm.productName.trim() || !medicineForm.type) {
            enqueueSnackbar("Product name and type are required", { variant: "error" });
            return;
        }
        if (Number(medicineForm.payable || 0) > Number(medicineForm.mrp || 0)) {
            enqueueSnackbar("Payable amount cannot exceed MRP", { variant: "error" });
            return;
        }
        if (medicineForm.mfgDate && medicineForm.expDate && new Date(medicineForm.expDate) <= new Date(medicineForm.mfgDate)) {
            enqueueSnackbar("Expiry date must be greater than manufacturing date", { variant: "error" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/pharmacy`, {
                ...medicineForm,
                stock: Number(medicineForm.stock || 0),
                mrp: Number(medicineForm.mrp || 0),
                discount: Number(medicineForm.discount || 0),
                payable: Number(medicineForm.payable || 0),
            });
            enqueueSnackbar("Medicine stock added", { variant: "success" });
            setMedicineModalOpen(false);
            setMedicineForm(emptyMedicine);
            fetchMedicines();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to add medicine", { variant: "error" });
        }
    };

    const saveStoreItem = async () => {
        if (!storeForm.name.trim() || !storeForm.category) {
            enqueueSnackbar("Product name and type are required", { variant: "error" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/store`, {
                ...storeForm,
                price: Number(storeForm.price || 0),
                quantity: Number(storeForm.quantity || 0),
            });
            enqueueSnackbar("Store stock added", { variant: "success" });
            setStoreModalOpen(false);
            setStoreForm(emptyStoreItem);
            fetchStoreItems();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to add store item", { variant: "error" });
        }
    };

    const saveFoodItem = async () => {
        if (!foodForm.name.trim() || !foodForm.category) {
            enqueueSnackbar("Food item name and type are required", { variant: "error" });
            return;
        }

        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/supplies`, {
                ...foodForm,
                quantity: Number(foodForm.quantity || 0),
                cost: Number(foodForm.cost || 0),
                reorderLevel: Number(foodForm.reorderLevel || 10),
            });
            enqueueSnackbar("Food item added", { variant: "success" });
            setFoodModalOpen(false);
            setFoodForm(emptyFoodItem);
            fetchFoodItems();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to add food item", { variant: "error" });
        }
    };

    return (
        <div className="supplies">
            <div className="supplies-container">
                <div className="supplies-content">
                    <div className="page-header">
                        <div>
                            <h1>Supplies</h1>
                            <p>Add and review medicine stock and other store stock</p>
                        </div>
                    </div>

                    <div className="inventory-gateway">
                        <button className={`inventory-card pharmacy-card ${activeSection === "medicine" ? "active" : ""}`} onClick={() => setActiveSection("medicine")}>
                            <span className="inventory-card-icon">Rx</span>
                            <span className="inventory-card-title">Medicine Stock</span>
                            <span className="inventory-card-copy">Add pharmacy medicines into inventory</span>
                        </button>

                        <button className={`inventory-card store-card ${activeSection === "store" ? "active" : ""}`} onClick={() => setActiveSection("store")}>
                            <span className="inventory-card-icon">ST</span>
                            <span className="inventory-card-title">Store Stock</span>
                            <span className="inventory-card-copy">Add food, beds, treats, and other store stock</span>
                        </button>

                        <button className={`inventory-card food-card ${activeSection === "food" ? "active" : ""}`} onClick={() => setActiveSection("food")}>
                            <span className="inventory-card-icon">FD</span>
                            <span className="inventory-card-title">Food Stock</span>
                            <span className="inventory-card-copy">Track wet, dry, medicated, and fresh food items with quantity</span>
                        </button>
                    </div>

                    <section className="supplies-medicine-panel">
                        <div className="section-header">
                            <div>
                                <h2>{activeSection === "medicine" ? "Medicine Stock" : activeSection === "store" ? "Store Stock" : "Food Stock"}</h2>
                                <p className="info-text">Stock is added here and given from Pharmacy or Store pages</p>
                            </div>
                            {activeSection === "medicine" ? (
                                <button className="btn btn-primary" onClick={() => setMedicineModalOpen(true)}>Add Medicine</button>
                            ) : activeSection === "food" ? (
                                <button className="btn btn-primary" onClick={() => setFoodModalOpen(true)}>Add Food Item</button>
                            ) : (
                                <button className="btn btn-primary" onClick={() => setStoreModalOpen(true)}>Add Store Product</button>
                            )}
                        </div>

                        <div className="inventory-toolbar">
                            <input
                                type="search"
                                placeholder={activeSection === "medicine" ? "Search medicines" : activeSection === "store" ? "Search store stock" : "Search food stock"}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        {activeSection === "medicine" && (loadingMedicines ? <p>Loading medicines...</p> : (
                            <div className="supplies-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Dosage</th>
                                            <th>Power</th>
                                            <th>Type</th>
                                            <th>Vendor</th>
                                            <th>Expiry Date</th>
                                            <th>Payable</th>
                                            <th>Stock</th>
                                            <th>Total Stock Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMedicines.map((medicine) => (
                                            <tr key={medicine.id}>
                                                <td>{medicine.productName}</td>
                                                <td>{medicine.dosage || "-"}</td>
                                                <td>{medicine.power || "-"}</td>
                                                <td>{medicine.type || "-"}</td>
                                                <td>{medicine.vendor || "-"}</td>
                                                <td>{medicine.expDate ? new Date(medicine.expDate).toLocaleDateString() : "-"}</td>
                                                <td>{toCurrency(medicine.payable)}</td>
                                                <td>{medicine.stock || 0}</td>
                                                <td>{toCurrency((medicine.stock || 0) * (medicine.payable || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {activeSection === "store" && (loadingStoreItems ? <p>Loading store stock...</p> : (
                            <div className="supplies-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Vendor</th>
                                            <th>Type</th>
                                            <th>Expiry Date</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Inward Date</th>
                                            <th>Outward Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStoreItems.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{item.supplier || "-"}</td>
                                                <td>{item.category || "-"}</td>
                                                <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</td>
                                                <td>{toCurrency(item.price)}</td>
                                                <td>{item.quantity || 0}</td>
                                                <td>{item.inwardDate ? new Date(item.inwardDate).toLocaleDateString() : "-"}</td>
                                                <td>{item.outwardDate ? new Date(item.outwardDate).toLocaleDateString() : "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {activeSection === "food" && (loadingFoodItems ? <p>Loading food stock...</p> : (
                            <div className="food-sections">
                                <div className="food-card-row">
                                    {groupedFoodItems.map((section) => (
                                        <button
                                            type="button"
                                            key={section.type}
                                            className={`food-subsection food-subsection-card ${selectedFoodSection?.type === section.type ? "active" : ""}`}
                                            onClick={() => setSelectedFoodType(section.type)}
                                        >
                                            <div className="food-subsection-header">
                                                <h3>{section.type}</h3>
                                                <span>{section.items.length} item{section.items.length === 1 ? "" : "s"}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="food-products-panel">
                                    <div className="food-products-header">
                                        <h3>{selectedFoodSection?.type || "Food Items"}</h3>
                                        <p>Products added under this food category</p>
                                    </div>
                                    {selectedFoodSection?.items?.length ? (
                                        <div className="supplies-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Item Name</th>
                                                        <th>Quantity</th>
                                                        <th>Supplier</th>
                                                        <th>Unit Cost</th>
                                                        <th>Reorder Level</th>
                                                        <th>Expiry Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedFoodSection.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.name}</td>
                                                            <td>{item.quantity || 0}</td>
                                                            <td>{item.supplier || "-"}</td>
                                                            <td>{toCurrency(item.cost)}</td>
                                                            <td>{item.reorderLevel || 0}</td>
                                                            <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="empty-food-state">No items added in {selectedFoodSection?.type?.toLowerCase() || "this category"} yet.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </section>

                    {medicineModalOpen && (
                        <div className="modal-overlay" onClick={() => setMedicineModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Add Medicine</h2>
                                    <button className="close-btn" onClick={() => setMedicineModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group"><label>Product Name *</label><input name="productName" value={medicineForm.productName} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Dosage</label><input name="dosage" value={medicineForm.dosage} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Power</label><input name="power" value={medicineForm.power} onChange={handleMedicineChange} /></div>
                                        <div className="form-group">
                                            <label>Type *</label>
                                            <select name="type" value={medicineForm.type} onChange={handleMedicineChange}>
                                                <option value="">Select type</option>
                                                {MEDICINE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Weight</label><input name="weight" value={medicineForm.weight} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>MFG Date</label><input type="date" name="mfgDate" value={medicineForm.mfgDate} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Expiry Date</label><input type="date" name="expDate" value={medicineForm.expDate} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>MRP</label><input type="number" min="0" step="0.01" name="mrp" value={medicineForm.mrp} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Discount</label><input type="number" min="0" step="0.01" name="discount" value={medicineForm.discount} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Vendor</label><input name="vendor" value={medicineForm.vendor} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Payable Amount</label><input type="number" min="0" step="0.01" name="payable" value={medicineForm.payable} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Stock Quantity</label><input type="number" min="0" name="stock" value={medicineForm.stock} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Inward Date</label><input type="date" name="inwardDate" value={medicineForm.inwardDate} onChange={handleMedicineChange} /></div>
                                        <div className="form-group"><label>Total Amount of Stock</label><input value={toCurrency((medicineForm.stock || 0) * (medicineForm.payable || 0))} readOnly /></div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setMedicineModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={saveMedicine}>Add Medicine</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {storeModalOpen && (
                        <div className="modal-overlay" onClick={() => setStoreModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Add Store Product</h2>
                                    <button className="close-btn" onClick={() => setStoreModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group"><label>Product Name *</label><input name="name" value={storeForm.name} onChange={handleStoreChange} /></div>
                                        <div className="form-group"><label>Vendor</label><input name="supplier" value={storeForm.supplier} onChange={handleStoreChange} /></div>
                                        <div className="form-group">
                                            <label>Type *</label>
                                            <select name="category" value={storeForm.category} onChange={handleStoreChange}>
                                                <option value="">Select type</option>
                                                {STORE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Expiry Date</label><input type="date" name="expiryDate" value={storeForm.expiryDate} onChange={handleStoreChange} /></div>
                                        <div className="form-group"><label>Price</label><input type="number" min="0" step="0.01" name="price" value={storeForm.price} onChange={handleStoreChange} /></div>
                                        <div className="form-group"><label>Product Quantity</label><input type="number" min="0" name="quantity" value={storeForm.quantity} onChange={handleStoreChange} /></div>
                                        <div className="form-group"><label>Inward Date</label><input type="date" name="inwardDate" value={storeForm.inwardDate} onChange={handleStoreChange} /></div>
                                        <div className="form-group"><label>Outward Date</label><input type="date" name="outwardDate" value={storeForm.outwardDate} onChange={handleStoreChange} /></div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setStoreModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={saveStoreItem}>Add Product</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {foodModalOpen && (
                        <div className="modal-overlay" onClick={() => setFoodModalOpen(false)}>
                            <div className="modal inventory-modal food-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Add Food Item</h2>
                                    <button className="close-btn" onClick={() => setFoodModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group"><label>Food Item Name *</label><input name="name" value={foodForm.name} onChange={handleFoodChange} /></div>
                                        <div className="form-group">
                                            <label>Food Type *</label>
                                            <select name="category" value={foodForm.category} onChange={handleFoodChange}>
                                                <option value="">Select food type</option>
                                                {FOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Quantity *</label><input type="number" min="0" name="quantity" value={foodForm.quantity} onChange={handleFoodChange} /></div>
                                        <div className="form-group"><label>Supplier</label><input name="supplier" value={foodForm.supplier} onChange={handleFoodChange} /></div>
                                        <div className="form-group"><label>Unit Cost</label><input type="number" min="0" step="0.01" name="cost" value={foodForm.cost} onChange={handleFoodChange} /></div>
                                        <div className="form-group"><label>Reorder Level</label><input type="number" min="0" name="reorderLevel" value={foodForm.reorderLevel} onChange={handleFoodChange} /></div>
                                        <div className="form-group"><label>Expiry Date</label><input type="date" name="expiryDate" value={foodForm.expiryDate} onChange={handleFoodChange} /></div>
                                        <div className="form-group form-group-full"><label>Notes</label><textarea name="description" value={foodForm.description} onChange={handleFoodChange} rows="3" /></div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setFoodModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={saveFoodItem}>Add Food Item</button>
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
