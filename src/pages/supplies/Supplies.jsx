import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import "./supplies.css";

const MEDICINE_TYPES = ["Syrup", "Ointment", "Tablet", "Injection", "Drop"];
const STORE_TYPES = ["Food", "Bed", "Treat"];

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
    const [loadingMedicines, setLoadingMedicines] = useState(true);
    const [loadingStoreItems, setLoadingStoreItems] = useState(true);
    const [search, setSearch] = useState("");
    const [medicineModalOpen, setMedicineModalOpen] = useState(false);
    const [storeModalOpen, setStoreModalOpen] = useState(false);
    const [medicineForm, setMedicineForm] = useState(emptyMedicine);
    const [storeForm, setStoreForm] = useState(emptyStoreItem);

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

    useEffect(() => {
        fetchMedicines();
        fetchStoreItems();
    }, [fetchMedicines, fetchStoreItems]);

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

    const handleMedicineChange = (event) => {
        const { name, value } = event.target;
        setMedicineForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStoreChange = (event) => {
        const { name, value } = event.target;
        setStoreForm((prev) => ({ ...prev, [name]: value }));
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
                    </div>

                    <section className="supplies-medicine-panel">
                        <div className="section-header">
                            <div>
                                <h2>{activeSection === "medicine" ? "Medicine Stock" : "Store Stock"}</h2>
                                <p className="info-text">Stock is added here and given from Pharmacy or Store pages</p>
                            </div>
                            {activeSection === "medicine" ? (
                                <button className="btn btn-primary" onClick={() => setMedicineModalOpen(true)}>Add Medicine</button>
                            ) : (
                                <button className="btn btn-primary" onClick={() => setStoreModalOpen(true)}>Add Store Product</button>
                            )}
                        </div>

                        <div className="inventory-toolbar">
                            <input
                                type="search"
                                placeholder={activeSection === "medicine" ? "Search medicines" : "Search store stock"}
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
                </div>
            </div>
        </div>
    );
};

export default Supplies;
