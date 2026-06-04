import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { TextField, Button } from "@mui/material";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import "./VetPetDetails.css";

const VetPetDetails = () => {
    const { petId } = useParams();
    const { state: clinicState } = useContext(ClinicContext);
    // Try to get clinicId from context first, then localStorage
    const contextClinicId = clinicState?.selectedClinicId;
    const storedClinicId = localStorage.getItem('selectedClinicId');
    const clinicId = contextClinicId || storedClinicId;

    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [petData, setPetData] = useState(null);
    const [caseData, setCaseData] = useState(null);
    const [activeTab, setActiveTab] = useState("symptoms");
    const [activeClinicTab, setActiveClinicTab] = useState("vet");

    // General information edit state
    const [editingGeneralInfo, setEditingGeneralInfo] = useState(false);
    const [editedPetData, setEditedPetData] = useState({});

    // Case management states
    const [showEditPatient, setShowEditPatient] = useState(false);
    const [editPatientForm, setEditPatientForm] = useState({});
    const [isCreatingCase, setIsCreatingCase] = useState(false);
    const [isMovingToInpatient, setIsMovingToInpatient] = useState(false);
    const [isClosingCase, setIsClosingCase] = useState(false);

    const handleClinicTabChange = (tab) => {
        setActiveClinicTab(tab);
        if (tab !== "vet") {
            navigate(`/clinics/${clinicId}/${tab}`);
        }
    };

    // Form states
    const [symptomForm, setSymptomForm] = useState({
        chiefComplaint: "",
        symptomsObserved: "",
        clinicalNotes: "",
        weight: "",
        temperature: "",
        pulse: "",
        heartRate: "",
        appetiteStatus: "Normal",
        diagnosticPlan: "",
    });

    const [imagingForm, setImagingForm] = useState({
        imagingType: "XRAY",
        bodyPart: "",
        instructions: "",
        scheduledDate: "",
        cost: "",
    });

    const [procedureForm, setProcedureForm] = useState({
        procedureName: "",
        description: "",
        cost: "",
        procedureDate: new Date().toISOString().split("T")[0],
    });

    const [vaccinationForm, setVaccinationForm] = useState({
        vaccineName: "",
        dueDate: "",
        administeredDate: "",
        nextDueDate: "",
        batchNumber: "",
        notes: "",
    });

    const [diagnosisForm, setDiagnosisForm] = useState({
        diagnosis: "",
        notes: "",
        medications: [{ medicineName: "", dosage: "", frequency: "", duration: "" }],
    });

    const [labTestForm, setLabTestForm] = useState({
        testType: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    // Fetch pet and case data
    const fetchPetDetails = useCallback(async () => {
        if (!clinicId || !petId) {
            console.error("Missing clinicId or petId", { clinicId, petId });
            enqueueSnackbar("Missing clinic or pet information. Please navigate from the clinic dashboard.", { variant: "error" });
            // Redirect back to home
            setTimeout(() => navigate("/"), 2000);
            return;
        }

        try {
            setLoading(true);

            // Fetch pet data
            const petRes = await HttpService.getWithAuth(`/clinics/${clinicId}/pets/${petId}`);
            setPetData(petRes.data?.data || petRes.data);

            // Fetch the latest case for this pet
            try {
                const casesRes = await HttpService.getWithAuth(`/clinics/${clinicId}/vet/pets/${petId}/cases`);
                console.log("Cases response:", casesRes);

                // Handle response structure - backend returns { success: true, data: [...], message: "..." }
                let cases = [];
                if (casesRes?.data?.data && Array.isArray(casesRes.data.data)) {
                    cases = casesRes.data.data;
                } else if (Array.isArray(casesRes?.data)) {
                    cases = casesRes.data;
                }

                console.log("Parsed cases:", cases);

                if (cases && cases.length > 0) {
                    // Get the most recent ACTIVE case
                    const activeCases = cases.filter(c => c.status === "ACTIVE");
                    console.log("Active cases found:", activeCases.length);

                    if (activeCases.length > 0) {
                        const latestCase = activeCases.sort((a, b) => new Date(b.caseDate || 0) - new Date(a.caseDate || 0))[0];
                        console.log("Setting case data:", latestCase);
                        setCaseData(latestCase);
                    } else {
                        console.log("No active cases found. All cases:", cases);
                        setCaseData(null);
                    }
                } else {
                    console.log("No cases found for pet");
                    setCaseData(null);
                }
            } catch (error) {
                console.error("Error fetching cases for pet:", error?.message || error);
                setCaseData(null);
            }
        } catch (error) {
            console.error("Error fetching pet details:", error);
            enqueueSnackbar("Failed to load pet details", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [petId, clinicId, enqueueSnackbar, navigate]);

    useEffect(() => {
        fetchPetDetails();
    }, [fetchPetDetails]);

    // General information handlers
    const handleEditGeneralInfo = () => {
        setEditedPetData({
            name: petData?.name || "",
            species: petData?.species || "",
            breed: petData?.breed || "",
            age: petData?.age || "",
            gender: petData?.gender || "",
            weight: petData?.weight || "",
            bloodGroup: petData?.bloodGroup || "",
        });
        setEditingGeneralInfo(true);
    };

    const handleSaveGeneralInfo = async () => {
        try {
            await HttpService.putWithAuth(`/clinics/${clinicId}/pets/${petId}`, editedPetData);
            enqueueSnackbar("Pet information updated successfully", { variant: "success" });
            setPetData({ ...petData, ...editedPetData });
            setEditingGeneralInfo(false);
        } catch (error) {
            enqueueSnackbar("Failed to update pet information", { variant: "error" });
        }
    };

    const handleCancelEdit = () => {
        setEditingGeneralInfo(false);
        setEditedPetData({});
    };

    const handleEditChange = (field, value) => {
        setEditedPetData({
            ...editedPetData,
            [field]: value,
        });
    };

    // Submit handlers
    const handleSubmitSymptoms = async (e) => {
        e.preventDefault();
        if (!caseData) {
            enqueueSnackbar("Please create a case first", { variant: "warning" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/symptoms`, symptomForm);
            enqueueSnackbar("Symptoms recorded successfully", { variant: "success" });
            fetchPetDetails();
            setSymptomForm({
                chiefComplaint: "",
                symptomsObserved: "",
                clinicalNotes: "",
                weight: "",
                temperature: "",
                pulse: "",
                heartRate: "",
                appetiteStatus: "Normal",
                diagnosticPlan: "",
            });
        } catch (error) {
            enqueueSnackbar("Failed to record symptoms", { variant: "error" });
        }
    };

    const handleSubmitImaging = async (e) => {
        e.preventDefault();
        if (!caseData) {
            enqueueSnackbar("Please create a case first", { variant: "warning" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/imaging`, imagingForm);
            enqueueSnackbar("Imaging request added", { variant: "success" });
            fetchPetDetails();
            setImagingForm({
                imagingType: "XRAY",
                bodyPart: "",
                instructions: "",
                scheduledDate: new Date().toISOString().split("T")[0],
                cost: "",
            });
        } catch (error) {
            enqueueSnackbar("Failed to add imaging", { variant: "error" });
        }
    };

    const handleSubmitLabTest = async (e) => {
        e.preventDefault();
        if (!labTestForm.testType) {
            enqueueSnackbar("Test type is required", { variant: "error" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/laboratory`, {
                petId: petId,
                petName: petData?.name || "",
                customerCode: petData?.owner?.customerId || "",
                testType: labTestForm.testType,
                date: labTestForm.date,
                notes: labTestForm.notes,
                status: "Pending",
                veterinarian: "",
                result: "",
                reportUrl: "",
            });
            enqueueSnackbar("Lab test assigned successfully", { variant: "success" });

            // Fetch lab tests for this pet to update the display
            try {
                const labRes = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory`);
                const allLabs = Array.isArray(labRes) ? labRes : (labRes?.data || []);
                const petLabs = allLabs.filter(lab => lab.petId === petId);
                setPetData(prev => ({ ...prev, labTests: petLabs }));
            } catch (labError) {
                console.error("Error fetching lab tests:", labError);
                // Still refresh the page data even if lab fetch fails
                fetchPetDetails();
            }

            setLabTestForm({
                testType: "",
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
        } catch (error) {
            enqueueSnackbar("Failed to assign lab test", { variant: "error" });
        }
    };

    const handleSubmitProcedure = async (e) => {
        e.preventDefault();
        if (!caseData) {
            enqueueSnackbar("Please create a case first", { variant: "warning" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/procedures`, procedureForm);
            enqueueSnackbar("Procedure added", { variant: "success" });
            fetchPetDetails();
            setProcedureForm({
                procedureName: "",
                description: "",
                cost: "",
                procedureDate: new Date().toISOString().split("T")[0],
            });
        } catch (error) {
            enqueueSnackbar("Failed to add procedure", { variant: "error" });
        }
    };

    const handleSubmitVaccination = async (e) => {
        e.preventDefault();
        if (!caseData) {
            enqueueSnackbar("Please create a case first", { variant: "warning" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/vaccinations`, vaccinationForm);
            enqueueSnackbar("Vaccination added", { variant: "success" });
            fetchPetDetails();
            setVaccinationForm({
                vaccineName: "",
                dueDate: "",
                administeredDate: "",
                nextDueDate: "",
                batchNumber: "",
                notes: "",
            });
        } catch (error) {
            enqueueSnackbar("Failed to add vaccination", { variant: "error" });
        }
    };

    const handleAddMedication = () => {
        setDiagnosisForm({
            ...diagnosisForm,
            medications: [
                ...diagnosisForm.medications,
                { medicineName: "", dosage: "", frequency: "", duration: "" },
            ],
        });
    };

    const handleMedicationChange = (index, field, value) => {
        const updated = [...diagnosisForm.medications];
        updated[index][field] = value;
        setDiagnosisForm({ ...diagnosisForm, medications: updated });
    };

    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();
        if (!caseData) {
            enqueueSnackbar("Please create a case first", { variant: "warning" });
            return;
        }
        try {
            await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/diagnoses`, diagnosisForm);
            enqueueSnackbar("Diagnosis added", { variant: "success" });
            fetchPetDetails();
            setDiagnosisForm({
                diagnosis: "",
                notes: "",
                medications: [{ medicineName: "", dosage: "", frequency: "", duration: "" }],
            });
        } catch (error) {
            enqueueSnackbar("Failed to add diagnosis", { variant: "error" });
        }
    };

    const handleUpdateImagingStatus = async (imagingId, status, findings = "") => {
        try {
            await HttpService.putWithAuth(`/clinics/${clinicId}/vet/cases/${caseData.id}/imaging/${imagingId}`, {
                status,
                findings,
            });
            enqueueSnackbar("Imaging status updated", { variant: "success" });
            fetchPetDetails();
        } catch (error) {
            enqueueSnackbar("Failed to update imaging", { variant: "error" });
        }
    };

    // Create new case
    const handleCreateCase = async () => {
        try {
            setIsCreatingCase(true);
            const response = await HttpService.postWithAuth(
                `/clinics/${clinicId}/vet/cases`,
                {
                    petId: petId,
                    caseDate: new Date().toISOString().split("T")[0],
                    status: "ACTIVE"
                }
            );
            const newCase = response.data?.data || response.data;
            console.log("Case created:", newCase);
            setCaseData(newCase);
            enqueueSnackbar(`✅ Case created! Case #${newCase.caseNumber} now appears in "My Cases" section`, {
                variant: "success",
                autoHideDuration: 5000
            });

            // Refresh case data to ensure all relationships are loaded
            setTimeout(() => {
                fetchPetDetails();
            }, 500);
        } catch (error) {
            console.error("Create case error:", error.response?.status, error.response?.data);

            // Handle specific error status codes
            if (error.response?.status === 409) {
                enqueueSnackbar(
                    "An active case already exists for this pet. Refreshing to load it...",
                    { variant: "info" }
                );
                // Refetch the pet details to load the existing case
                setTimeout(() => {
                    fetchPetDetails();
                }, 1000);
            } else {
                enqueueSnackbar(
                    error.response?.data?.message || "Failed to create case",
                    { variant: "error" }
                );
            }
        } finally {
            setIsCreatingCase(false);
        }
    };

    // Move pet to inpatient
    const handleMoveToInpatient = async () => {
        try {
            setIsMovingToInpatient(true);
            await HttpService.putWithAuth(
                `/clinics/${clinicId}/vet/pets/${petId}/admission`,
                {
                    status: "ADMITTED",
                    admissionDate: new Date().toISOString()
                }
            );
            enqueueSnackbar("🏥 Pet moved to inpatient! It now appears in 'Inpatient Pets' section and removed from 'My Cases'", {
                variant: "success",
                autoHideDuration: 5000
            });
            fetchPetDetails();
        } catch (error) {
            enqueueSnackbar("Failed to move pet to inpatient", { variant: "error" });
        } finally {
            setIsMovingToInpatient(false);
        }
    };

    // Close case
    const handleCloseCase = async () => {
        if (!caseData) {
            enqueueSnackbar("No active case to close", { variant: "warning" });
            return;
        }
        try {
            setIsClosingCase(true);
            await HttpService.putWithAuth(
                `/clinics/${clinicId}/vet/cases/${caseData.id}/status`,
                {
                    status: "CLOSED"
                }
            );
            enqueueSnackbar("✅ Case closed successfully! It now appears in 'Closed Case Pets' section", {
                variant: "success",
                autoHideDuration: 5000
            });
            fetchPetDetails();
        } catch (error) {
            enqueueSnackbar("Failed to close case", { variant: "error" });
        } finally {
            setIsClosingCase(false);
        }
    };

    if (loading) {
        return (
            <div className="vet-pet-details-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading pet details...</p>
                </div>
            </div>
        );
    }

    if (!petData) {
        return (
            <div className="vet-pet-details-container">
                <div className="empty-state">Pet not found</div>
            </div>
        );
    }

    return (
        <div className="vet-pet-details-page">
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                <Sidebar activeClinicTab={activeClinicTab} onTabChange={handleClinicTabChange} />
                <div className="vet-pet-details-container">
                    {/* Header */}
                    <div className="pet-details-header">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            ← Back
                        </button>
                        <div className="pet-header-info">
                            <div className="pet-avatar-large">
                                {petData.species === "Dog" ? "🐕" : petData.species === "Cat" ? "🐱" : "🐾"}
                            </div>
                            <div className="pet-header-content">
                                <h1>{petData.name}</h1>
                                {!editingGeneralInfo && (
                                    <>
                                        <div className="pet-meta">
                                            <p><strong>Species:</strong> {petData.species}</p>
                                            <p><strong>Breed:</strong> {petData.breed}</p>
                                            <p><strong>Age:</strong> {petData.age || "N/A"}</p>
                                            <p><strong>Gender:</strong> {petData.gender || "N/A"}</p>
                                            <p><strong>Weight:</strong> {petData.weight || "N/A"} kg</p>
                                            <p><strong>Blood Group:</strong> {petData.bloodGroup || "N/A"}</p>
                                            <p><strong>Owner:</strong> {petData.owner?.firstName} {petData.owner?.lastName}</p>
                                        </div>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleEditGeneralInfo}
                                            sx={{ mt: 1 }}
                                        >
                                            Edit Information
                                        </Button>
                                    </>
                                )}
                                {editingGeneralInfo && (
                                    <div className="edit-general-info">
                                        <TextField
                                            label="Species"
                                            size="small"
                                            value={editedPetData.species || ""}
                                            onChange={(e) => handleEditChange("species", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Breed"
                                            size="small"
                                            value={editedPetData.breed || ""}
                                            onChange={(e) => handleEditChange("breed", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Age (months)"
                                            type="number"
                                            size="small"
                                            value={editedPetData.age || ""}
                                            onChange={(e) => handleEditChange("age", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Gender"
                                            size="small"
                                            value={editedPetData.gender || ""}
                                            onChange={(e) => handleEditChange("gender", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Weight (kg)"
                                            type="number"
                                            step="0.1"
                                            size="small"
                                            value={editedPetData.weight || ""}
                                            onChange={(e) => handleEditChange("weight", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Blood Group"
                                            size="small"
                                            placeholder="e.g., DEA 1.1+, A, B"
                                            value={editedPetData.bloodGroup || ""}
                                            onChange={(e) => handleEditChange("bloodGroup", e.target.value)}
                                            sx={{ mb: 1 }}
                                        />
                                        <div style={{ display: "flex", gap: "10px", mt: "10px" }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleSaveGeneralInfo}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pet-status-info">
                            <div className="info-card">
                                <span className="info-label">Cases</span>
                                <span className="info-value">{caseData ? "1" : "0"}</span>
                            </div>
                            <div className="info-card">
                                <span className="info-label">Symptoms</span>
                                <span className="info-value">{caseData?.symptoms?.length || 0}</span>
                            </div>
                            <div className="info-card">
                                <span className="info-label">Diagnoses</span>
                                <span className="info-value">{caseData?.diagnoses?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Case Management Actions */}
                    <div style={{
                        marginTop: "20px",
                        padding: "20px",
                        backgroundColor: "white",
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                    }}>
                        {!caseData ? (
                            <div style={{
                                textAlign: "center",
                                padding: "30px 20px"
                            }}>
                                <div style={{ fontSize: "48px", marginBottom: "15px" }}>📋</div>
                                <h3 style={{ margin: "0 0 10px 0", color: "#1f2937", fontSize: "18px" }}>No Active Case</h3>
                                <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: "14px" }}>
                                    Create a case to record symptoms, diagnoses, procedures, and manage patient care
                                </p>
                                <button
                                    onClick={handleCreateCase}
                                    disabled={isCreatingCase}
                                    style={{
                                        padding: "12px 24px",
                                        backgroundColor: "#16a34a",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: isCreatingCase ? "not-allowed" : "pointer",
                                        fontWeight: "bold",
                                        fontSize: "16px",
                                        opacity: isCreatingCase ? 0.6 : 1,
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => !isCreatingCase && (e.target.style.backgroundColor = "#15803d")}
                                    onMouseLeave={(e) => !isCreatingCase && (e.target.style.backgroundColor = "#16a34a")}
                                >
                                    {isCreatingCase ? "Creating Case..." : "✅ Create New Case"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "20px",
                                    paddingBottom: "15px",
                                    borderBottom: "1px solid #e5e7eb"
                                }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 5px 0", color: "#1f2937" }}>Active Case</h3>
                                        <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                                            Case ID: <strong style={{ color: "#0284c7" }}>{caseData.id}</strong>
                                        </p>
                                    </div>
                                    <div style={{ fontSize: "32px" }}>🩺</div>
                                </div>

                                <div className="case-action-grid">
                                    <button
                                        onClick={() => setShowEditPatient(!showEditPatient)}
                                        style={{
                                            padding: "12px 16px",
                                            backgroundColor: "#0284c7",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#0369a1")}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#0284c7")}
                                    >
                                        ✏️ Edit Patient Details
                                    </button>

                                    <button
                                        onClick={handleMoveToInpatient}
                                        disabled={isMovingToInpatient}
                                        style={{
                                            padding: "12px 16px",
                                            backgroundColor: "#f59e0b",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: isMovingToInpatient ? "not-allowed" : "pointer",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            opacity: isMovingToInpatient ? 0.6 : 1,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => !isMovingToInpatient && (e.target.style.backgroundColor = "#d97706")}
                                        onMouseLeave={(e) => !isMovingToInpatient && (e.target.style.backgroundColor = "#f59e0b")}
                                    >
                                        {isMovingToInpatient ? "Moving..." : "🏥 Move to Inpatient"}
                                    </button>

                                    <button
                                        onClick={handleCloseCase}
                                        disabled={isClosingCase}
                                        style={{
                                            padding: "12px 16px",
                                            backgroundColor: "#dc2626",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: isClosingCase ? "not-allowed" : "pointer",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            opacity: isClosingCase ? 0.6 : 1,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => !isClosingCase && (e.target.style.backgroundColor = "#b91c1c")}
                                        onMouseLeave={(e) => !isClosingCase && (e.target.style.backgroundColor = "#dc2626")}
                                    >
                                        {isClosingCase ? "Closing..." : "🔒 Close Case"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Edit Patient Modal */}
                    {showEditPatient && caseData && (
                        <div style={{
                            marginTop: "20px",
                            padding: "20px",
                            backgroundColor: "#f9f9f9",
                            border: "2px solid #0284c7",
                            borderRadius: "8px"
                        }}>
                            <h3>Edit Patient Details</h3>
                            <form style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "15px"
                            }}>
                                <div>
                                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                        Pet Name
                                    </label>
                                    <input
                                        type="text"
                                        value={petData.name}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            backgroundColor: "#e8e8e8"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                        Species
                                    </label>
                                    <input
                                        type="text"
                                        value={petData.species}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            backgroundColor: "#e8e8e8"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                        Breed
                                    </label>
                                    <input
                                        type="text"
                                        value={petData.breed}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            backgroundColor: "#e8e8e8"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                        Age
                                    </label>
                                    <input
                                        type="text"
                                        value={petData.age || "N/A"}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            backgroundColor: "#e8e8e8"
                                        }}
                                    />
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                        Notes
                                    </label>
                                    <textarea
                                        value={petData.notes || ""}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            backgroundColor: "#e8e8e8",
                                            minHeight: "80px"
                                        }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowEditPatient(false)}
                                    style={{
                                        gridColumn: "1 / -1",
                                        padding: "10px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontWeight: "bold"
                                    }}
                                >
                                    Close
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="pet-tabs">
                        {["symptoms", "labtests", "imaging", "diagnosis", "procedures", "vaccination"].map((tab) => {
                            const labels = {
                                symptoms: "📋 Symptoms",
                                labtests: "🧪 Lab Tests",
                                imaging: "📷 Imaging",
                                diagnosis: "💊 Diagnosis",
                                procedures: "⚕️ Procedures",
                                vaccination: "💉 Vaccination",
                            };
                            return (
                                <button
                                    key={tab}
                                    className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {labels[tab]}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="pet-content">
                        {/* Symptoms Tab */}
                        {activeTab === "symptoms" && (
                            <div className="tab-panel">
                                <h2>📋 Symptoms & Vitals</h2>

                                {caseData ? (
                                    <>
                                        {/* Add Symptom Form */}
                                        <form onSubmit={handleSubmitSymptoms} className="case-form">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Chief Complaint</label>
                                                    <textarea
                                                        value={symptomForm.chiefComplaint}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, chiefComplaint: e.target.value })
                                                        }
                                                        placeholder="Primary complaint..."
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Symptoms Observed</label>
                                                    <textarea
                                                        value={symptomForm.symptomsObserved}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, symptomsObserved: e.target.value })
                                                        }
                                                        placeholder="List observed symptoms..."
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Temperature (°F)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={symptomForm.temperature}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, temperature: e.target.value })
                                                        }
                                                        placeholder="98.6"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Heart Rate (bpm)</label>
                                                    <input
                                                        type="number"
                                                        value={symptomForm.heartRate}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, heartRate: e.target.value })
                                                        }
                                                        placeholder="72"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Weight (kg)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={symptomForm.weight}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, weight: e.target.value })
                                                        }
                                                        placeholder="10.5"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Appetite Status</label>
                                                    <select
                                                        value={symptomForm.appetiteStatus}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, appetiteStatus: e.target.value })
                                                        }
                                                    >
                                                        <option value="Normal">Normal</option>
                                                        <option value="Good">Good</option>
                                                        <option value="Poor">Poor</option>
                                                        <option value="None">None</option>
                                                    </select>
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Clinical Notes</label>
                                                    <textarea
                                                        value={symptomForm.clinicalNotes}
                                                        onChange={(e) =>
                                                            setSymptomForm({ ...symptomForm, clinicalNotes: e.target.value })
                                                        }
                                                        placeholder="Additional clinical notes..."
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="submit-btn">
                                                Record Symptoms
                                            </button>
                                        </form>

                                        {/* Symptom History */}
                                        {caseData.symptoms?.length > 0 && (
                                            <div className="record-history">
                                                <h3>Symptom History</h3>
                                                {caseData.symptoms.map((symptom, index) => (
                                                    <div key={index} className="record-card">
                                                        <div className="record-date">
                                                            {new Date(symptom.recordedAt).toLocaleString()}
                                                        </div>
                                                        <div className="record-content">
                                                            {symptom.chiefComplaint && (
                                                                <p>
                                                                    <strong>Complaint:</strong> {symptom.chiefComplaint}
                                                                </p>
                                                            )}
                                                            {symptom.temperature && (
                                                                <p>
                                                                    <strong>Temp:</strong> {symptom.temperature}°F
                                                                </p>
                                                            )}
                                                            {symptom.heartRate && (
                                                                <p>
                                                                    <strong>Heart Rate:</strong> {symptom.heartRate} bpm
                                                                </p>
                                                            )}
                                                            {symptom.weight && (
                                                                <p>
                                                                    <strong>Weight:</strong> {symptom.weight} kg
                                                                </p>
                                                            )}
                                                            {symptom.appetiteStatus && (
                                                                <p>
                                                                    <strong>Appetite:</strong> {symptom.appetiteStatus}
                                                                </p>
                                                            )}
                                                            {symptom.clinicalNotes && (
                                                                <p>
                                                                    <strong>Notes:</strong> {symptom.clinicalNotes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <p>No active case for this pet. Create a case first to add symptoms.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Lab Tests Tab */}
                        {activeTab === "labtests" && (
                            <div className="tab-panel">
                                <h2>🧪 Laboratory Tests</h2>

                                {/* Assign Lab Test Form */}
                                <form onSubmit={handleSubmitLabTest} className="case-form">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Test Type</label>
                                            <datalist id="lab-test-types-list">
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
                                                value={labTestForm.testType}
                                                onChange={(e) => setLabTestForm({ ...labTestForm, testType: e.target.value })}
                                                list="lab-test-types-list"
                                                placeholder="Select or type test name (CBC, KFT, LFT...)"
                                                style={{ width: "100%" }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Test Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={labTestForm.date}
                                                onChange={(e) => setLabTestForm({ ...labTestForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Notes</label>
                                            <input
                                                type="text"
                                                name="notes"
                                                value={labTestForm.notes}
                                                onChange={(e) => setLabTestForm({ ...labTestForm, notes: e.target.value })}
                                                placeholder="Any specific instructions or notes"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="submit-btn">Assign Lab Test</button>
                                </form>

                                {/* Assigned Lab Tests */}
                                {petData?.labTests?.length > 0 && (
                                    <div className="record-history">
                                        <h3>Pet's Lab Tests</h3>
                                        {petData.labTests.map((test, index) => (
                                            <div key={index} className="record-card">
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <p><strong>{test.testType}</strong></p>
                                                        <p style={{ fontSize: "12px", color: "#6b7280" }}>
                                                            Date: {new Date(test.date).toLocaleDateString()}
                                                        </p>
                                                        {test.notes && <p style={{ fontSize: "12px", color: "#6b7280" }}>Notes: {test.notes}</p>}
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span className={`status-badge status-${test.status?.toLowerCase() || "pending"}`}>
                                                            {test.status || "Pending"}
                                                        </span>
                                                        {test.reportUrl && (
                                                            <p style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>✓ Report Added</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                                            💡 Lab reports can be added from the Laboratory section after the test is complete.
                                        </p>
                                    </div>
                                )}

                                {(!petData?.labTests || petData.labTests.length === 0) && (
                                    <div style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                                        <p>No lab tests assigned yet. Use the form above to assign tests.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Imaging Tab */}
                        {activeTab === "imaging" && (
                            <div className="tab-panel">
                                <h2>📷 Imaging</h2>

                                {caseData ? (
                                    <>
                                        <form onSubmit={handleSubmitImaging} className="case-form">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Imaging Type</label>
                                                    <select
                                                        value={imagingForm.imagingType}
                                                        onChange={(e) =>
                                                            setImagingForm({ ...imagingForm, imagingType: e.target.value })
                                                        }
                                                    >
                                                        <option value="XRAY">X-Ray</option>
                                                        <option value="ULTRASOUND">Ultrasound</option>
                                                        <option value="MRI">MRI</option>
                                                        <option value="CT_SCAN">CT Scan</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Scheduled Date</label>
                                                    <input
                                                        type="date"
                                                        value={imagingForm.scheduledDate}
                                                        onChange={(e) =>
                                                            setImagingForm({ ...imagingForm, scheduledDate: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Cost</label>
                                                    <input
                                                        type="number"
                                                        value={imagingForm.cost}
                                                        onChange={(e) =>
                                                            setImagingForm({ ...imagingForm, cost: e.target.value })
                                                        }
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Instructions</label>
                                                    <textarea
                                                        value={imagingForm.instructions}
                                                        onChange={(e) =>
                                                            setImagingForm({ ...imagingForm, instructions: e.target.value })
                                                        }
                                                        placeholder="Instructions for imaging..."
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="submit-btn">
                                                Request Imaging
                                            </button>
                                        </form>

                                        {/* Imaging History */}
                                        {caseData.imaging?.length > 0 && (
                                            <div className="record-history">
                                                <h3>Imaging Records</h3>
                                                {caseData.imaging.map((img, index) => (
                                                    <div key={index} className="record-card">
                                                        <div className="record-header">
                                                            <strong>{img.imagingType}</strong>
                                                            <span className={`status-badge ${img.status?.toLowerCase()}`}>
                                                                {img.status}
                                                            </span>
                                                        </div>
                                                        <p>
                                                            <strong>Instructions:</strong> {img.instructions || "N/A"}
                                                        </p>
                                                        {img.findings && <p>
                                                            <strong>Findings:</strong> {img.findings}
                                                        </p>}
                                                        <div className="imaging-actions">
                                                            {img.status === "PENDING" && (
                                                                <button onClick={() => handleUpdateImagingStatus(img.id, "IN_PROGRESS")}>
                                                                    Start
                                                                </button>
                                                            )}
                                                            {img.status === "IN_PROGRESS" && (
                                                                <button onClick={() => handleUpdateImagingStatus(img.id, "COMPLETED")}>
                                                                    Complete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <p>No active case for this pet. Create a case first to add imaging.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Diagnosis Tab */}
                        {activeTab === "diagnosis" && (
                            <div className="tab-panel">
                                <h2>💊 Diagnosis & Prescriptions</h2>

                                {caseData ? (
                                    <>
                                        <form onSubmit={handleSubmitDiagnosis} className="case-form">
                                            <div className="form-group full-width">
                                                <label>Diagnosis</label>
                                                <textarea
                                                    value={diagnosisForm.diagnosis}
                                                    onChange={(e) =>
                                                        setDiagnosisForm({ ...diagnosisForm, diagnosis: e.target.value })
                                                    }
                                                    placeholder="Enter diagnosis..."
                                                    required
                                                />
                                            </div>
                                            <div className="form-group full-width">
                                                <label>Notes</label>
                                                <textarea
                                                    value={diagnosisForm.notes}
                                                    onChange={(e) =>
                                                        setDiagnosisForm({ ...diagnosisForm, notes: e.target.value })
                                                    }
                                                    placeholder="Additional notes..."
                                                />
                                            </div>

                                            <h3>Medications</h3>
                                            {diagnosisForm.medications.map((med, index) => (
                                                <div key={index} className="medication-row">
                                                    <input
                                                        placeholder="Medicine Name"
                                                        value={med.medicineName}
                                                        onChange={(e) => handleMedicationChange(index, "medicineName", e.target.value)}
                                                        required
                                                    />
                                                    <input
                                                        placeholder="Dosage"
                                                        value={med.dosage}
                                                        onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                                                    />
                                                    <input
                                                        placeholder="Frequency"
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                                                    />
                                                    <input
                                                        placeholder="Duration"
                                                        value={med.duration}
                                                        onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                            <button type="button" className="add-med-btn" onClick={handleAddMedication}>
                                                + Add Medication
                                            </button>

                                            <button type="submit" className="submit-btn">
                                                Add Diagnosis
                                            </button>
                                        </form>

                                        {/* Diagnosis History */}
                                        {caseData.diagnoses?.length > 0 && (
                                            <div className="record-history">
                                                <h3>Diagnosis History</h3>
                                                {caseData.diagnoses.map((diag, index) => (
                                                    <div key={index} className="record-card">
                                                        <p>
                                                            <strong>Diagnosis:</strong> {diag.diagnosis}
                                                        </p>
                                                        <p>
                                                            <strong>Date:</strong> {new Date(diag.diagnosedAt).toLocaleDateString()}
                                                        </p>
                                                        {diag.notes && <p>
                                                            <strong>Notes:</strong> {diag.notes}</p>
                                                        }
                                                        {diag.medications?.length > 0 && (
                                                            <div className="medications-list">
                                                                <strong>Medications:</strong>
                                                                {diag.medications.map((med, i) => (
                                                                    <div key={i} className="medication-item">
                                                                        {med.medicineName} - {med.dosage} - {med.frequency} - {med.duration}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <p>No active case for this pet. Create a case first to add diagnosis.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Procedures Tab */}
                        {activeTab === "procedures" && (
                            <div className="tab-panel">
                                <h2>⚕️ Procedures</h2>

                                {caseData ? (
                                    <>
                                        <form onSubmit={handleSubmitProcedure} className="case-form">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Procedure Name</label>
                                                    <input
                                                        value={procedureForm.procedureName}
                                                        onChange={(e) =>
                                                            setProcedureForm({ ...procedureForm, procedureName: e.target.value })
                                                        }
                                                        placeholder="e.g., Wound Dressing, Surgery"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Date</label>
                                                    <input
                                                        type="date"
                                                        value={procedureForm.procedureDate}
                                                        onChange={(e) =>
                                                            setProcedureForm({ ...procedureForm, procedureDate: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Cost</label>
                                                    <input
                                                        type="number"
                                                        value={procedureForm.cost}
                                                        onChange={(e) =>
                                                            setProcedureForm({ ...procedureForm, cost: e.target.value })
                                                        }
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Description</label>
                                                    <textarea
                                                        value={procedureForm.description}
                                                        onChange={(e) =>
                                                            setProcedureForm({ ...procedureForm, description: e.target.value })
                                                        }
                                                        placeholder="Procedure details..."
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="submit-btn">
                                                Add Procedure
                                            </button>
                                        </form>

                                        {/* Procedures History */}
                                        {caseData.procedures?.length > 0 && (
                                            <div className="record-history">
                                                <h3>Procedures Done</h3>
                                                {caseData.procedures.map((proc, index) => (
                                                    <div key={index} className="record-card">
                                                        <div className="record-header">
                                                            <strong>{proc.procedureName}</strong>
                                                            <span>${proc.cost || 0}</span>
                                                        </div>
                                                        <p>Date: {new Date(proc.procedureDate).toLocaleDateString()}</p>
                                                        {proc.description && <p>Description: {proc.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <p>No active case for this pet. Create a case first to add procedures.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Vaccination Tab */}
                        {activeTab === "vaccination" && (
                            <div className="tab-panel">
                                <h2>💉 Vaccination</h2>

                                {caseData ? (
                                    <>
                                        <form onSubmit={handleSubmitVaccination} className="case-form">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Vaccine Name</label>
                                                    <input
                                                        value={vaccinationForm.vaccineName}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })
                                                        }
                                                        placeholder="e.g., Rabies, DHPP"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Due Date</label>
                                                    <input
                                                        type="date"
                                                        value={vaccinationForm.dueDate}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, dueDate: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Administered Date</label>
                                                    <input
                                                        type="date"
                                                        value={vaccinationForm.administeredDate}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, administeredDate: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Next Due Date</label>
                                                    <input
                                                        type="date"
                                                        value={vaccinationForm.nextDueDate}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Batch Number</label>
                                                    <input
                                                        value={vaccinationForm.batchNumber}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, batchNumber: e.target.value })
                                                        }
                                                        placeholder="Batch/Lot number"
                                                    />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Notes</label>
                                                    <textarea
                                                        value={vaccinationForm.notes}
                                                        onChange={(e) =>
                                                            setVaccinationForm({ ...vaccinationForm, notes: e.target.value })
                                                        }
                                                        placeholder="Additional notes..."
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="submit-btn">
                                                Add Vaccination
                                            </button>
                                        </form>

                                        {/* Vaccination History */}
                                        {caseData.vaccinations?.length > 0 && (
                                            <div className="record-history">
                                                <h3>Vaccination History</h3>
                                                {caseData.vaccinations.map((vac, index) => (
                                                    <div key={index} className="record-card">
                                                        <div className="record-header">
                                                            <strong>{vac.vaccineName}</strong>
                                                        </div>
                                                        {vac.administeredDate && (
                                                            <p>Administered: {new Date(vac.administeredDate).toLocaleDateString()}</p>
                                                        )}
                                                        {vac.nextDueDate && (
                                                            <p>Next Due: {new Date(vac.nextDueDate).toLocaleDateString()}</p>
                                                        )}
                                                        {vac.batchNumber && <p>Batch: {vac.batchNumber}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <p>No active case for this pet. Create a case first to add vaccinations.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VetPetDetails;
