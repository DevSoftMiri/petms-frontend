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
        if (path.includes("/imaging")) return "imaging-reports";
        if (path.includes("/inpatient")) return "inpatient";
        return "lab-reports";
    }, [location, propSubView]);

    const [currentView, setCurrentView] = useState(getCurrentView);
    const [labs, setLabs] = useState([]);
    const [imagingRecords, setImagingRecords] = useState([]);
    const [labParameters, setLabParameters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);
    const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
    const [isInpatientModalOpen, setIsInpatientModalOpen] = useState(false);
    const [editingParameter, setEditingParameter] = useState(null);
    const [editingImaging, setEditingImaging] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isViewImagingModalOpen, setIsViewImagingModalOpen] = useState(false);
    const [viewingReport, setViewingReport] = useState(null);
    const [viewingImaging, setViewingImaging] = useState(null);
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
        status: "COMPLETED",
        veterinarian: "",
        notes: "",
        reportUrl: "",
    });

    const [imagingFormData, setImagingFormData] = useState({
        caseId: "",
        petId: "",
        petName: "",
        customerCode: "",
        imagingType: "",
        bodyPart: "",
        imagingDate: new Date().toISOString().split("T")[0],
        findings: "",
        radiologistNotes: "",
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
            console.log('[Laboratory] Fetched labs:', data);
            data.forEach(lab => {
                console.log(`[Laboratory] Lab ${lab._id}: reportUrl =`, lab.reportUrl);
            });
            setLabs(data);
        } catch (error) {
            console.error('[Laboratory] Error fetching labs:', error);
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

    const fetchImagingRecords = useCallback(async () => {
        if (!clinicId) return;
        try {
            const response = await HttpService.getWithAuth(`/clinics/${clinicId}/vet/imaging`);
            const data = Array.isArray(response) ? response : response.data || [];
            setImagingRecords(data);
        } catch (error) {
            console.error("Failed to load imaging records:", error);
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
            fetchImagingRecords();
        }
    }, [clinicId, fetchPets, fetchCustomers, fetchLabs, fetchLabParameters, fetchImagingRecords]);

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

    const onDropImaging = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            // Accept PDF or image files
            const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
            if (!validTypes.includes(file.type)) {
                enqueueSnackbar("Please select a PDF or image file (JPG, PNG, GIF, WebP)", { variant: "error" });
                return;
            }
            setSelectedFile(file);
        }
    }, [enqueueSnackbar]);

    const { getRootProps, isDragActive, getInputProps } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const { getRootProps: getImagingRootProps, isDragActive: isImagingDragActive, getInputProps: getImagingInputProps } = useDropzone({
        onDrop: onDropImaging,
        accept: {
            "application/pdf": [".pdf"],
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"]
        },
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
            status: "COMPLETED",
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
            status: lab.status || "COMPLETED",
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
        console.log('[Laboratory] handleViewReport called for lab:', lab._id, 'reportUrl:', lab.reportUrl);
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
                    console.log('[Laboratory] Uploading file for labId:', labId);
                    reportUrl = await uploadLabReport(selectedFile, clinicId, petId, labId);
                    console.log('[Laboratory] Upload completed, reportUrl:', reportUrl);
                } catch (uploadError) {
                    console.error('[Laboratory] Upload failed:', uploadError);
                    enqueueSnackbar(`Failed to upload PDF: ${uploadError.message}`, { variant: "error" });
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const payload = {
                ...formData,
                reportUrl,
                // Automatically set status to COMPLETED if report is uploaded
                status: reportUrl ? "COMPLETED" : formData.status,
            };

            console.log('[Laboratory] Saving lab test with payload:', payload);

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
            console.error('[Laboratory] Save error:', error);
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

    // Imaging handlers
    const handleAddImaging = () => {
        setEditingImaging(null);
        setSelectedFile(null);
        setImagingFormData({
            caseId: "",
            petId: "",
            petName: "",
            customerCode: "",
            imagingType: "",
            bodyPart: "",
            imagingDate: new Date().toISOString().split("T")[0],
            findings: "",
            radiologistNotes: "",
            reportUrl: "",
        });
        setShowPetDropdown(false);
        setShowCustomerDropdown(false);
        setIsImagingModalOpen(true);
    };

    const handleEditImaging = (imaging) => {
        setEditingImaging(imaging);
        setSelectedFile(null);
        const formattedDate = imaging.imagingDate ? new Date(imaging.imagingDate).toISOString().split("T")[0] : "";
        setImagingFormData({
            caseId: imaging.caseId || "",
            petId: imaging.petId || "",
            petName: imaging.petName || "",
            customerCode: imaging.customerCode || "",
            imagingType: imaging.imagingType || "",
            bodyPart: imaging.bodyPart || "",
            imagingDate: formattedDate,
            findings: imaging.findings || "",
            radiologistNotes: imaging.radiologistNotes || "",
            reportUrl: imaging.reportUrl || "",
        });
        if (imaging.petId) {
            const existingPet = allPets.find(p => p.id === imaging.petId);
            if (existingPet) {
                setFilteredPets([existingPet]);
            }
        }
        setShowCustomerDropdown(false);
        setShowPetDropdown(false);
        setIsImagingModalOpen(true);
    };

    const handleViewImaging = (imaging) => {
        if (imaging.reportUrl) {
            setViewingImaging(imaging);
            setIsViewImagingModalOpen(true);
        } else {
            enqueueSnackbar("No imaging report attached to this record", { variant: "warning" });
        }
    };

    const handleSaveImaging = async () => {
        try {
            if (!imagingFormData.petName || !imagingFormData.imagingType) {
                enqueueSnackbar("Pet name and imaging type are required", { variant: "error" });
                return;
            }

            let reportUrl = imagingFormData.reportUrl;

            if (selectedFile) {
                setUploading(true);
                try {
                    const petId = imagingFormData.petId || "unknown";
                    const imagingId = editingImaging?._id || "new";
                    reportUrl = await uploadLabReport(selectedFile, clinicId, petId, imagingId);
                } catch (uploadError) {
                    enqueueSnackbar(`Failed to upload file: ${uploadError.message}`, { variant: "error" });
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const payload = {
                ...imagingFormData,
                reportUrl,
                status: reportUrl ? "COMPLETED" : "PENDING",
            };

            if (editingImaging) {
                await HttpService.putWithAuth(`/clinics/${clinicId}/vet/imaging/${editingImaging._id}`, payload);
                enqueueSnackbar("Imaging record updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/vet/imaging`, payload);
                enqueueSnackbar("Imaging record created", { variant: "success" });
            }

            setIsImagingModalOpen(false);
            setSelectedFile(null);
            fetchImagingRecords();
        } catch (error) {
            enqueueSnackbar("Failed to save imaging record", { variant: "error" });
        }
    };

    const handleDeleteImaging = (id) => {
        if (!window.confirm("Delete this imaging record?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/vet/imaging/${id}`)
            .then(() => {
                enqueueSnackbar("Imaging record deleted", { variant: "success" });
                fetchImagingRecords();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    const handleImagingInputChange = (e) => {
        const { name, value } = e.target;
        setImagingFormData(prev => ({ ...prev, [name]: value }));
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
                    {/* Pending Tests Section */}
                    {(() => {
                        const pendingTests = labs.filter(lab => lab.status === "Pending" || !lab.reportUrl);
                        return pendingTests.length > 0 ? (
                            <div className="pending-tests-section" style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#fef9c3", borderLeft: "4px solid #a16207", borderRadius: "8px" }}>
                                <h3 style={{ margin: "0 0 12px 0", color: "#a16207", fontSize: "16px", fontWeight: "600" }}>
                                    ⚠️ Pending Tests Awaiting Report Upload ({pendingTests.length})
                                </h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                                    {pendingTests.map((test) => (
                                        <div key={test._id} style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #d4a574" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                                <div>
                                                    <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px" }}>
                                                        {test.petName}
                                                    </p>
                                                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                        <strong>Test:</strong> {test.testType}
                                                    </p>
                                                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                        <strong>Date:</strong> {test.date ? new Date(test.date).toLocaleDateString() : "-"}
                                                    </p>
                                                    {test.notes && (
                                                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                            <strong>Notes:</strong> {test.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleEditLab(test)}
                                                    style={{ whiteSpace: "nowrap", marginLeft: "8px" }}
                                                >
                                                    Add Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Search Bar */}
                    <div className="search-bar">
                        <input
                            type="text"
                        placeholder="Search by MR number or pet name..."
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
                                <th>MR Number</th>
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

    // Render Imaging Reports view
    const renderImagingReportsView = () => (
        <>
            <div className="page-header">
                <div>
                    <h1>Imaging Reports</h1>
                    <p>View and manage all imaging test results and reports</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddImaging}>
                    Add Imaging Report
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="laboratory-table">
                    {/* Pending Imaging Section */}
                    {(() => {
                        const pendingImaging = imagingRecords.filter(img => img.status === "Pending" || !img.reportUrl);
                        return pendingImaging.length > 0 ? (
                            <div className="pending-tests-section" style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#fef9c3", borderLeft: "4px solid #a16207", borderRadius: "8px" }}>
                                <h3 style={{ margin: "0 0 12px 0", color: "#a16207", fontSize: "16px", fontWeight: "600" }}>
                                    ⚠️ Pending Imaging Awaiting Report Upload ({pendingImaging.length})
                                </h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                                    {pendingImaging.map((imaging) => (
                                        <div key={imaging._id} style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #d4a574" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                                <div>
                                                    <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px" }}>
                                                        {imaging.petName}
                                                    </p>
                                                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                        <strong>Type:</strong> {imaging.imagingType}
                                                    </p>
                                                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                        <strong>Body Part:</strong> {imaging.bodyPart}
                                                    </p>
                                                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                        <strong>Date:</strong> {imaging.imagingDate ? new Date(imaging.imagingDate).toLocaleDateString() : "-"}
                                                    </p>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleEditImaging(imaging)}
                                                    style={{ whiteSpace: "nowrap", marginLeft: "8px" }}
                                                >
                                                    Add Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* All Imaging Records Table */}
                    <table>
                        <thead>
                            <tr>
                                <th>Customer Code</th>
                                <th>Pet Name</th>
                                <th>Imaging Type</th>
                                <th>Body Part</th>
                                <th>Date</th>
                                <th>Findings</th>
                                <th>Status</th>
                                <th>Report</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {imagingRecords && imagingRecords.length > 0 ? (
                                imagingRecords.map((imaging) => (
                                    <tr key={imaging._id}>
                                        <td>
                                            <span className="customer-code-badge">
                                                {imaging.customerCode || "-"}
                                            </span>
                                        </td>
                                        <td className="pet-name">{imaging.petName}</td>
                                        <td>{imaging.imagingType}</td>
                                        <td>{imaging.bodyPart || "-"}</td>
                                        <td>{imaging.imagingDate ? new Date(imaging.imagingDate).toLocaleDateString() : "-"}</td>
                                        <td className="notes-cell">{imaging.findings || "-"}</td>
                                        <td>
                                            <span className={`badge ${imaging.status === "COMPLETED" ? "status-complete" : "status-pending"}`}>
                                                {imaging.status || "PENDING"}
                                            </span>
                                        </td>
                                        <td>
                                            {imaging.reportUrl ? (
                                                <button
                                                    className="btn btn-sm btn-view"
                                                    onClick={() => handleViewImaging(imaging)}
                                                    title="View Report"
                                                >
                                                    View Report
                                                </button>
                                            ) : (
                                                <span className="muted">-</span>
                                            )}
                                        </td>
                                        <td className="actions">
                                            <button
                                                className="btn-action edit"
                                                onClick={() => handleEditImaging(imaging)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-action delete"
                                                onClick={() => handleDeleteImaging(imaging._id)}
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
                                        No imaging records found
                                    </td>
                                </tr>
                            )}
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
                        {currentView === "imaging-reports" && renderImagingReportsView()}
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
                                    <datalist id="test-types-list">
                                        <option value="CBC (Complete Blood Count)" />
                                        <option value="KFT (Kidney Function Test)" />
                                        <option value="LFT (Liver Function Test)" />
                                        <option value="Blood Test" />
                                        <option value="Urinalysis" />
                                        <option value="X-Ray" />
                                        <option value="Ultrasound" />
                                        <option value="Allergy Test" />
                                        <option value="Blood Culture" />
                                        <option value="ECG" />
                                        <option value="Chemistry Panel" />
                                        <option value="Thyroid Panel" />
                                    </datalist>
                                    <input
                                        type="text"
                                        name="testType"
                                        value={formData.testType}
                                        onChange={handleInputChange}
                                        list="test-types-list"
                                        placeholder="Select or type test name (CBC, KFT, LFT...)"
                                        style={{ width: "100%" }}
                                    />
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
                                <div className="form-group">
                                    <label>Result</label>
                                    <select name="result" value={formData.result} onChange={handleInputChange}>
                                        <option value="">Select result</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Abnormal">Abnormal</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Allergies Found">Allergies Found</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option value="Complete">Complete</option>
                                        <option value="Pending Review">Pending Review</option>
                                        <option value="In Progress">In Progress</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Veterinarian</label>
                                <input
                                    type="text"
                                    name="veterinarian"
                                    placeholder="Enter veterinarian name"
                                    value={formData.veterinarian}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    placeholder="Enter notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>

                            <div className="form-group">
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
                                {selectedFile && (
                                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-view"
                                            onClick={() => {
                                                const fileUrl = URL.createObjectURL(selectedFile);
                                                window.open(fileUrl, '_blank');
                                            }}
                                            title="Preview uploaded file"
                                        >
                                            👁️ View File
                                        </button>
                                    </div>
                                )}
                                {formData.reportUrl && !selectedFile && (
                                    <p className="existing-file">
                                        Existing report:{" "}
                                        <a href={formData.reportUrl} target="_blank" rel="noopener noreferrer">
                                            View
                                        </a>
                                    </p>
                                )}
                            </div>
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

            {/* Imaging Add/Edit Modal */}
            {isImagingModalOpen && (
                <div className="modal-overlay" onClick={() => setIsImagingModalOpen(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingImaging ? "Edit Imaging Report" : "Add Imaging Report"}</h2>
                            <button className="close-btn" onClick={() => setIsImagingModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pet Name *</label>
                                    <input
                                        type="text"
                                        name="petName"
                                        placeholder="Enter pet name"
                                        value={imagingFormData.petName}
                                        onChange={handleImagingInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Customer Code</label>
                                    <input
                                        type="text"
                                        name="customerCode"
                                        placeholder="Enter customer code"
                                        value={imagingFormData.customerCode}
                                        onChange={handleImagingInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Imaging Type *</label>
                                    <datalist id="imaging-types-list">
                                        <option value="X-Ray" />
                                        <option value="Ultrasound" />
                                        <option value="CT Scan" />
                                        <option value="MRI" />
                                        <option value="Radiography" />
                                        <option value="Fluoroscopy" />
                                        <option value="Thermal Imaging" />
                                    </datalist>
                                    <input
                                        type="text"
                                        name="imagingType"
                                        value={imagingFormData.imagingType}
                                        onChange={handleImagingInputChange}
                                        list="imaging-types-list"
                                        placeholder="Select or type imaging type"
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Body Part</label>
                                    <input
                                        type="text"
                                        name="bodyPart"
                                        placeholder="e.g., Chest, Leg, Abdomen"
                                        value={imagingFormData.bodyPart}
                                        onChange={handleImagingInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Imaging Date</label>
                                    <input
                                        type="date"
                                        name="imagingDate"
                                        value={imagingFormData.imagingDate}
                                        onChange={handleImagingInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Findings</label>
                                <textarea
                                    name="findings"
                                    placeholder="Enter imaging findings"
                                    value={imagingFormData.findings}
                                    onChange={handleImagingInputChange}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Radiologist Notes</label>
                                <textarea
                                    name="radiologistNotes"
                                    placeholder="Enter additional notes from radiologist"
                                    value={imagingFormData.radiologistNotes}
                                    onChange={handleImagingInputChange}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Upload Imaging Report (PDF or Image)</label>
                                <div
                                    {...getImagingRootProps()}
                                    className={`file-dropzone ${isImagingDragActive ? "active" : ""}`}
                                >
                                    <input {...getImagingInputProps()} />
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
                                    ) : isImagingDragActive ? (
                                        <p>Drop the file here...</p>
                                    ) : (
                                        <p>Drag and drop a PDF or image file here, or click to select</p>
                                    )}
                                </div>
                                {selectedFile && (
                                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-view"
                                            onClick={() => {
                                                const fileUrl = URL.createObjectURL(selectedFile);
                                                window.open(fileUrl, '_blank');
                                            }}
                                            title="Preview uploaded file"
                                        >
                                            👁️ View File
                                        </button>
                                    </div>
                                )}
                                {imagingFormData.reportUrl && !selectedFile && (
                                    <p className="existing-file">
                                        Existing report:{" "}
                                        <a href={imagingFormData.reportUrl} target="_blank" rel="noopener noreferrer">
                                            View
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsImagingModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveImaging}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : (editingImaging ? "Update Report" : "Save Report")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Imaging Report Modal */}
            {isViewImagingModalOpen && viewingImaging && (
                <div className="modal-overlay" onClick={() => setIsViewImagingModalOpen(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Imaging Report - {viewingImaging.petName}</h2>
                            <button className="close-btn" onClick={() => setIsViewImagingModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: "center" }}>
                            <div style={{ marginBottom: "16px" }}>
                                <p><strong>Imaging Type:</strong> {viewingImaging.imagingType}</p>
                                <p><strong>Body Part:</strong> {viewingImaging.bodyPart}</p>
                                <p><strong>Date:</strong> {new Date(viewingImaging.imagingDate).toLocaleDateString()}</p>
                                {viewingImaging.findings && <p><strong>Findings:</strong> {viewingImaging.findings}</p>}
                                {viewingImaging.radiologistNotes && <p><strong>Notes:</strong> {viewingImaging.radiologistNotes}</p>}
                            </div>
                            {viewingImaging.reportUrl && (
                                <>
                                    {viewingImaging.reportUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                            src={viewingImaging.reportUrl}
                                            alt="Imaging Report"
                                            style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px" }}
                                        />
                                    ) : (
                                        <iframe
                                            src={viewingImaging.reportUrl}
                                            style={{ width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: "8px" }}
                                            title="Imaging Report"
                                        ></iframe>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsViewImagingModalOpen(false)}>
                                Close
                            </button>
                            {viewingImaging.reportUrl && (
                                <a
                                    href={viewingImaging.reportUrl}
                                    download
                                    className="btn btn-primary"
                                >
                                    Download Report
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Laboratory;
