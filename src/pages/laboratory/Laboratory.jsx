import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import { useDropzone } from "react-dropzone";
import { useLocation } from "react-router-dom";

import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import { uploadLabReport } from "../../services/StorageService";
import "./laboratory.css";

const Laboratory = ({ clinicId: propClinicId, subView: propSubView }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { state: clinicState } = useContext(ClinicContext);
    const location = useLocation();
    const clinicId = propClinicId || clinicState?.selectedClinicId;

    // Determine which sub-view to display based on URL or prop
    const getCurrentView = useCallback(() => {
        // If subView prop is provided (when used in ClinicPages), use it
        if (propSubView) {
            return propSubView;
        }
        // Otherwise, determine from URL
        const path = location.pathname;
        if (path.includes("/parameters")) return "parameters";
        if (path.includes("/inpatient")) return "inpatient";
        return "lab-reports";
    }, [location, propSubView]);

    const [currentView, setCurrentView] = useState(getCurrentView);
    const [labs, setLabs] = useState([]);
    const [labParameters, setLabParameters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
    const [isInpatientModalOpen, setIsInpatientModalOpen] = useState(false);
    const [editingParameter, setEditingParameter] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingReport, setViewingReport] = useState(null);
    const [editingLab, setEditingLab] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        petId: "",
        petName: "",
        customerCode: "",
        testType: "",
        date: "",
        result: "",
        status: "Complete",
        veterinarian: "",
        notes: "",
        reportUrl: "",
    });

    const [parameterFormData, setParameterFormData] = useState({
        name: "",
        category: "",
        unit: "",
        normalRange: "",
        description: "",
    });

    const [allPets, setAllPets] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [filteredPets, setFilteredPets] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showPetDropdown, setShowPetDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPets = useCallback(async () => {
        if (!clinicId) return;
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/pets?limit=100`);
            const data = Array.isArray(response) ? response : response.data || [];
            setAllPets(data);
        } catch (error) {
            console.error("Error loading pets:", error);
        }
    }, [clinicId]);

    const fetchCustomers = useCallback(async () => {
        if (!clinicId) return;
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/customers?limit=100`);
            const data = Array.isArray(response) ? response : response.data || [];
            setAllCustomers(data);
        } catch (error) {
            console.error("Error loading customers:", error);
        }
    }, [clinicId]);

    const fetchLabs = useCallback(async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory`);
            const data = Array.isArray(response) ? response : response.data || [];
            setLabs(data);
        } catch (error) {
            enqueueSnackbar("Failed to load lab tests", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    const fetchLabParameters = useCallback(async () => {
        if (!clinicId) return;
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory/parameters`);
            const data = Array.isArray(response) ? response : response.data || [];
            setLabParameters(data);
        } catch (error) {
            console.error("Failed to load lab parameters:", error);
        }
    }, [clinicId]);

    useEffect(() => {
        setCurrentView(getCurrentView());
    }, [location, propSubView, getCurrentView]);

    useEffect(() => {
        if (clinicId) {
            fetchPets();
            fetchCustomers();
            fetchLabs();
            fetchLabParameters();
        }
    }, [clinicId, fetchPets, fetchCustomers, fetchLabs, fetchLabParameters]);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.type !== "application/pdf") {
                enqueueSnackbar("Please select a PDF file", { variant: "error" });
                return;
            }
            setSelectedFile(file);
        }
    }, [enqueueSnackbar]);

    useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const handleAddLab = () => {
        setEditingLab(null);
        setSelectedFile(null);
        setFormData({
            petId: "",
            petName: "",
            customerCode: "",
            testType: "",
            date: new Date().toISOString().split("T")[0],
            result: "",
            status: "Complete",
            veterinarian: "",
            notes: "",
            reportUrl: "",
        });
        setShowPetDropdown(false);
        setShowCustomerDropdown(false);
        setIsModalOpen(true);
    };

    const handleEditLab = (lab) => {
        setEditingLab(lab);
        setSelectedFile(null);
        const formattedDate = lab.date ? new Date(lab.date).toISOString().split("T")[0] : "";
        setFormData({
            petId: lab.petId || "",
            petName: lab.petName || "",
            customerCode: lab.customerCode || "",
            testType: lab.testType || "",
            date: formattedDate,
            result: lab.result || "",
            status: lab.status || "Complete",
            veterinarian: lab.veterinarian || "",
            notes: lab.notes || "",
            reportUrl: lab.reportUrl || "",
        });
        if (lab.petId) {
            const existingPet = allPets.find(p => p.id === lab.petId);
            if (existingPet) {
                setFilteredPets([existingPet]);
            }
        }
        setShowCustomerDropdown(false);
        setShowPetDropdown(false);
        setIsModalOpen(true);
    };

    const handleViewReport = (lab) => {
        if (lab.reportUrl) {
            setViewingReport(lab);
            setIsViewModalOpen(true);
        } else {
            enqueueSnackbar("No report attached to this test", { variant: "warning" });
        }
    };

    const handleSaveLab = async () => {
        try {
            if (!formData.petName || !formData.testType) {
                enqueueSnackbar("Pet name and test type are required", { variant: "error" });
                return;
            }

            let reportUrl = formData.reportUrl;

            if (selectedFile) {
                setUploading(true);
                try {
                    const petId = formData.petId || "unknown";
                    const labId = editingLab?._id || "new";
                    reportUrl = await uploadLabReport(selectedFile, clinicId, petId, labId);
                } catch (uploadError) {
                    enqueueSnackbar(`Failed to upload PDF: ${uploadError.message}`, { variant: "error" });
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const payload = {
                ...formData,
                reportUrl,
            };

            if (editingLab) {
                await HttpService.putWithAuth(`/clinics/${clinicId}/laboratory/${editingLab._id}`, payload);
                enqueueSnackbar("Lab test updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/laboratory`, payload);
                enqueueSnackbar("Lab test created", { variant: "success" });
            }

            setIsModalOpen(false);
            setSelectedFile(null);
            fetchLabs();
        } catch (error) {
            enqueueSnackbar("Failed to save lab test", { variant: "error" });
        }
    };

    const handleDeleteLab = (id) => {
        if (!window.confirm("Delete this lab test?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/laboratory/${id}`)
            .then(() => {
                enqueueSnackbar("Lab test deleted", { variant: "success" });
                fetchLabs();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    // Lab Parameters handlers
    const handleAddParameter = () => {
        setEditingParameter(null);
        setParameterFormData({
            name: "",
            category: "",
            unit: "",
            normalRange: "",
            description: "",
        });
        setIsParameterModalOpen(true);
    };

    const handleEditParameter = (parameter) => {
        setEditingParameter(parameter);
        setParameterFormData({
            name: parameter.name || "",
            category: parameter.category || "",
            unit: parameter.unit || "",
            normalRange: parameter.normalRange || "",
            description: parameter.description || "",
        });
        setIsParameterModalOpen(true);
    };

    const handleSaveParameter = async () => {
        try {
            if (!parameterFormData.name) {
                enqueueSnackbar("Parameter name is required", { variant: "error" });
                return;
            }

            if (editingParameter) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/laboratory/parameters/${editingParameter._id}`,
                    parameterFormData
                );
                enqueueSnackbar("Parameter updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/laboratory/parameters`,
                    parameterFormData
                );
                enqueueSnackbar("Parameter created", { variant: "success" });
            }

            setIsParameterModalOpen(false);
            fetchLabParameters();
        } catch (error) {
            enqueueSnackbar("Failed to save parameter", { variant: "error" });
        }
    };

    const handleDeleteParameter = (id) => {
        if (!window.confirm("Delete this parameter?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/laboratory/parameters/${id}`)
            .then(() => {
                enqueueSnackbar("Parameter deleted", { variant: "success" });
                fetchLabParameters();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    // Inpatient Test handlers
    const handleAddInpatient = () => {
        setIsInpatientModalOpen(true);
    };

    const handleParameterInputChange = (e) => {
        const { name, value } = e.target;
        setParameterFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCustomerCodeChange = (e) => {
        const code = e.target.value.toUpperCase().trim();
        setFormData((prev) => ({
            ...prev,
            customerCode: code,
            petId: "",
            petName: "",
        }));

        if (code.length >= 1) {
            const matchedCustomers = allCustomers.filter((customer) => {
                const customerCode = customer.code || "";
                const customerId = customer.customerId || "";
                return customerCode.toUpperCase().includes(code) || customerId === code;
            });
            setFilteredCustomers(matchedCustomers);
            setShowCustomerDropdown(matchedCustomers.length > 0);
            setShowPetDropdown(false);
        } else {
            setFilteredCustomers([]);
            setShowCustomerDropdown(false);
        }
    };

    const handleCustomerSelect = (customer) => {
        const customerPets = allPets.filter((pet) => {
            const owner = pet.owner || pet.customer || null;
            if (owner?.id === customer.id) return true;
            if (owner?.customerId === customer.customerId) return true;
            if (owner?.code === customer.code && customer.code) return true;
            return false;
        });

        setFilteredCustomers([]);
        setShowCustomerDropdown(false);

        if (customerPets.length === 1) {
            const pet = customerPets[0];
            setFormData((prev) => ({
                ...prev,
                customerCode: customer.code || customer.customerId || "",
                petId: pet.id,
                petName: pet.name,
            }));
            setFilteredPets([]);
            setShowPetDropdown(false);
        } else if (customerPets.length > 1) {
            setFormData((prev) => ({
                ...prev,
                customerCode: customer.code || customer.customerId || "",
                petId: "",
                petName: "",
            }));
            setFilteredPets(customerPets);
            setShowPetDropdown(true);
        } else {
            setFormData((prev) => ({
                ...prev,
                customerCode: customer.code || customer.customerId || "",
                petId: "",
                petName: "",
            }));
            setFilteredPets([]);
            setShowPetDropdown(false);
        }
    };

    const handlePetSelect = (pet) => {
        setFormData((prev) => ({
            ...prev,
            petId: pet.id,
            petName: pet.name,
        }));
        setShowPetDropdown(false);
    };

    const handlePetNameChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            petName: e.target.value,
            petId: "",
        }));
    };

    const getResultClass = (result) => {
        const lower = result?.toLowerCase() || "";
        if (lower.includes("normal")) return "result-normal";
        if (lower.includes("abnormal")) return "result-abnormal";
        if (lower.includes("pending")) return "result-pending";
        if (lower.includes("allergies")) return "result-warning";
        return "result-pending";
    };

    const getStatusClass = (status) => {
        const lower = status?.toLowerCase() || "";
        if (lower.includes("complete")) return "status-complete";
        if (lower.includes("pending")) return "status-pending";
        if (lower.includes("progress")) return "status-progress";
        return "status-pending";
    };

    if (!clinicId) return <div>No clinic selected</div>;

    // Render Lab Reports view
    const renderLabReportsView = () => (
        <>
            <div className="page-header">
                <div>
                    <h1>Lab Reports</h1>
                    <p>View and manage all laboratory test results and reports</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddLab}>
                    Add Lab Test
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="laboratory-table">
                    {/* Search Bar */}
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by customer code or pet name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm("")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Customer Code</th>
                                <th>Pet Name</th>
                                <th>Test Type</th>
                                <th>Date</th>
                                <th>Result</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Report</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const filteredLabs = searchTerm
                                    ? labs.filter((lab) => {
                                        const search = searchTerm.toLowerCase();
                                        return (
                                            (lab.customerCode && lab.customerCode.toLowerCase().includes(search)) ||
                                            (lab.petName && lab.petName.toLowerCase().includes(search)) ||
                                            (lab.testType && lab.testType.toLowerCase().includes(search))
                                        );
                                    })
                                    : labs;
                                return filteredLabs.length > 0 ? (
                                    filteredLabs.map((lab) => (
                                        <tr key={lab._id}>
                                            <td>
                                                <span className="customer-code-badge">
                                                    {lab.customerCode || "-"}
                                                </span>
                                            </td>
                                            <td className="pet-name">{lab.petName}</td>
                                            <td>{lab.testType}</td>
                                            <td>{lab.date ? new Date(lab.date).toLocaleDateString() : "-"}</td>
                                            <td>
                                                <span className={`badge ${getResultClass(lab.result)}`}>
                                                    {lab.result || "-"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusClass(lab.status)}`}>
                                                    {lab.status}
                                                </span>
                                            </td>
                                            <td className="notes-cell">{lab.notes || "-"}</td>
                                            <td>
                                                {lab.reportUrl ? (
                                                    <button
                                                        className="btn btn-sm btn-view"
                                                        onClick={() => handleViewReport(lab)}
                                                        title="View Report"
                                                    >
                                                        View PDF
                                                    </button>
                                                ) : (
                                                    <span className="muted">-</span>
                                                )}
                                            </td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditLab(lab)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteLab(lab._id)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr key="empty">
                                        <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                                            No lab tests found
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    // Render Test Parameters view
    const renderParametersView = () => (
        <>
            <div className="page-header">
                <div>
                    <h1>Test Parameters</h1>
                    <p>Manage laboratory test parameters and normal ranges</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddParameter}>
                    Add Parameter
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="laboratory-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Normal Range</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labParameters.length > 0 ? (
                                labParameters.map((param) => (
                                    <tr key={param._id}>
                                        <td className="pet-name">{param.name}</td>
                                        <td>{param.category || "-"}</td>
                                        <td>{param.unit || "-"}</td>
                                        <td>{param.normalRange || "-"}</td>
                                        <td className="notes-cell">{param.description || "-"}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-action edit"
                                                onClick={() => handleEditParameter(param)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-action delete"
                                                onClick={() => handleDeleteParameter(param._id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr key="empty">
                                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                        No parameters found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    // Render Inpatient Reports view
    const renderInpatientView = () => (
        <>
            <div className="page-header">
                <div>
                    <h1>Imaging Reports</h1>
                    <p>Manage imaging tests and results</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddInpatient}>
                    Add Imaging Test
                </button>
            </div>
            <div className="empty-state">
                <p>No imaging tests recorded yet.</p>
                <p style={{ fontSize: "13px", color: "var(--c-text-3)", marginTop: "8px" }}>
                    Click "Add Imaging Test" to start adding imaging tests.
                </p>
            </div>
        </>
    );

    return (
        <>
            <div className="laboratory">
                <div className="laboratory-container">
                    <div className="laboratory-content">
                        {currentView === "parameters" && renderParametersView()}
                        {currentView === "inpatient" && renderInpatientView()}
                        {currentView === "lab-reports" && renderLabReportsView()}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingLab ? "Edit Lab Test" : "Add New Lab Test"}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                {/* Customer Code Field */}
                                <div className="form-group">
                                    <label>Customer Code</label>
                                    <input
                                        type="text"
                                        name="customerCode"
                                        placeholder="Enter customer code (e.g., HA210)"
                                        value={formData.customerCode}
                                        onChange={handleCustomerCodeChange}
                                        autoComplete="off"
                                    />

                                    {/* Customer Dropdown */}
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div className="pet-dropdown">
                                            <div className="dropdown-header">
                                                <span>Select Customer</span>
                                                <button
                                                    className="dropdown-close-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            {filteredCustomers.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    className="pet-dropdown-item"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                >
                                                    <span className="pet-name">
                                                        {customer.firstName} {customer.lastName}
                                                    </span>
                                                    <span className="pet-species">
                                                        {customer.code || customer.customerId}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pet Dropdown (shown after customer selected with multiple pets) */}
                                    {showPetDropdown && filteredPets.length > 0 && !showCustomerDropdown && (
                                        <div className="pet-dropdown">
                                            <div className="dropdown-header">
                                                <span>Select Pet</span>
                                                <button
                                                    className="dropdown-close-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowPetDropdown(false);
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            {filteredPets.map((pet) => (
                                                <div
                                                    key={pet.id}
                                                    className="pet-dropdown-item"
                                                    onClick={() => handlePetSelect(pet)}
                                                >
                                                    <span className="pet-name">{pet.name}</span>
                                                    <span className="pet-species">{pet.species}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pet Name Field */}
                                <div className="form-group">
                                    <label>Pet Name</label>
                                    <input
                                        type="text"
                                        name="petName"
                                        placeholder="Enter pet name manually"
                                        value={formData.petName}
                                        onChange={handlePetNameChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Test Type *</label>
                                    <select name="testType" value={formData.testType} onChange={handleInputChange}>
                                        <option value="">Select test type</option>
                                        <option value="Blood Test">Blood Test</option>
                                        <option value="Urinalysis">Urinalysis</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="Ultrasound">Ultrasound</option>
                                        <option value="Allergy Test">Allergy Test</option>
                                        <option value="Blood Culture">Blood Culture</option>
                                        <option value="ECG">ECG</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                {/* <div className="form-group">
                                    <label>Result</label>
                                    <select name="result" value={formData.result} onChange={handleInputChange}>
                                        <option value="">Select result</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Abnormal">Abnormal</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Allergies Found">Allergies Found</option>
                                    </select>
                                </div> */}
                                {/* <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option value="Complete">Complete</option>
                                        <option value="Pending Review">Pending Review</option>
                                        <option value="In Progress">In Progress</option>
                                    </select>
                                </div> */}
                            </div>

                            {/* <div className="form-group">
                                <label>Veterinarian</label>
                                <input
                                    type="text"
                                    name="veterinarian"
                                    placeholder="Enter veterinarian name"
                                    value={formData.veterinarian}
                                    onChange={handleInputChange}
                                />
                            </div> */}

                            {/* <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    placeholder="Enter notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div> */}

                            {/* <div className="form-group">
                                <label>Upload PDF Report</label>
                                <div
                                    {...getRootProps()}
                                    className={`file-dropzone ${isDragActive ? "active" : ""}`}
                                >
                                    <input {...getInputProps()} />
                                    {selectedFile ? (
                                        <div className="selected-file">
                                            <span>📄 {selectedFile.name}</span>
                                            <button
                                                type="button"
                                                className="btn-remove-file"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : isDragActive ? (
                                        <p>Drop the PDF here...</p>
                                    ) : (
                                        <p>Drag & drop a PDF here, or click to select</p>
                                    )}
                                </div>
                                {formData.reportUrl && !selectedFile && (
                                    <p className="existing-file">
                                        Existing report:{" "}
                                        <a href={formData.reportUrl} target="_blank" rel="noopener noreferrer">
                                            View
                                        </a>
                                    </p>
                                )}
                            </div> */}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveLab}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : editingLab ? "Update Lab Test" : "Add Lab Test"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Report Modal with Iframe */}
            {isViewModalOpen && viewingReport && (
                <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
                    <div className="modal modal-iframe" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                Lab Report - {viewingReport.petName} - {viewingReport.testType}
                            </h2>
                            <button className="close-btn" onClick={() => setIsViewModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body modal-body-iframe">
                            <iframe
                                src={viewingReport.reportUrl}
                                title="Lab Report"
                                className="pdf-iframe"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* Inpatient Test Modal */}
            {isInpatientModalOpen && (
                <div className="modal-overlay" onClick={() => setIsInpatientModalOpen(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Imaging</h2>
                            <button className="close-btn" onClick={() => setIsInpatientModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: "var(--c-text-2)", fontSize: "14px", marginBottom: "16px" }}>
                                Add Imaging details here.
                            </p>
                            <div style={{
                                padding: "20px",
                                backgroundColor: "var(--accent-light)",
                                borderRadius: "8px",
                                borderLeft: "4px solid var(--accent)"
                            }}>
                                <p style={{ margin: 0, color: "var(--accent)", fontWeight: "500" }}>
                                    The Imaging test form will be designed soon. For now, you can start planning the test parameters.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsInpatientModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Parameter Modal */}
            {isParameterModalOpen && (
                <div className="modal-overlay" onClick={() => setIsParameterModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingParameter ? "Edit Parameter" : "Add New Parameter"}</h2>
                            <button className="close-btn" onClick={() => setIsParameterModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Parameter Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter parameter name (e.g., Hemoglobin)"
                                    value={parameterFormData.name}
                                    onChange={handleParameterInputChange}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={parameterFormData.category} onChange={handleParameterInputChange}>
                                        <option value="">Select category</option>
                                        <option value="Blood Chemistry">Blood Chemistry</option>
                                        <option value="Hematology">Hematology</option>
                                        <option value="Urinalysis">Urinalysis</option>
                                        <option value="Microbiology">Microbiology</option>
                                        <option value="Immunology">Immunology</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        placeholder="e.g., g/dL, mg/dL"
                                        value={parameterFormData.unit}
                                        onChange={handleParameterInputChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Normal Range</label>
                                <input
                                    type="text"
                                    name="normalRange"
                                    placeholder="e.g., 12-16 g/dL"
                                    value={parameterFormData.normalRange}
                                    onChange={handleParameterInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter parameter description"
                                    value={parameterFormData.description}
                                    onChange={handleParameterInputChange}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsParameterModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveParameter}>
                                {editingParameter ? "Update Parameter" : "Add Parameter"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Laboratory;