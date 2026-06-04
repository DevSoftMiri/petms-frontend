import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import "./pharmacy.css";

const Pharmacy = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    // Tabs state
    const [activeTab, setActiveTab] = useState("inventory"); // inventory, prescriptions, history

    // Inventory state
    const [medicines, setMedicines] = useState([]);
    const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [medicineFormData, setMedicineFormData] = useState({
        medicineName: "",
        dosage: "",
        unitPrice: 0,
        quantity: 0,
        supplier: "",
        expiryDate: "",
        category: "Other",
        description: "",
    });

    // Prescriptions state
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPetFilter, setSelectedPetFilter] = useState("");
    const [pets, setPets] = useState([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

    // Delivery modal state
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [deliveryFormData, setDeliveryFormData] = useState({
        quantity: 0,
        recipientType: "pet", // pet or customer
        recipientId: "",
        notes: "",
    });
    const [customers, setCustomers] = useState([]);

    // Delivery history state
    const [deliveryHistory, setDeliveryHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Generic loading state
    const [loading, setLoading] = useState(true);

    // Fetch medicines
    const fetchMedicines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/supplies`);
            const data = Array.isArray(response) ? response : response.data || [];
            const filteredMedicines = data.filter(item => item.type === 'medicine' || !item.type);
            const mapped = filteredMedicines.map(item => ({
                ...item,
                medicineName: item.name,
                unitPrice: item.cost || 0,
            }));
            setMedicines(mapped);
        } catch (error) {
            enqueueSnackbar("Failed to load medicines", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // Fetch prescriptions
    const fetchPrescriptions = useCallback(async () => {
        try {
            setPrescriptionsLoading(true);
            const url = selectedPetFilter
                ? `/clinics/${clinicId}/prescriptions/pet/${selectedPetFilter}`
                : `/clinics/${clinicId}/prescriptions`;
            const response = await HttpService.getWithAuth(url);
            const data = response.data || response || [];
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            enqueueSnackbar("Failed to load prescriptions", { variant: "error" });
        } finally {
            setPrescriptionsLoading(false);
        }
    }, [clinicId, selectedPetFilter, enqueueSnackbar]);

    // Fetch pets for filter
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

    // Fetch delivery history
    const fetchDeliveryHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pharmacy/delivery`);
            const data = response.data || response || [];
            setDeliveryHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            enqueueSnackbar("Failed to load delivery history", { variant: "error" });
        } finally {
            setHistoryLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // Initial load
    useEffect(() => {
        if (clinicId) {
            fetchMedicines();
            fetchPets();
            fetchCustomers();
        }
    }, [clinicId, fetchMedicines, fetchPets, fetchCustomers]);

    // Load prescriptions when tab changes
    useEffect(() => {
        if (activeTab === "prescriptions") {
            fetchPrescriptions();
        }
    }, [activeTab, fetchPrescriptions]);

    // Load history when tab changes
    useEffect(() => {
        if (activeTab === "history") {
            fetchDeliveryHistory();
        }
    }, [activeTab, fetchDeliveryHistory]);

    // Handle medicine form
    const handleAddMedicine = () => {
        setEditingMedicine(null);
        setMedicineFormData({
            medicineName: "",
            dosage: "",
            unitPrice: 0,
            quantity: 0,
            supplier: "",
            expiryDate: "",
            category: "Other",
            description: "",
        });
        setIsAddMedicineModalOpen(true);
    };

    const handleEditMedicine = (medicine) => {
        setEditingMedicine(medicine);
        const formattedDate = medicine.expiryDate
            ? new Date(medicine.expiryDate).toISOString().split("T")[0]
            : "";
        setMedicineFormData({
            ...medicine,
            expiryDate: formattedDate,
        });
        setIsAddMedicineModalOpen(true);
    };

    const handleSaveMedicine = async () => {
        try {
            if (!medicineFormData.medicineName || !medicineFormData.unitPrice || !medicineFormData.quantity) {
                enqueueSnackbar("Medicine name, price, and quantity are required", { variant: "error" });
                return;
            }

            if (editingMedicine) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/supplies/${editingMedicine.id || editingMedicine._id}`,
                    {
                        name: medicineFormData.medicineName,
                        dosage: medicineFormData.dosage,
                        quantity: parseInt(medicineFormData.quantity) || 0,
                        cost: parseFloat(medicineFormData.unitPrice) || 0,
                        supplier: medicineFormData.supplier,
                        expiryDate: medicineFormData.expiryDate,
                        category: medicineFormData.category,
                        description: medicineFormData.description,
                        type: "medicine",
                    }
                );
                enqueueSnackbar("Medicine updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/supplies`, {
                    name: medicineFormData.medicineName,
                    dosage: medicineFormData.dosage,
                    quantity: parseInt(medicineFormData.quantity) || 0,
                    cost: parseFloat(medicineFormData.unitPrice) || 0,
                    supplier: medicineFormData.supplier,
                    expiryDate: medicineFormData.expiryDate,
                    category: medicineFormData.category,
                    description: medicineFormData.description,
                    type: "medicine",
                });
                enqueueSnackbar("Medicine created", { variant: "success" });
            }

            setIsAddMedicineModalOpen(false);
            fetchMedicines();
        } catch (error) {
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

    const handleMedicineInputChange = (e) => {
        const { name, value } = e.target;
        setMedicineFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle delivery modal
    const handleOpenDeliveryModal = (prescription) => {
        setSelectedPrescription(prescription);
        setDeliveryFormData({
            quantity: 0,
            recipientType: "pet",
            recipientId: prescription.pet?.id || "",
            notes: "",
        });
        setIsDeliveryModalOpen(true);
    };

    const handleDeliveryInputChange = (e) => {
        const { name, value } = e.target;
        setDeliveryFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRecordDelivery = async () => {
        try {
            if (!deliveryFormData.quantity || deliveryFormData.quantity <= 0) {
                enqueueSnackbar("Quantity must be greater than 0", { variant: "error" });
                return;
            }

            if (!deliveryFormData.recipientId) {
                enqueueSnackbar("Please select a recipient", { variant: "error" });
                return;
            }

            // Get current user ID from token or session (simplified - adjust based on your auth setup)
            const userId = localStorage.getItem('userId') || 'current-user';

            await HttpService.postWithAuth(`/clinics/${clinicId}/pharmacy/delivery`, {
                prescriptionId: selectedPrescription.id,
                medicineName: selectedPrescription.medicineName,
                quantity: parseInt(deliveryFormData.quantity),
                dosage: selectedPrescription.dosage,
                petId: deliveryFormData.recipientType === "pet" ? deliveryFormData.recipientId : null,
                customerId: deliveryFormData.recipientType === "customer" ? deliveryFormData.recipientId : null,
                deliveredBy: userId,
                notes: deliveryFormData.notes,
            });

            enqueueSnackbar("Medicine delivery recorded", { variant: "success" });
            setIsDeliveryModalOpen(false);
            fetchDeliveryHistory();
            fetchPrescriptions();
        } catch (error) {
            enqueueSnackbar("Failed to record delivery", { variant: "error" });
        }
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="pharmacy">
            <div className="pharmacy-container">
                <div className="pharmacy-content">
                    <div className="page-header">
                        <div>
                            <h1>Pharmacy</h1>
                            <p>Manage medicines, prescriptions, and deliveries</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="pharmacy-tabs">
                        <button
                            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
                            onClick={() => setActiveTab("inventory")}
                        >
                            📦 Inventory
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "prescriptions" ? "active" : ""}`}
                            onClick={() => setActiveTab("prescriptions")}
                        >
                            💊 Prescriptions
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                            onClick={() => setActiveTab("history")}
                        >
                            📋 Delivery History
                        </button>
                    </div>

                    {/* Inventory Tab */}
                    {activeTab === "inventory" && (
                        <>
                            <div className="tab-header">
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
                                                <tr key={medicine.id || medicine._id}>
                                                    <td>{medicine.medicineName}</td>
                                                    <td>{medicine.dosage}</td>
                                                    <td>₹{medicine.unitPrice?.toFixed(2)}</td>
                                                    <td>{medicine.quantity}</td>
                                                    <td>{medicine.supplier}</td>
                                                    <td>{medicine.category}</td>
                                                    <td>
                                                        {medicine.expiryDate
                                                            ? new Date(medicine.expiryDate).toLocaleDateString()
                                                            : "N/A"}
                                                    </td>
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
                                                            onClick={() => handleDeleteMedicine(medicine.id || medicine._id)}
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

                    {/* Prescriptions Tab */}
                    {activeTab === "prescriptions" && (
                        <>
                            <div className="prescriptions-filter">
                                <label>Filter by Pet:</label>
                                <select
                                    value={selectedPetFilter}
                                    onChange={(e) => setSelectedPetFilter(e.target.value)}
                                >
                                    <option value="">All Pets</option>
                                    {pets.map((pet) => (
                                        <option key={pet.id} value={pet.id}>
                                            {pet.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {prescriptionsLoading ? (
                                <p>Loading prescriptions...</p>
                            ) : prescriptions.length === 0 ? (
                                <p>No prescriptions found</p>
                            ) : (
                                <div className="prescriptions-list">
                                    {prescriptions.map((prescription) => (
                                        <div key={prescription.id} className="prescription-card">
                                            <div className="prescription-info">
                                                <h3>{prescription.medicineName}</h3>
                                                <p><strong>Pet:</strong> {prescription.pet?.name || "N/A"}</p>
                                                <p><strong>Dosage:</strong> {prescription.dosage}</p>
                                                <p><strong>Frequency:</strong> {prescription.frequency}</p>
                                                <p><strong>Duration:</strong> {prescription.duration}</p>
                                                <p><strong>Diagnosed by:</strong> {prescription.vet?.firstName} {prescription.vet?.lastName}</p>
                                                <p><strong>Prescribed:</strong> {new Date(prescription.prescribedAt).toLocaleDateString()}</p>
                                                {prescription.notes && <p><strong>Notes:</strong> {prescription.notes}</p>}
                                            </div>
                                            <button
                                                className="btn btn-primary btn-small"
                                                onClick={() => handleOpenDeliveryModal(prescription)}
                                            >
                                                Give Medicine
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Delivery History Tab */}
                    {activeTab === "history" && (
                        <>
                            {historyLoading ? (
                                <p>Loading delivery history...</p>
                            ) : deliveryHistory.length === 0 ? (
                                <p>No delivery history</p>
                            ) : (
                                <div className="pharmacy-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Medicine</th>
                                                <th>Quantity</th>
                                                <th>Pet</th>
                                                <th>Customer</th>
                                                <th>Delivered By</th>
                                                <th>Date</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deliveryHistory.map((delivery) => (
                                                <tr key={delivery.id}>
                                                    <td>{delivery.medicineName}</td>
                                                    <td>{delivery.quantity}</td>
                                                    <td>{delivery.pet?.name || "-"}</td>
                                                    <td>
                                                        {delivery.customer
                                                            ? `${delivery.customer.firstName} ${delivery.customer.lastName}`
                                                            : "-"}
                                                    </td>
                                                    <td>{delivery.staff?.firstName} {delivery.staff?.lastName}</td>
                                                    <td>{new Date(delivery.deliveryDate).toLocaleDateString()}</td>
                                                    <td>{delivery.notes || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Add/Edit Medicine Modal */}
                    {isAddMedicineModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsAddMedicineModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h2>
                                    <button className="close-btn" onClick={() => setIsAddMedicineModalOpen(false)}>
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
                                            value={medicineFormData.medicineName}
                                            onChange={handleMedicineInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={medicineFormData.category} onChange={handleMedicineInputChange}>
                                            <option value="Other">Other</option>
                                            <option value="Antibiotic">Antibiotic</option>
                                            <option value="Painkiller">Painkiller</option>
                                            <option value="Vaccine">Vaccine</option>
                                            <option value="Supplement">Supplement</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Dosage</label>
                                        <input
                                            type="text"
                                            name="dosage"
                                            placeholder="Enter dosage (e.g., 250mg)"
                                            value={medicineFormData.dosage}
                                            onChange={handleMedicineInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            placeholder="Enter description"
                                            value={medicineFormData.description}
                                            onChange={handleMedicineInputChange}
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
                                                value={medicineFormData.unitPrice}
                                                onChange={handleMedicineInputChange}
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
                                                value={medicineFormData.quantity}
                                                onChange={handleMedicineInputChange}
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
                                            value={medicineFormData.supplier}
                                            onChange={handleMedicineInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={medicineFormData.expiryDate}
                                            onChange={handleMedicineInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsAddMedicineModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveMedicine}>
                                        {editingMedicine ? "Update Medicine" : "Add Medicine"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Modal */}
                    {isDeliveryModalOpen && selectedPrescription && (
                        <div className="modal-overlay" onClick={() => setIsDeliveryModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Record Medicine Delivery</h2>
                                    <button className="close-btn" onClick={() => setIsDeliveryModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label><strong>Medicine:</strong> {selectedPrescription.medicineName}</label>
                                    </div>
                                    <div className="form-group">
                                        <label><strong>Prescribed Dosage:</strong> {selectedPrescription.dosage}</label>
                                    </div>
                                    <div className="form-group">
                                        <label>Quantity to Give *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            placeholder="Enter quantity"
                                            value={deliveryFormData.quantity}
                                            onChange={handleDeliveryInputChange}
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Give To *</label>
                                        <select name="recipientType" value={deliveryFormData.recipientType} onChange={handleDeliveryInputChange}>
                                            <option value="pet">Pet</option>
                                            <option value="customer">Customer</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Recipient *</label>
                                        {deliveryFormData.recipientType === "pet" ? (
                                            <select
                                                name="recipientId"
                                                value={deliveryFormData.recipientId}
                                                onChange={handleDeliveryInputChange}
                                                required
                                            >
                                                <option value="">Select Pet</option>
                                                {pets.map((pet) => (
                                                    <option key={pet.id} value={pet.id}>
                                                        {pet.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                name="recipientId"
                                                value={deliveryFormData.recipientId}
                                                onChange={handleDeliveryInputChange}
                                                required
                                            >
                                                <option value="">Select Customer</option>
                                                {customers.map((customer) => (
                                                    <option key={customer.id} value={customer.id}>
                                                        {customer.firstName} {customer.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            name="notes"
                                            placeholder="Add any notes"
                                            value={deliveryFormData.notes}
                                            onChange={handleDeliveryInputChange}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsDeliveryModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleRecordDelivery}>
                                        Record Delivery
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
