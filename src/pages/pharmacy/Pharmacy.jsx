import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./pharmacy.css";

const MEDICINE_TYPES = ["Syrup", "Ointment", "Tablet", "Injection", "Drop"];

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

const emptyDelivery = {
    prescriptionId: "",
    pharmacyInventoryId: "",
    medicineName: "",
    dosage: "",
    quantity: "",
    recipientType: "pet",
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

const getExpiryClass = (dateValue) => {
    if (!dateValue) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateValue);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expiry-expired";
    if (diffDays <= 30) return "expiry-soon";
    return "";
};

const getDeliveredQuantity = (prescription) => (
    prescription.pharmacyDeliveries?.reduce((sum, delivery) => sum + (delivery.quantity || 0), 0) || 0
);

const Pharmacy = ({ clinicId: propClinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { id: paramClinicId } = useParams();
    const currentUser = AuthService.getCurrentUser();
    const clinicId = propClinicId || paramClinicId || localStorage.getItem("selectedClinicId");

    const [activeTab, setActiveTab] = useState("prescriptions");
    const [medicines, setMedicines] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [deliveryHistory, setDeliveryHistory] = useState([]);
    const [pets, setPets] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine] = useState(null);
    const [stockMedicine] = useState(null);
    const [formData, setFormData] = useState(emptyMedicine);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState(emptyDelivery);

    const totalStockAmount = useMemo(() => {
        const stock = Number(formData.stock || 0);
        const payable = Number(formData.payable || 0);
        return stock * payable;
    }, [formData.stock, formData.payable]);

    const fetchMedicines = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pharmacy`);
            setMedicines(parseArrayResponse(response));
        } catch (error) {
            enqueueSnackbar("Failed to load medicine stock", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchPrescriptions = useCallback(async () => {
        if (!clinicId) return;
        try {
            setPrescriptionsLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/prescriptions/active`);
            setPrescriptions(parseArrayResponse(response));
        } catch (error) {
            enqueueSnackbar("Failed to load prescriptions", { variant: "error" });
        } finally {
            setPrescriptionsLoading(false);
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
            console.error("Failed to load pharmacy recipients:", error);
        }
    }, [clinicId]);

    const fetchDeliveryHistory = useCallback(async () => {
        if (!clinicId) return;
        try {
            setHistoryLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pharmacy/delivery`);
            setDeliveryHistory(parseArrayResponse(response));
        } catch (error) {
            enqueueSnackbar("Failed to load medicine history", { variant: "error" });
        } finally {
            setHistoryLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    useEffect(() => {
        fetchMedicines();
        fetchPrescriptions();
        fetchRecipients();
        fetchDeliveryHistory();
    }, [fetchMedicines, fetchPrescriptions, fetchRecipients, fetchDeliveryHistory]);

    const filteredMedicines = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return medicines;
        return medicines.filter((medicine) => (
            medicine.productName?.toLowerCase().includes(query)
            || medicine.dosage?.toLowerCase().includes(query)
            || medicine.type?.toLowerCase().includes(query)
            || medicine.vendor?.toLowerCase().includes(query)
        ));
    }, [medicines, searchTerm]);

    const filteredPrescriptions = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return prescriptions;
        return prescriptions.filter((prescription) => (
            prescription.medicineName?.toLowerCase().includes(query)
            || prescription.pet?.name?.toLowerCase().includes(query)
            || prescription.vet?.firstName?.toLowerCase().includes(query)
            || prescription.vet?.lastName?.toLowerCase().includes(query)
        ));
    }, [prescriptions, searchTerm]);

    const filteredHistory = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return deliveryHistory;
        return deliveryHistory.filter((delivery) => (
            delivery.medicineName?.toLowerCase().includes(query)
            || delivery.pet?.name?.toLowerCase().includes(query)
            || delivery.customer?.firstName?.toLowerCase().includes(query)
            || delivery.customer?.lastName?.toLowerCase().includes(query)
        ));
    }, [deliveryHistory, searchTerm]);

    const validateMedicine = () => {
        if (!formData.productName.trim()) {
            enqueueSnackbar("Product name is required", { variant: "error" });
            return false;
        }
        if (!formData.type) {
            enqueueSnackbar("Type is required", { variant: "error" });
            return false;
        }
        if (Number(formData.stock || 0) < 0) {
            enqueueSnackbar("Stock cannot be negative", { variant: "error" });
            return false;
        }
        if (Number(formData.payable || 0) > Number(formData.mrp || 0)) {
            enqueueSnackbar("Payable amount cannot exceed MRP", { variant: "error" });
            return false;
        }
        if (formData.mfgDate && formData.expDate && new Date(formData.expDate) <= new Date(formData.mfgDate)) {
            enqueueSnackbar("Expiry date must be greater than manufacturing date", { variant: "error" });
            return false;
        }
        return true;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const buildPayload = () => ({
        ...formData,
        stock: Number(formData.stock || 0),
        mrp: Number(formData.mrp || 0),
        discount: Number(formData.discount || 0),
        payable: Number(formData.payable || 0),
    });

    const handleSave = async () => {
        if (!validateMedicine()) return;
        try {
            if (stockMedicine) {
                await HttpService.putWithAuth(`/clinics/${clinicId}/pharmacy/${stockMedicine.id}/stock`, {
                    stock: Number(formData.stock || 0),
                    expDate: formData.expDate,
                    mrp: Number(formData.mrp || 0),
                    discount: Number(formData.discount || 0),
                    payable: Number(formData.payable || 0),
                });
                enqueueSnackbar("Medicine stock updated", { variant: "success" });
            } else if (editingMedicine) {
                await HttpService.putWithAuth(`/clinics/${clinicId}/pharmacy/${editingMedicine.id}`, buildPayload());
                enqueueSnackbar("Medicine updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/pharmacy`, buildPayload());
                enqueueSnackbar("Medicine added", { variant: "success" });
            }
            setIsModalOpen(false);
            fetchMedicines();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to save medicine", { variant: "error" });
        }
    };

    const handleDeliveryChange = (event) => {
        const { name, value } = event.target;
        setDeliveryForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "pharmacyInventoryId") {
                const selected = medicines.find((medicine) => medicine.id === value);
                if (selected) {
                    next.medicineName = selected.productName || prev.medicineName;
                    next.dosage = selected.dosage || prev.dosage;
                }
            }
            return next;
        });
    };

    const openDeliveryForPrescription = (prescription) => {
        const matchingMedicine = medicines.find((medicine) =>
            medicine.productName?.toLowerCase() === prescription.medicineName?.toLowerCase()
        );
        setDeliveryForm({
            ...emptyDelivery,
            prescriptionId: prescription.id,
            pharmacyInventoryId: matchingMedicine?.id || "",
            medicineName: prescription.medicineName || "",
            dosage: prescription.dosage || "",
            quantity: "",
            recipientType: "pet",
            petId: prescription.pet?.id || "",
            customerId: prescription.pet?.owner?.id || "",
            notes: "",
        });
        setDeliveryModalOpen(true);
    };

    const openDeliveryForStock = (medicine) => {
        setDeliveryForm({
            ...emptyDelivery,
            pharmacyInventoryId: medicine.id,
            medicineName: medicine.productName || "",
            dosage: medicine.dosage || "",
            quantity: "",
        });
        setDeliveryModalOpen(true);
    };

    const handleGiveMedicine = async () => {
        if (!currentUser?.id) {
            enqueueSnackbar("Logged-in pharmacist user not found", { variant: "error" });
            return;
        }
        if (!deliveryForm.pharmacyInventoryId) {
            enqueueSnackbar("Select a stock medicine to dispense", { variant: "error" });
            return;
        }
        if (!deliveryForm.quantity || Number(deliveryForm.quantity) <= 0) {
            enqueueSnackbar("Quantity must be greater than 0", { variant: "error" });
            return;
        }
        if (deliveryForm.recipientType === "pet" && !deliveryForm.petId) {
            enqueueSnackbar("Select a pet recipient", { variant: "error" });
            return;
        }
        if (deliveryForm.recipientType === "customer" && !deliveryForm.customerId) {
            enqueueSnackbar("Select a customer recipient", { variant: "error" });
            return;
        }

        try {
            const response = await HttpService.postWithAuth(`/clinics/${clinicId}/pharmacy/delivery`, {
                prescriptionId: deliveryForm.prescriptionId || null,
                pharmacyInventoryId: deliveryForm.pharmacyInventoryId,
                medicineName: deliveryForm.medicineName,
                dosage: deliveryForm.dosage,
                quantity: Number(deliveryForm.quantity),
                petId: deliveryForm.recipientType === "pet" ? deliveryForm.petId : null,
                customerId: deliveryForm.recipientType === "customer" ? deliveryForm.customerId : null,
                deliveredBy: currentUser.id,
                notes: deliveryForm.notes,
            });
            const createdDelivery = response?.data || response;
            enqueueSnackbar("Medicine given from stock", { variant: "success" });
            if (createdDelivery?.id) {
                setDeliveryHistory((prev) => [createdDelivery, ...prev.filter((item) => item.id !== createdDelivery.id)]);
            }
            setActiveTab("history");
            setDeliveryModalOpen(false);
            fetchMedicines();
            fetchPrescriptions();
            fetchDeliveryHistory();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || "Failed to give medicine", { variant: "error" });
        }
    };

    const renderMedicineTable = (showGiveAction = false) => (
        <div className="pharmacy-table">
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Dosage</th>
                        <th>Power</th>
                        <th>Type</th>
                        <th>Weight</th>
                        <th>MFG Date</th>
                        <th>Expiry Date</th>
                        <th>Vendor</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Payable</th>
                        <th>Stock</th>
                        <th>Total Stock Amount</th>
                        <th>Inward Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMedicines.map((medicine) => (
                        <tr key={medicine.id}>
                            <td>{medicine.productName}</td>
                            <td>{medicine.dosage || "-"}</td>
                            <td>{medicine.power || "-"}</td>
                            <td>{medicine.type}</td>
                            <td>{medicine.weight || "-"}</td>
                            <td>{medicine.mfgDate ? new Date(medicine.mfgDate).toLocaleDateString() : "-"}</td>
                            <td className={getExpiryClass(medicine.expDate)}>
                                {medicine.expDate ? new Date(medicine.expDate).toLocaleDateString() : "-"}
                            </td>
                            <td>{medicine.vendor || "-"}</td>
                            <td>{toCurrency(medicine.mrp)}</td>
                            <td>{toCurrency(medicine.discount)}</td>
                            <td>{toCurrency(medicine.payable)}</td>
                            <td>{medicine.stock || 0}</td>
                            <td>{toCurrency((medicine.stock || 0) * (medicine.payable || 0))}</td>
                            <td>{medicine.inwardDate ? new Date(medicine.inwardDate).toLocaleDateString() : "-"}</td>
                            <td className="actions">
                                {showGiveAction && (
                                    <button className="btn-action primary" onClick={() => openDeliveryForStock(medicine)} title="Give medicine">Give</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="pharmacy">
            <div className="pharmacy-container">
                <div className="pharmacy-content">
                    <div className="page-header">
                        <div>
                            <h1>Pharmacy</h1>
                            <p>Review doctor prescriptions and dispense medicines from stock</p>
                        </div>
                    </div>

                    <div className="pharmacy-tabs">
                        <button className={`tab-btn ${activeTab === "prescriptions" ? "active" : ""}`} onClick={() => setActiveTab("prescriptions")}>
                            Prescription
                        </button>
                        <button className={`tab-btn ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>
                            Give From Stock
                        </button>
                        <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                            Given History
                        </button>
                    </div>

                    <div className="inventory-toolbar">
                        <input
                            type="search"
                            placeholder={activeTab === "prescriptions" ? "Search medicine, pet, or doctor" : activeTab === "history" ? "Search given medicine history" : "Search product, dosage, type, or vendor"}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    {activeTab === "prescriptions" && (
                        prescriptionsLoading ? (
                            <p>Loading prescriptions...</p>
                        ) : (
                            <div className="pharmacy-table prescriptions-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Pet</th>
                                            <th>Owner</th>
                                            <th>Doctor</th>
                                            <th>Dosage</th>
                                            <th>Frequency</th>
                                            <th>Duration</th>
                                            <th>Delivered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPrescriptions.map((prescription) => (
                                            <tr key={prescription.id}>
                                                <td>{prescription.medicineName}</td>
                                                <td>{prescription.pet?.name || "-"}</td>
                                                <td>
                                                    {prescription.pet?.owner
                                                        ? `${prescription.pet.owner.firstName || ""} ${prescription.pet.owner.lastName || ""}`.trim()
                                                        : "-"}
                                                </td>
                                                <td>{prescription.vet ? `Dr. ${prescription.vet.firstName || ""} ${prescription.vet.lastName || ""}`.trim() : "-"}</td>
                                                <td>{prescription.dosage}</td>
                                                <td>{prescription.frequency}</td>
                                                <td>{prescription.duration}</td>
                                                <td>{getDeliveredQuantity(prescription)}</td>
                                                <td className="actions">
                                                    <button className="btn-action primary" onClick={() => openDeliveryForPrescription(prescription)}>
                                                        Give
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {activeTab === "stock" && (
                        loading ? <p>Loading stock...</p> : renderMedicineTable(true)
                    )}

                    {activeTab === "history" && (
                        historyLoading ? <p>Loading history...</p> : (
                            <div className="pharmacy-table prescriptions-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Quantity</th>
                                            <th>Dosage</th>
                                            <th>Pet</th>
                                            <th>Customer</th>
                                            <th>Given By</th>
                                            <th>Date</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((delivery) => (
                                            <tr key={delivery.id}>
                                                <td>{delivery.medicineName}</td>
                                                <td>{delivery.quantity}</td>
                                                <td>{delivery.dosage || "-"}</td>
                                                <td>{delivery.pet?.name || "-"}</td>
                                                <td>{delivery.customer ? `${delivery.customer.firstName || ""} ${delivery.customer.lastName || ""}`.trim() : "-"}</td>
                                                <td>{delivery.staff ? `${delivery.staff.firstName || ""} ${delivery.staff.lastName || ""}`.trim() : "-"}</td>
                                                <td>{delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : "-"}</td>
                                                <td>{delivery.notes || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {isModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{stockMedicine ? "Update Stock" : editingMedicine ? "Edit Medicine" : "Add Medicine"}</h2>
                                    <button className="close-btn" onClick={() => setIsModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group"><label>Product Name *</label><input name="productName" value={formData.productName} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>Dosage</label><input name="dosage" value={formData.dosage} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>Power</label><input name="power" value={formData.power} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group">
                                            <label>Type *</label>
                                            <select name="type" value={formData.type} onChange={handleChange} disabled={!!stockMedicine}>
                                                <option value="">Select type</option>
                                                {MEDICINE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Weight</label><input name="weight" value={formData.weight} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>MFG Date</label><input type="date" name="mfgDate" value={formData.mfgDate} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>Expiry Date</label><input type="date" name="expDate" value={formData.expDate} onChange={handleChange} /></div>
                                        <div className="form-group"><label>MRP</label><input type="number" min="0" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} /></div>
                                        <div className="form-group"><label>Discount</label><input type="number" min="0" step="0.01" name="discount" value={formData.discount} onChange={handleChange} /></div>
                                        <div className="form-group"><label>Vendor</label><input name="vendor" value={formData.vendor} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>Payable Amount</label><input type="number" min="0" step="0.01" name="payable" value={formData.payable} onChange={handleChange} /></div>
                                        <div className="form-group"><label>Stock Quantity</label><input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} /></div>
                                        <div className="form-group"><label>Inward Date</label><input type="date" name="inwardDate" value={formData.inwardDate} onChange={handleChange} disabled={!!stockMedicine} /></div>
                                        <div className="form-group"><label>Total Amount of Stock</label><input value={toCurrency(totalStockAmount)} readOnly /></div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSave}>{stockMedicine ? "Update Stock" : editingMedicine ? "Update Medicine" : "Add Medicine"}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {deliveryModalOpen && (
                        <div className="modal-overlay" onClick={() => setDeliveryModalOpen(false)}>
                            <div className="modal inventory-modal" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Give Medicine</h2>
                                    <button className="close-btn" onClick={() => setDeliveryModalOpen(false)}>x</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Stock Medicine *</label>
                                            <select name="pharmacyInventoryId" value={deliveryForm.pharmacyInventoryId} onChange={handleDeliveryChange}>
                                                <option value="">Select stock item</option>
                                                {medicines.map((medicine) => (
                                                    <option key={medicine.id} value={medicine.id}>
                                                        {medicine.productName} {medicine.dosage ? `- ${medicine.dosage}` : ""} (Stock: {medicine.stock || 0})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Medicine Name</label><input name="medicineName" value={deliveryForm.medicineName} onChange={handleDeliveryChange} /></div>
                                        <div className="form-group"><label>Dosage</label><input name="dosage" value={deliveryForm.dosage} onChange={handleDeliveryChange} /></div>
                                        <div className="form-group"><label>Quantity *</label><input type="number" min="1" name="quantity" value={deliveryForm.quantity} onChange={handleDeliveryChange} /></div>
                                        <div className="form-group">
                                            <label>Give To</label>
                                            <select name="recipientType" value={deliveryForm.recipientType} onChange={handleDeliveryChange}>
                                                <option value="pet">Pet</option>
                                                <option value="customer">Customer</option>
                                            </select>
                                        </div>
                                        {deliveryForm.recipientType === "pet" ? (
                                            <div className="form-group">
                                                <label>Pet *</label>
                                                <select name="petId" value={deliveryForm.petId} onChange={handleDeliveryChange}>
                                                    <option value="">Select pet</option>
                                                    {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label>Customer *</label>
                                                <select name="customerId" value={deliveryForm.customerId} onChange={handleDeliveryChange}>
                                                    <option value="">Select customer</option>
                                                    {customers.map((customer) => (
                                                        <option key={customer.id} value={customer.id}>
                                                            {customer.firstName} {customer.lastName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group form-grid-wide">
                                            <label>Notes</label>
                                            <textarea name="notes" value={deliveryForm.notes} onChange={handleDeliveryChange} rows="2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setDeliveryModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleGiveMedicine}>Give Medicine</button>
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
