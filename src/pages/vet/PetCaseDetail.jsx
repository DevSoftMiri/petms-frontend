import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import "./PetCaseDetail.css";

const TAB_IMAGES = {
  generalinformation: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515631/Screenshot_2026-05-23_112101_mdqa41.png",
  medicalrecord: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515631/Screenshot_2026-05-23_112116_v7tev0.png",
  history: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515631/Screenshot_2026-05-23_112126_piqded.png",
  appointments: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515943/Screenshot_2026-05-23_112851_wmbd1g.png",
  historicprofile: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515631/Screenshot_2026-05-23_112101_mdqa41.png",
  communication: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1779515631/Screenshot_2026-05-23_112248_w1v1as.png",
};

const PetCaseDetail = () => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const { state: clinicState } = useContext(ClinicContext);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const clinicId = clinicState?.selectedClinicId || localStorage.getItem("selectedClinicId");
  const historyOnly = searchParams.get("view") === "history";

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState(historyOnly ? "casesheet" : "generalinformation");
  const [activeClinicTab, setActiveClinicTab] = useState("vet");

  const medicalRecordTabs = [
    { label: "Symptoms", id: "symptoms" },
    { label: "Lab Tests", id: "labtests" },
    { label: "Imaging", id: "imaging" },
    { label: "Diagnosis", id: "diagnosis" },
    { label: "Procedures", id: "procedures" },
    { label: "Vaccination", id: "vaccination" },
    { label: "Case Sheet", id: "casesheet" },
  ];

  const mainTabs = [
    { label: "General Information", id: "generalinformation" },
    { label: "Medical Record", id: "medicalrecord" },
    { label: "History", id: "history" },
    { label: "Appointments", id: "appointments" },
    { label: "Historic Profile", id: "historicprofile" },
    { label: "Communication", id: "communication" },
  ];

  const isMedicalRecordActive = medicalRecordTabs.some((t) => t.id === activeTab);
  const activeMainTab = isMedicalRecordActive ? "medicalrecord" : activeTab;

  const handleMainTabClick = (tabId) => {
    if (tabId === "medicalrecord") setActiveTab("symptoms");
    else setActiveTab(tabId);
  };

  const handleClinicTabChange = (tab) => {
    setActiveClinicTab(tab);
    if (tab === "vet") { navigate(clinicId ? `/clinics/${clinicId}/vet` : "/vet/dashboard"); return; }
    if (clinicId) navigate(`/clinics/${clinicId}/${tab}`);
  };

  const renderWithSidebar = (content) => (
    <div className="case-detail-page">
      <SuperAdminNavbar />
      <div className="case-detail-layout">
        <Sidebar activeClinicTab={activeClinicTab} onTabChange={handleClinicTabChange} />
        {content}
      </div>
    </div>
  );

  // ── Form states ──────────────────────────────────────────────────────────────
  const [symptomForm, setSymptomForm] = useState({ chiefComplaint: "", symptomsObserved: "", clinicalNotes: "", weight: "", temperature: "", pulse: "", heartRate: "", appetiteStatus: "Normal", diagnosticPlan: "" });
  const [labTestForm, setLabTestForm] = useState({ testType: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [imagingForm, setImagingForm] = useState({ imagingType: "XRAY", bodyPart: "", instructions: "", scheduledDate: "", cost: "" });
  const [procedureForm, setProcedureForm] = useState({ procedureName: "", description: "", procedureDate: new Date().toISOString().split("T")[0], performedBy: "", parentProcedureId: "" });
  const [vaccinationForm, setVaccinationForm] = useState({ vaccineName: "", administeredBy: "", administeredDate: new Date().toISOString().split("T")[0], nextDueDate: "", dose: "", batchNumber: "" });
  const [diagnosisForm, setDiagnosisForm] = useState({ diagnosis: "", treatmentPlan: "", dischargeNote: "", physicianNote: "", notes: "", followUpDate: "", followUpTimeSlot: "", remarks: "", medications: [{ medicineName: "", dosage: "", frequency: "", duration: "" }] });
  const [clinicDoctors, setClinicDoctors] = useState([]);

  // ── Report viewer modal ──────────────────────────────────────────────────────
  const [reportModal, setReportModal] = useState({ isOpen: false, url: "", title: "" });

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const fetchCaseData = useCallback(async () => {
    if (!clinicId) { enqueueSnackbar("Clinic not selected", { variant: "error" }); setLoading(false); return; }
    try {
      setLoading(true);
      const res = await HttpService.getWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}`);
      const result = res.data || res;
      if (!result) { enqueueSnackbar("Case not found", { variant: "error" }); setTimeout(() => navigate(clinicId ? `/clinics/${clinicId}/vet` : "/vet/dashboard"), 1500); return; }

      // Fetch lab tests for this pet and attach them to the case data
      try {
        const labRes = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory`);
        const allLabs = Array.isArray(labRes) ? labRes : (labRes?.data || []);
        const petLabs = allLabs.filter(lab => lab.petId === result.petId);
        result.pet = { ...result.pet, labTests: petLabs };
      } catch (labError) {
        console.error("Error fetching lab tests:", labError);
        // Continue even if lab tests fail to load
      }

      setCaseData(result);
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Case not found or no longer accessible", { variant: "error" });
      setTimeout(() => navigate(clinicId ? `/clinics/${clinicId}/vet` : "/vet/dashboard"), 1500);
    } finally { setLoading(false); }
  }, [caseId, clinicId, enqueueSnackbar, navigate]);

  useEffect(() => { fetchCaseData(); }, [fetchCaseData]);

  useEffect(() => {
    if (!clinicId) return;

    const fetchClinicDoctors = async () => {
      try {
        const res = await HttpService.getWithAuth(`/users?clinicId=${clinicId}&role=VET&limit=100`);
        const doctors = Array.isArray(res) ? res : (res?.data || []);
        setClinicDoctors(doctors);
      } catch (error) {
        console.error("Error fetching clinic doctors:", error);
        setClinicDoctors([]);
      }
    };

    fetchClinicDoctors();
  }, [clinicId]);

  // Auto-refresh lab tests and imaging every 5 seconds to show updates from lab/imaging technician
  useEffect(() => {
    if (!clinicId || !caseId || !caseData?.petId) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Refresh entire case data to get updated imaging and lab tests
        const res = await HttpService.getWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}`);
        const result = res.data || res;

        // Fetch lab tests for this pet
        try {
          const labRes = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory`);
          const allLabs = Array.isArray(labRes) ? labRes : (labRes?.data || []);
          const petLabs = allLabs.filter(lab => lab.petId === caseData.petId);
          result.pet = { ...result.pet, labTests: petLabs };
        } catch (labError) {
          console.error("Error refreshing lab tests:", labError);
        }

        setCaseData(result);
      } catch (err) {
        console.error("Error auto-refreshing case data:", err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [clinicId, caseId, caseData?.petId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSubmitSymptoms = async (e) => {
    e.preventDefault();
    try { await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/symptoms`, symptomForm); enqueueSnackbar("Symptoms recorded successfully", { variant: "success" }); fetchCaseData(); setSymptomForm({ chiefComplaint: "", symptomsObserved: "", clinicalNotes: "", weight: "", temperature: "", pulse: "", heartRate: "", appetiteStatus: "Normal", diagnosticPlan: "" }); }
    catch { enqueueSnackbar("Failed to record symptoms", { variant: "error" }); }
  };
  const handleSubmitImaging = async (e) => {
    e.preventDefault();
    try { await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/imaging`, imagingForm); enqueueSnackbar("Imaging request added", { variant: "success" }); fetchCaseData(); setImagingForm({ imagingType: "XRAY", bodyPart: "", instructions: "", scheduledDate: new Date().toISOString().split("T")[0], cost: "" }); }
    catch { enqueueSnackbar("Failed to add imaging", { variant: "error" }); }
  };
  const handleSubmitLabTest = async (e) => {
    e.preventDefault();
    if (!labTestForm.testType) { enqueueSnackbar("Test type is required", { variant: "error" }); return; }
    const requestingVeterinarian = caseData.pet?.assignedVet
      ? `Dr. ${`${caseData.pet.assignedVet.firstName || ""} ${caseData.pet.assignedVet.lastName || ""}`.trim()}`.trim()
      : caseData.vet
        ? `Dr. ${`${caseData.vet.firstName || ""} ${caseData.vet.lastName || ""}`.trim()}`.trim()
        : "";
    try {
      await HttpService.postWithAuth(`/clinics/${clinicId}/laboratory`, {
        petId: caseData.petId,
        petName: caseData.pet?.name || "",
        customerCode: caseData.medicalRecordNumber || "",
        testType: labTestForm.testType,
        date: labTestForm.date,
        notes: labTestForm.notes,
        status: "Pending",
        veterinarian: requestingVeterinarian,
        result: "",
        reportUrl: ""
      });
      enqueueSnackbar("Lab test assigned successfully", { variant: "success" });

      // Fetch lab tests for this pet to update the display immediately
      try {
        const labRes = await HttpService.getWithAuth(`/clinics/${clinicId}/laboratory`);
        const allLabs = Array.isArray(labRes) ? labRes : (labRes?.data || []);
        const petLabs = allLabs.filter(lab => lab.petId === caseData.petId);
        setCaseData(prev => ({ ...prev, pet: { ...prev.pet, labTests: petLabs } }));
      } catch (labError) {
        console.error("Error fetching lab tests:", labError);
        // Still refresh the page data even if lab fetch fails
        fetchCaseData();
      }

      setLabTestForm({ testType: "", date: new Date().toISOString().split("T")[0], notes: "" });
    } catch (error) {
      enqueueSnackbar("Failed to assign lab test", { variant: "error" });
    }
  };
  const handleSubmitProcedure = async (e) => {
    e.preventDefault();
    const payload = {
      ...procedureForm,
      parentProcedureId: procedureForm.parentProcedureId || null,
    };
    try { await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/procedures`, payload); enqueueSnackbar(procedureForm.parentProcedureId ? "Follow-up procedure added" : "Procedure added", { variant: "success" }); fetchCaseData(); setProcedureForm({ procedureName: "", description: "", procedureDate: new Date().toISOString().split("T")[0], performedBy: "", parentProcedureId: "" }); }
    catch { enqueueSnackbar("Failed to add procedure", { variant: "error" }); }
  };
  const handleSubmitVaccination = async (e) => {
    e.preventDefault();
    try { await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/vaccinations`, vaccinationForm); enqueueSnackbar("Vaccination added", { variant: "success" }); fetchCaseData(); setVaccinationForm({ vaccineName: "", administeredBy: "", administeredDate: new Date().toISOString().split("T")[0], nextDueDate: "", dose: "", batchNumber: "" }); }
    catch { enqueueSnackbar("Failed to add vaccination", { variant: "error" }); }
  };
  const handleAddMedication = () => setDiagnosisForm({ ...diagnosisForm, medications: [...diagnosisForm.medications, { medicineName: "", dosage: "", frequency: "", duration: "" }] });
  const handleQuickAddFollowUpAppointment = async () => {
    if (!diagnosisForm.followUpDate || !diagnosisForm.followUpTimeSlot) {
      enqueueSnackbar("Please fill in Follow-up Date and Time Slot", { variant: "error" });
      return;
    }
    if (!caseData || !caseData.petId) {
      enqueueSnackbar("Missing pet information", { variant: "error" });
      return;
    }
    try {
      const customerId = caseData.pet?.owner?.id || caseData.pet?.ownerId || caseData.customerId;
      if (!customerId) {
        enqueueSnackbar("Customer information not available", { variant: "error" });
        return;
      }

      // Prioritize assigned vet, then case vet
      const vetId = caseData.pet?.assignedVetId || caseData.vet?.id || caseData.vetId;
      if (!vetId) {
        enqueueSnackbar("No veterinarian assigned to this pet", { variant: "error" });
        return;
      }

      // Combine date and time into a proper DateTime
      const [hours, minutes] = diagnosisForm.followUpTimeSlot.split(':');
      const appointmentDateTime = new Date(`${diagnosisForm.followUpDate}T${diagnosisForm.followUpTimeSlot}:00`);

      if (isNaN(appointmentDateTime.getTime())) {
        enqueueSnackbar("Invalid follow-up date or time", { variant: "error" });
        return;
      }

      const appointmentData = {
        petId: caseData.petId,
        customerId: customerId,
        vetId: vetId,
        appointmentDate: appointmentDateTime.toISOString(),
        reason: "Follow-up Appointment",
        notes: diagnosisForm.remarks || "Follow-up appointment from medical diagnosis",
      };

      await HttpService.postWithAuth(`/clinics/${clinicId}/appointments`, appointmentData);
      enqueueSnackbar("Follow-up appointment added to calendar ✓", { variant: "success" });
    } catch (err) {
      console.error("Error adding appointment:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      enqueueSnackbar(`Failed to add appointment: ${errorMsg}`, { variant: "error" });
    }
  };
  const handleSubmitDiagnosisWithFollowUp = async (e) => {
    e.preventDefault();
    try {
      // Submit diagnosis
      await HttpService.postWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/diagnoses`, diagnosisForm);
      enqueueSnackbar("Diagnosis added", { variant: "success" });

      // Auto-create appointment if follow-up date and time slot are provided
      if (diagnosisForm.followUpDate && diagnosisForm.followUpTimeSlot && caseData) {
        try {
          const customerId = caseData.pet?.owner?.id || caseData.pet?.ownerId || caseData.customerId;
          // Prioritize assigned vet, then case vet
          const vetId = caseData.pet?.assignedVetId || caseData.vet?.id || caseData.vetId;

          if (customerId && vetId) {
            // Combine date and time into a proper DateTime
            const appointmentDateTime = new Date(`${diagnosisForm.followUpDate}T${diagnosisForm.followUpTimeSlot}:00`);

            if (!isNaN(appointmentDateTime.getTime())) {
              const appointmentData = {
                petId: caseData.petId,
                customerId: customerId,
                vetId: vetId,
                appointmentDate: appointmentDateTime.toISOString(),
                reason: "Follow-up Appointment",
                notes: diagnosisForm.remarks || "Follow-up appointment from medical diagnosis",
              };
              await HttpService.postWithAuth(`/clinics/${clinicId}/appointments`, appointmentData);
              enqueueSnackbar("Follow-up appointment created", { variant: "success" });
            }
          }
        } catch (err) {
          console.error("Appointment creation error:", err);
          const errorMsg = err.response?.data?.message || err.message;
          enqueueSnackbar("Diagnosis added but appointment failed: " + errorMsg, { variant: "warning" });
        }
      }

      fetchCaseData();
      setDiagnosisForm({ diagnosis: "", treatmentPlan: "", dischargeNote: "", physicianNote: "", notes: "", followUpDate: "", followUpTimeSlot: "", remarks: "", medications: [{ medicineName: "", dosage: "", frequency: "", duration: "" }] });
    } catch { enqueueSnackbar("Failed to add diagnosis", { variant: "error" }); }
  };
  const handleMedicationChange = (index, field, value) => { const u = [...diagnosisForm.medications]; u[index][field] = value; setDiagnosisForm({ ...diagnosisForm, medications: u }); };
  const handleUpdateImagingStatus = async (imagingId, status, findings = "") => {
    try { await HttpService.putWithAuth(`/clinics/${clinicId}/vet/cases/${caseId}/imaging/${imagingId}`, { status, findings }); enqueueSnackbar("Imaging status updated", { variant: "success" }); fetchCaseData(); }
    catch { enqueueSnackbar("Failed to update imaging", { variant: "error" }); }
  };

  // View report in modal
  const handleViewReport = (url, title) => {
    setReportModal({ isOpen: true, url, title });
  };

  const closeReportModal = () => {
    setReportModal({ isOpen: false, url: "", title: "" });
  };

  // ── Loading / empty states ───────────────────────────────────────────────────
  if (loading) return renderWithSidebar(<div className="case-detail-container"><div className="case-loading-spinner"><div className="case-spinner"></div><p>Loading case...</p></div></div>);
  if (!caseData) return renderWithSidebar(<div className="case-detail-container"><div className="empty-state">Case not found</div></div>);

  const procedures = caseData.procedures || [];
  const mainProcedures = procedures.filter((procedure) => !procedure.parentProcedureId);
  const getFollowUpProcedures = (procedureId) =>
    procedures
      .filter((procedure) => procedure.parentProcedureId === procedureId)
      .sort((a, b) => new Date(a.procedureDate) - new Date(b.procedureDate));
  const getProcedureName = (procedureId) =>
    procedures.find((procedure) => procedure.id === procedureId)?.procedureName || "Main procedure";

  // ── Render ───────────────────────────────────────────────────────────────────
  return renderWithSidebar(
    <div className="case-detail-container">

      {/* ── Header ── */}
      <div className="case-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="case-title">
          <h1>{caseData.medicalRecordNumber ? `${caseData.medicalRecordNumber} (${caseData.caseNumber})` : caseData.caseNumber}</h1>
          <span className={`status-badge ${caseData.status?.toLowerCase()}`}>{caseData.status}</span>
        </div>
        <div className="case-meta">
          <p><strong>Pet:</strong> {caseData.pet?.name} ({caseData.pet?.species})</p>
          <p><strong>Owner:</strong> {caseData.pet?.owner?.firstName} {caseData.pet?.owner?.lastName}</p>
          <p><strong>Vet:</strong> {caseData.pet?.assignedVet ? `Dr. ${caseData.pet.assignedVet.firstName} ${caseData.pet.assignedVet.lastName}` : (caseData.vet ? `Dr. ${caseData.vet?.firstName} ${caseData.vet?.lastName}` : "N/A")}</p>
          <p><strong>Date:</strong> {new Date(caseData.caseDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* ── Main tabs ── */}
      {!historyOnly && (
        <>
          <div className="case-tabs main-tabs">
            {mainTabs.map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn${isActive ? " active" : ""}`}
                  onClick={() => handleMainTabClick(tab.id)}
                >
                  <img
                    src={TAB_IMAGES[tab.id]}
                    alt=""
                    className={`tab-thumb${isActive ? " tab-thumb-active" : ""}`}
                  />
                  <span className="tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isMedicalRecordActive && (
            <div className="case-tabs medical-record-tabs">
              {medicalRecordTabs.map((tab) => (
                <button key={tab.id} className={`tab-btn${activeTab === tab.id ? " active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab content ── */}
      <div className="case-content">

        {/* ══ General Information ══ */}
        {activeTab === "generalinformation" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">

              <h2>📋 Pet General Information</h2>
            </div>
            <div className="general-info-container">
              <div className="info-card">
                <h3>🐾 Pet Details</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Pet Name</label><p>{caseData.pet?.name || "N/A"}</p></div>
                  <div className="info-item"><label>Pet ID</label><p>{caseData.pet?.petId || "N/A"}</p></div>
                  <div className="info-item"><label>Species</label><p>{caseData.pet?.species || "N/A"}</p></div>
                  <div className="info-item"><label>Breed</label><p>{caseData.pet?.breed || "N/A"}</p></div>
                  <div className="info-item"><label>Gender</label><p>{caseData.pet?.gender || "N/A"}</p></div>
                  <div className="info-item"><label>Colour</label><p>{caseData.pet?.colour || "N/A"}</p></div>
                  <div className="info-item"><label>Age (months)</label><p>{caseData.pet?.age || "N/A"}</p></div>
                  <div className="info-item"><label>Weight (kg)</label><p>{caseData.pet?.weight || "N/A"}</p></div>
                  <div className="info-item"><label>Date of Birth</label><p>{caseData.pet?.dateOfBirth ? new Date(caseData.pet.dateOfBirth).toLocaleDateString() : "N/A"}</p></div>
                  <div className="info-item"><label>Microchip ID</label><p>{caseData.pet?.microchipId || "N/A"}</p></div>
                  <div className="info-item"><label>Status</label><p><span className={`status-badge status-${caseData.pet?.status?.toLowerCase() || "available"}`}>{caseData.pet?.status || "N/A"}</span></p></div>
                  {caseData.pet?.admissionDate && <div className="info-item"><label>Admission Date</label><p>{new Date(caseData.pet.admissionDate).toLocaleDateString()}</p></div>}
                </div>
              </div>
              <div className="info-card">
                <h3>👤 Owner Details</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Owner Name</label><p>{caseData.pet?.owner?.firstName} {caseData.pet?.owner?.lastName || "N/A"}</p></div>
                  <div className="info-item"><label>Customer ID</label><p>{caseData.pet?.owner?.customerId || "N/A"}</p></div>
                  <div className="info-item"><label>Phone Number</label><p>{caseData.pet?.owner?.phoneNumber || "N/A"}</p></div>
                  <div className="info-item"><label>Email</label><p>{caseData.pet?.owner?.email || "N/A"}</p></div>
                </div>
              </div>
              {caseData.pet?.assignedVet && (
                <div className="info-card">
                  <h3>⚕️ Assigned Veterinarian</h3>
                  <div className="info-grid">
                    <div className="info-item"><label>Vet Name</label><p>Dr. {caseData.pet.assignedVet.firstName} {caseData.pet.assignedVet.lastName}</p></div>
                    <div className="info-item"><label>Email</label><p>{caseData.pet.assignedVet.email || "N/A"}</p></div>
                  </div>
                </div>
              )}
              {caseData.pet?.medicalNotes && (
                <div className="info-card">
                  <h3>📝 Medical Notes</h3>
                  <div className="medical-notes-box">{caseData.pet.medicalNotes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ Symptoms ══ */}
        {activeTab === "symptoms" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>📋 Symptoms & Vitals</h2>
            </div>
            <form onSubmit={handleSubmitSymptoms} className="case-form">
              <div className="form-grid">
                {/* First row: Vitals - 4 columns */}
                <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" value={symptomForm.weight} onChange={(e) => setSymptomForm({ ...symptomForm, weight: e.target.value })} placeholder="10.5" /></div>
                <div className="form-group"><label>Temperature (°F)</label><input type="number" step="0.1" value={symptomForm.temperature} onChange={(e) => setSymptomForm({ ...symptomForm, temperature: e.target.value })} placeholder="98.6" /></div>
                <div className="form-group"><label>Pulse (bpm)</label><input type="number" value={symptomForm.pulse} onChange={(e) => setSymptomForm({ ...symptomForm, pulse: e.target.value })} placeholder="80" /></div>
                <div className="form-group"><label>Heart Rate (bpm)</label><input type="number" value={symptomForm.heartRate} onChange={(e) => setSymptomForm({ ...symptomForm, heartRate: e.target.value })} placeholder="72" /></div>

                {/* Second row: Chief Complaint, Symptoms, Appetite Status */}
                <div className="form-group"><label>Chief Complaint</label><textarea value={symptomForm.chiefComplaint} onChange={(e) => setSymptomForm({ ...symptomForm, chiefComplaint: e.target.value })} placeholder="Primary complaint..." /></div>
                <div className="form-group"><label>Symptoms Observed</label><textarea value={symptomForm.symptomsObserved} onChange={(e) => setSymptomForm({ ...symptomForm, symptomsObserved: e.target.value })} placeholder="List observed symptoms..." /></div>
                <div className="form-group"><label>Appetite Status</label>
                  <select value={symptomForm.appetiteStatus} onChange={(e) => setSymptomForm({ ...symptomForm, appetiteStatus: e.target.value })}>
                    <option value="Normal">Normal</option><option value="Good">Good</option><option value="Poor">Poor</option><option value="None">None</option>
                  </select>
                </div>

                {/* Third row: Diagnostic Plan and Clinical Notes */}
                <div className="form-group full-width"><label>Diagnostic Plan</label><textarea value={symptomForm.diagnosticPlan} onChange={(e) => setSymptomForm({ ...symptomForm, diagnosticPlan: e.target.value })} placeholder="Diagnostic plan..." /></div>
                <div className="form-group full-width"><label>Clinical Notes</label><textarea value={symptomForm.clinicalNotes} onChange={(e) => setSymptomForm({ ...symptomForm, clinicalNotes: e.target.value })} placeholder="Additional clinical notes..." /></div>
              </div>
              <button type="submit" className="submit-btn">Record Symptoms</button>
            </form>
            {caseData.symptoms?.length > 0 && (
              <div className="record-history"><h3>Symptom History</h3>
                {caseData.symptoms.map((s, i) => (
                  <div key={i} className="record-card">
                    <div className="record-date">{new Date(s.recordedAt).toLocaleString()}</div>
                    {s.chiefComplaint && <p><strong>Complaint:</strong> {s.chiefComplaint}</p>}
                    {s.weight && <p><strong>Weight:</strong> {s.weight} kg</p>}
                    {s.temperature && <p><strong>Temp:</strong> {s.temperature}°F</p>}
                    {s.pulse && <p><strong>Pulse:</strong> {s.pulse} bpm</p>}
                    {s.heartRate && <p><strong>Heart Rate:</strong> {s.heartRate} bpm</p>}
                    {s.symptomsObserved && <p><strong>Symptoms:</strong> {s.symptomsObserved}</p>}
                    {s.appetiteStatus && <p><strong>Appetite:</strong> {s.appetiteStatus}</p>}
                    {s.diagnosticPlan && <p><strong>Diagnostic Plan:</strong> {s.diagnosticPlan}</p>}
                    {s.clinicalNotes && <p><strong>Clinical Notes:</strong> {s.clinicalNotes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ Lab Tests ══ */}
        {activeTab === "labtests" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              {/* <img src={TAB_IMAGES.medicalrecord} alt="Medical Record" className="tab-hero-img" /> */}
              <h2>🧪 Laboratory Tests</h2>
            </div>

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
                    {/* <option value="X-Ray" /> */}
                    {/* <option value="Ultrasound" /> */}
                    <option value="Allergy Test" />
                    <option value="Blood Culture" />
                    {/* <option value="ECG" /> */}
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
            {caseData.pet?.labTests?.length > 0 && (
              <div className="record-history">
                <h3>Assigned Lab Tests</h3>
                {caseData.pet.labTests.map((test, i) => (
                  <div key={i} className="record-card">
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
                          <>
                            <p style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>✓ Report Added</p>
                            <button
                              onClick={() => handleViewReport(test.reportUrl, `${test.testType} Report`)}
                              style={{ fontSize: "12px", padding: "4px 12px", marginTop: "4px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            >
                              👁️ View Report
                            </button>
                          </>
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

            {(!caseData.pet?.labTests || caseData.pet.labTests.length === 0) && (
              <div style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                <p>No lab tests assigned yet. Use the form above to assign tests.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ Imaging ══ */}
        {activeTab === "imaging" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>📷 Imaging</h2>
            </div>
            <form onSubmit={handleSubmitImaging} className="case-form">
              <div className="form-grid">
                <div className="form-group"><label>Imaging Type</label>
                  <select value={imagingForm.imagingType} onChange={(e) => setImagingForm({ ...imagingForm, imagingType: e.target.value })}>
                    <option value="XRAY">X-Ray</option>
                    <option value="ULTRASOUND">Ultrasound</option>
                    <option value="MRI">MRI</option>
                    <option value="CT_SCAN">CT Scan</option>
                    <option value="Positron Emission Tomography ">Positron Emission Tomography (PET)</option>
                  </select>
                </div>
                <div className="form-group"><label>Body Part</label><input type="text" value={imagingForm.bodyPart} onChange={(e) => setImagingForm({ ...imagingForm, bodyPart: e.target.value })} placeholder="e.g., Left Front Leg, Abdomen" /></div>
                {/* <div className="form-group"><label>Imaging Date</label><input type="date" value={imagingForm.scheduledDate} onChange={(e) => setImagingForm({ ...imagingForm, scheduledDate: e.target.value })} /></div> */}
                {/* <div className="form-group"><label>Cost</label><input type="number" value={imagingForm.cost} onChange={(e) => setImagingForm({ ...imagingForm, cost: e.target.value })} placeholder="0.00" /></div> */}
                <div className="form-group full-width"><label>Instructions</label><textarea value={imagingForm.instructions} onChange={(e) => setImagingForm({ ...imagingForm, instructions: e.target.value })} placeholder="Instructions for imaging..." /></div>
              </div>
              <button type="submit" className="submit-btn">Request Imaging</button>
            </form>
            {caseData.imaging?.length > 0 && (
              <div className="record-history">
                <h3>✓ Imaging Requests ({caseData.imaging.length})</h3>
                {caseData.imaging.map((img, i) => (
                  <div key={i} className="record-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <p><strong>{img.imagingType}</strong> {img.bodyPart && `- ${img.bodyPart}`}</p>
                        {img.instructions && <p style={{ fontSize: "12px", color: "#6b7280" }}>Instructions: {img.instructions}</p>}
                        {img.findings && <p style={{ fontSize: "12px", color: "#059669" }}>Findings: {img.findings}</p>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`status-badge status-${img.status?.toLowerCase() || "pending"}`}>
                          {img.status || "Pending"}
                        </span>
                        {img.reportUrl && (
                          <>
                            <p style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>✓ Report Added</p>
                            <button
                              onClick={() => handleViewReport(img.reportUrl, `${img.imagingType} Report`)}
                              style={{ fontSize: "12px", padding: "4px 12px", marginTop: "4px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            >
                              👁️ View Report
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {img.status === "PENDING" && (
                      <div className="imaging-actions" style={{ marginTop: "8px" }}>
                        <button onClick={() => handleUpdateImagingStatus(img.id, "IN_PROGRESS")} style={{ fontSize: "12px", padding: "4px 8px" }}>Start Imaging</button>
                      </div>
                    )}
                    {img.status === "IN_PROGRESS" && (
                      <div className="imaging-actions" style={{ marginTop: "8px" }}>
                        <button onClick={() => handleUpdateImagingStatus(img.id, "COMPLETED")} style={{ fontSize: "12px", padding: "4px 8px" }}>Mark Complete</button>
                      </div>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                  💡 Imaging reports can be added from the Laboratory section (Imaging Reports tab) after the imaging is complete.
                </p>
              </div>
            )}

            {(!caseData.imaging || caseData.imaging.length === 0) && (
              <div style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                <p>No imaging requests yet. Use the form above to request imaging.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ Diagnosis ══ */}
        {activeTab === "diagnosis" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              {/* <img src={TAB_IMAGES.medicalrecord} alt="Medical Record" className="tab-hero-img" /> */}
              <h2>🏥 Diagnosis & Prescriptions</h2>
            </div>
            <form onSubmit={handleSubmitDiagnosisWithFollowUp} className="case-form">
              {/* Diagnosis, Treatment Plan, Discharge Note, Physician Note in columns */}
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group full-width"><label>Diagnosis</label><textarea value={diagnosisForm.diagnosis} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, diagnosis: e.target.value })} placeholder="Enter diagnosis..." required /></div>
                <div className="form-group full-width"><label>Treatment Plan</label><textarea value={diagnosisForm.treatmentPlan} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, treatmentPlan: e.target.value })} placeholder="Enter treatment plan..." /></div>
                <div className="form-group full-width"><label>Discharge Note</label><textarea value={diagnosisForm.dischargeNote} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, dischargeNote: e.target.value })} placeholder="Enter discharge note..." /></div>
                <div className="form-group full-width"><label>Physician Note</label><textarea value={diagnosisForm.physicianNote} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, physicianNote: e.target.value })} placeholder="Enter physician note..." /></div>
              </div>

              {/* Additional Notes */}
              <div className="form-group full-width" style={{ marginTop: 14 }}><label>Additional Notes</label><textarea value={diagnosisForm.notes} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, notes: e.target.value })} placeholder="Additional notes..." /></div>

              {/* Follow-up fields in one line */}
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 20 }}>
                <div className="form-group"><label>Follow-up Date</label><input type="date" value={diagnosisForm.followUpDate} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, followUpDate: e.target.value })} /></div>
                <div className="form-group"><label>Follow-up Time Slot</label><input type="time" value={diagnosisForm.followUpTimeSlot} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, followUpTimeSlot: e.target.value })} /></div>
                <div className="form-group"><label>Remarks</label><input type="text" value={diagnosisForm.remarks} onChange={(e) => setDiagnosisForm({ ...diagnosisForm, remarks: e.target.value })} placeholder="Follow-up remarks..." /></div>
              </div>

              {/* Quick Add to Calendar Button */}
              <button type="button" onClick={handleQuickAddFollowUpAppointment} className="submit-btn" style={{ marginTop: 10, background: "#10b981" }}>📅 Add to Calendar</button>

              <h3 style={{ marginTop: 20 }}>Medications</h3>
              {diagnosisForm.medications.map((med, i) => (
                <div key={i} className="medication-row">
                  <input placeholder="Medicine Name" value={med.medicineName} onChange={(e) => handleMedicationChange(i, "medicineName", e.target.value)} required />
                  <input placeholder="Dosage" value={med.dosage} onChange={(e) => handleMedicationChange(i, "dosage", e.target.value)} />
                  <input placeholder="Frequency" value={med.frequency} onChange={(e) => handleMedicationChange(i, "frequency", e.target.value)} />
                  <input placeholder="Duration" value={med.duration} onChange={(e) => handleMedicationChange(i, "duration", e.target.value)} />
                </div>
              ))}
              <button type="button" className="add-med-btn" onClick={handleAddMedication}>+ Add Medication</button>
              <button type="submit" className="submit-btn">Add Diagnosis</button>
            </form>
            {caseData.diagnoses?.length > 0 && (
              <div className="record-history"><h3>Diagnosis History</h3>
                {caseData.diagnoses.map((d, i) => (
                  <div key={i} className="record-card">
                    <p><strong>Diagnosis:</strong> {d.diagnosis}</p>
                    {d.treatmentPlan && <p><strong>Treatment Plan:</strong> {d.treatmentPlan}</p>}
                    {d.dischargeNote && <p><strong>Discharge Note:</strong> {d.dischargeNote}</p>}
                    {d.physicianNote && <p><strong>Physician Note:</strong> {d.physicianNote}</p>}
                    <p><strong>Date:</strong> {new Date(d.diagnosedAt).toLocaleDateString()}</p>
                    {d.notes && <p><strong>Notes:</strong> {d.notes}</p>}
                    {d.followUpDate && <p><strong>Follow-up:</strong> {new Date(d.followUpDate).toLocaleDateString()} at {d.followUpTimeSlot}{d.remarks ? ` - ${d.remarks}` : ""}</p>}
                    {d.medications?.length > 0 && (
                      <div className="medications-list"><strong>Medications:</strong>
                        {d.medications.map((m, j) => <div key={j} className="medication-item">{m.medicineName} - {m.dosage} - {m.frequency} - {m.duration}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ Procedures ══ */}
        {activeTab === "procedures" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              {/* <img src={TAB_IMAGES.med   */}
              <h2>⚕️ Procedures</h2>
            </div>
            <form onSubmit={handleSubmitProcedure} className="case-form">
              <div className="form-grid">
                <div className="form-group"><label>Procedure Name</label><input value={procedureForm.procedureName} onChange={(e) => setProcedureForm({ ...procedureForm, procedureName: e.target.value })} placeholder="e.g., Wound Dressing, Surgery" required /></div>
                <div className="form-group"><label>Date</label><input type="date" value={procedureForm.procedureDate} onChange={(e) => setProcedureForm({ ...procedureForm, procedureDate: e.target.value })} /></div>
                <div className="form-group"><label>Done By</label><input value={procedureForm.performedBy} onChange={(e) => setProcedureForm({ ...procedureForm, performedBy: e.target.value })} placeholder="Doctor or staff name" /></div>
                {mainProcedures.length > 0 && (
                  <div className="form-group"><label>Follow-up To</label><select value={procedureForm.parentProcedureId} onChange={(e) => setProcedureForm({ ...procedureForm, parentProcedureId: e.target.value })}><option value="">Main procedure</option>{mainProcedures.map((procedure) => (<option key={procedure.id} value={procedure.id}>{procedure.procedureName} - {new Date(procedure.procedureDate).toLocaleDateString()}</option>))}</select></div>
                )}
                <div className="form-group full-width"><label>Description</label><textarea value={procedureForm.description} onChange={(e) => setProcedureForm({ ...procedureForm, description: e.target.value })} placeholder="Procedure details..." /></div>
              </div>
              <button type="submit" className="submit-btn">{procedureForm.parentProcedureId ? "Add Follow-up Procedure" : "Add Procedure"}</button>
            </form>
            {caseData.procedures?.length > 0 && (
              <div className="record-history"><h3>Procedures Done</h3>
                {mainProcedures.map((p, i) => (
                  <div key={p.id || i} className="record-card procedure-card">
                    <div className="record-header"><strong>{p.procedureName}</strong><span>Main procedure</span></div>
                    <p>Date: {new Date(p.procedureDate).toLocaleDateString()}</p>
                    {p.performedBy && <p>Done by: {p.performedBy}</p>}
                    {p.description && <p>Description: {p.description}</p>}
                    <button type="button" className="inline-action-btn" onClick={() => setProcedureForm({ ...procedureForm, parentProcedureId: p.id })}>Add follow-up</button>
                    {getFollowUpProcedures(p.id).length > 0 && (
                      <div className="follow-up-list">
                        <h4>Follow-up Procedures</h4>
                        {getFollowUpProcedures(p.id).map((followUp) => (
                          <div key={followUp.id} className="follow-up-item">
                            <div className="record-header"><strong>{followUp.procedureName}</strong><span>{new Date(followUp.procedureDate).toLocaleDateString()}</span></div>
                            {followUp.performedBy && <p>Done by: {followUp.performedBy}</p>}
                            {followUp.description && <p>Description: {followUp.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {mainProcedures.length === 0 && <div className="empty-state">No main procedures recorded yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* ══ Vaccination ══ */}
        {activeTab === "vaccination" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              {/* <img src={TAB_IMAGES.medicalrecord} alt="Medical Record" className="tab-hero-img" /> */}
              <h2>💉 Vaccination</h2>
            </div>
            <form onSubmit={handleSubmitVaccination} className="case-form">
              <div className="form-grid">
                <div className="form-group"><label>Vaccine Name</label><input value={vaccinationForm.vaccineName} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })} placeholder="e.g., Rabies, DHPP" required /></div>
                <div className="form-group"><label>Done By</label><select value={vaccinationForm.administeredBy} onChange={(e) => setVaccinationForm({ ...vaccinationForm, administeredBy: e.target.value })}><option value="">Select doctor</option>{clinicDoctors.map((doctor) => { const doctorName = `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim(); return <option key={doctor.id} value={doctorName || doctor.email || doctor.id}>{doctorName || doctor.email || "Doctor"}</option>; })}</select></div>
                <div className="form-group"><label>Date Done On</label><input type="date" value={vaccinationForm.administeredDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, administeredDate: e.target.value })} /></div>
                <div className="form-group"><label>Next Due Date</label><input type="date" value={vaccinationForm.nextDueDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })} /></div>
                <div className="form-group"><label>Dose</label><input value={vaccinationForm.dose} onChange={(e) => setVaccinationForm({ ...vaccinationForm, dose: e.target.value })} placeholder="e.g., 1 ml, 0.5 ml" /></div>
                <div className="form-group"><label>Batch Number</label><input value={vaccinationForm.batchNumber} onChange={(e) => setVaccinationForm({ ...vaccinationForm, batchNumber: e.target.value })} placeholder="Batch/Lot number" /></div>
              </div>
              <button type="submit" className="submit-btn">Add Vaccination</button>
            </form>
            {caseData.vaccinations?.length > 0 && (
              <div className="record-history"><h3>Vaccination History</h3>
                {caseData.vaccinations.map((v, i) => (
                  <div key={i} className="record-card">
                    <div className="record-header"><strong>{v.vaccineName}</strong></div>
                    {v.administeredBy && <p>Done by: {v.administeredBy}</p>}
                    {v.administeredDate && <p>Date done on: {new Date(v.administeredDate).toLocaleDateString()}</p>}
                    {v.nextDueDate && <p>Next Due: {new Date(v.nextDueDate).toLocaleDateString()}</p>}
                    {v.dose && <p>Dose: {v.dose}</p>}
                    {v.batchNumber && <p>Batch: {v.batchNumber}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ Case Sheet ══ */}
        {activeTab === "casesheet" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>📋 Complete Case Sheet</h2>
            </div>
            <div className="case-sheet">
              <div className="sheet-section"><h3>Case Overview</h3>
                <p><strong>Medical Record:</strong> {caseData.caseNumber}</p>
                <p><strong>Status:</strong> {caseData.status}</p>
                <p><strong>Created:</strong> {new Date(caseData.caseDate).toLocaleDateString()}</p>
                <p><strong>Vet:</strong> Dr. {caseData.vet?.firstName} {caseData.vet?.lastName}</p>
              </div>
              <div className="sheet-section"><h3>Patient Information</h3>
                <p><strong>Pet:</strong> {caseData.pet?.name} ({caseData.pet?.species}, {caseData.pet?.breed})</p>
                <p><strong>Owner:</strong> {caseData.pet?.owner?.firstName} {caseData.pet?.owner?.lastName}</p>
                <p><strong>Contact:</strong> {caseData.pet?.owner?.phoneNumber}</p>
              </div>
              <div className="sheet-section"><h3>📋 Symptoms ({caseData.symptoms?.length || 0})</h3>
                {caseData.symptoms?.map((s, i) => (<div key={i} className="timeline-item"><span className="date">{new Date(s.recordedAt).toLocaleDateString()}</span><p>Temp: {s.temperature}°F | HR: {s.heartRate} bpm | Weight: {s.weight}kg</p><p>{s.chiefComplaint}</p></div>))}
              </div>
              <div className="sheet-section"><h3>📷 Imaging ({caseData.imaging?.length || 0})</h3>
                {caseData.imaging?.map((img, i) => (<div key={i} className="timeline-item"><span className="date">{img.status}</span><p>{img.imagingType}</p></div>))}
              </div>
              <div className="sheet-section"><h3>⚕️ Procedures ({caseData.procedures?.length || 0})</h3>
                {caseData.procedures?.map((p, i) => (<div key={i} className="timeline-item"><span className="date">{new Date(p.procedureDate).toLocaleDateString()}</span><p>{p.procedureName}</p>{p.performedBy && <p>Done by: {p.performedBy}</p>}{p.parentProcedureId && <p>Follow-up to: {p.parentProcedure?.procedureName || getProcedureName(p.parentProcedureId)}</p>}</div>))}
              </div>
              <div className="sheet-section"><h3>🏥 Diagnoses ({caseData.diagnoses?.length || 0})</h3>
                {caseData.diagnoses?.map((d, i) => (<div key={i} className="timeline-item"><span className="date">{new Date(d.diagnosedAt).toLocaleDateString()}</span><p>{d.diagnosis}</p>{d.medications?.length > 0 && <ul>{d.medications.map((m, j) => <li key={j}>{m.medicineName} - {m.dosage}, {m.frequency}, {m.duration}</li>)}</ul>}</div>))}
              </div>
              <div className="sheet-section"><h3>💉 Vaccinations ({caseData.vaccinations?.length || 0})</h3>
                {caseData.vaccinations?.map((v, i) => (<div key={i} className="timeline-item"><span className="date">{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : "Scheduled"}</span><p>{v.vaccineName}</p>{v.administeredBy && <p>Done by: {v.administeredBy}</p>}{v.dose && <p>Dose: {v.dose}</p>}{v.batchNumber && <p>Batch: {v.batchNumber}</p>}{v.nextDueDate && <p>Next due: {new Date(v.nextDueDate).toLocaleDateString()}</p>}</div>))}
              </div>
            </div>
          </div>
        )}

        {/* ══ History ══ */}
        {activeTab === "history" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>🕐 Visit History</h2>
            </div>
            <div className="history-timeline">
              {[
                ...(caseData.symptoms || []).map((s) => ({ type: "Symptoms", date: s.recordedAt, icon: "📋", detail: s.chiefComplaint || "Vitals recorded", sub: `Temp ${s.temperature}°F · HR ${s.heartRate} bpm · Weight ${s.weight} kg` })),
                ...(caseData.diagnoses || []).map((d) => ({ type: "Diagnosis", date: d.diagnosedAt, icon: "🏥", detail: d.diagnosis, sub: d.medications?.length ? `${d.medications.length} medication(s) prescribed` : "No medications" })),
                ...(caseData.procedures || []).map((p) => ({ type: p.parentProcedureId ? "Follow-up Procedure" : "Procedure", date: p.procedureDate, icon: "⚕️", detail: p.procedureName, sub: [p.performedBy ? `Done by ${p.performedBy}` : "", p.parentProcedureId ? `Follow-up to ${p.parentProcedure?.procedureName || getProcedureName(p.parentProcedureId)}` : ""].filter(Boolean).join(" | ") })),
                ...(caseData.vaccinations || []).map((v) => ({ type: "Vaccination", date: v.administeredDate || v.dueDate, icon: "💉", detail: v.vaccineName, sub: [v.administeredBy ? `Done by ${v.administeredBy}` : "", v.dose ? `Dose: ${v.dose}` : "", v.batchNumber ? `Batch: ${v.batchNumber}` : "", v.nextDueDate ? `Next due: ${new Date(v.nextDueDate).toLocaleDateString()}` : ""].filter(Boolean).join(" | ") })),
                ...(caseData.imaging || []).map((img) => ({ type: "Imaging", date: img.scheduledDate, icon: "📷", detail: img.imagingType, sub: `Status: ${img.status}` })),
              ].filter((e) => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).map((event, i) => (
                <div key={i} className="history-event">
                  <div className="history-event-icon">{event.icon}</div>
                  <div className="history-event-body">
                    <div className="history-event-header">
                      <span className="history-event-type">{event.type}</span>
                      <span className="history-event-date">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <p className="history-event-detail">{event.detail}</p>
                    {event.sub && <p className="history-event-sub">{event.sub}</p>}
                  </div>
                </div>
              ))}
              {!caseData.symptoms?.length && !caseData.diagnoses?.length && !caseData.procedures?.length && !caseData.vaccinations?.length && !caseData.imaging?.length && (
                <div className="empty-state">No visit history recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ══ Appointments ══ */}
        {activeTab === "appointments" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>📅 Appointments</h2>
            </div>
            <div className="appointments-container">
              <div className="appt-section">
                <h3>Upcoming Appointments</h3>
                {caseData.appointments?.filter((a) => new Date(a.date) >= new Date()).length > 0
                  ? caseData.appointments.filter((a) => new Date(a.date) >= new Date()).map((appt, i) => (
                    <div key={i} className="appt-card appt-upcoming">
                      <div className="appt-date-block"><span className="appt-day">{new Date(appt.date).getDate()}</span><span className="appt-month">{new Date(appt.date).toLocaleString("default", { month: "short" })}</span></div>
                      <div className="appt-info"><strong>{appt.type || "Consultation"}</strong><p>Dr. {appt.vet?.firstName} {appt.vet?.lastName}</p><p>{appt.notes || "—"}</p></div>
                      <span className={`status-badge ${appt.status?.toLowerCase() || "pending"}`}>{appt.status || "Scheduled"}</span>
                    </div>
                  ))
                  : <div className="empty-state">No upcoming appointments.</div>}
              </div>
              <div className="appt-section">
                <h3>Past Appointments</h3>
                {caseData.appointments?.filter((a) => new Date(a.date) < new Date()).length > 0
                  ? caseData.appointments.filter((a) => new Date(a.date) < new Date()).map((appt, i) => (
                    <div key={i} className="appt-card appt-past">
                      <div className="appt-date-block appt-date-past"><span className="appt-day">{new Date(appt.date).getDate()}</span><span className="appt-month">{new Date(appt.date).toLocaleString("default", { month: "short" })}</span></div>
                      <div className="appt-info"><strong>{appt.type || "Consultation"}</strong><p>Dr. {appt.vet?.firstName} {appt.vet?.lastName}</p><p>{appt.notes || "—"}</p></div>
                      <span className={`status-badge ${appt.status?.toLowerCase() || "completed"}`}>{appt.status || "Completed"}</span>
                    </div>
                  ))
                  : <div className="empty-state">No past appointments.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ Historic Profile ══ */}
        {activeTab === "historicprofile" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">

              <h2>📂 Historic Profile</h2>
            </div>
            <div className="general-info-container">
              <div className="info-card">
                <h3>⚖️ Weight History</h3>
                {caseData.symptoms?.filter((s) => s.weight).length > 0 ? (
                  <div className="weight-history">
                    {caseData.symptoms.filter((s) => s.weight).map((s, i) => (
                      <div key={i} className="weight-row">
                        <span className="weight-date">{new Date(s.recordedAt).toLocaleDateString()}</span>
                        <div className="weight-bar-wrap"><div className="weight-bar" style={{ width: `${Math.min((s.weight / 50) * 100, 100)}%` }}></div></div>
                        <span className="weight-val">{s.weight} kg</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">No weight data recorded.</div>}
              </div>
              <div className="info-card">
                <h3>💉 Vaccination Timeline</h3>
                {caseData.vaccinations?.length > 0 ? (
                  <div className="vac-timeline">
                    {caseData.vaccinations.map((v, i) => (
                      <div key={i} className="vac-row">
                        <div className="vac-dot"></div>
                        <div className="vac-info"><strong>{v.vaccineName}</strong><span>{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : "Not yet administered"}</span>{v.nextDueDate && <span className="vac-next">Next: {new Date(v.nextDueDate).toLocaleDateString()}</span>}</div>
                        {v.batchNumber && <span className="vac-batch">Batch: {v.batchNumber}</span>}
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">No vaccinations recorded.</div>}
              </div>
              <div className="info-card">
                <h3>🏥 Diagnosis Summary</h3>
                {caseData.diagnoses?.length > 0 ? (
                  <div className="diag-summary">
                    {caseData.diagnoses.map((d, i) => (
                      <div key={i} className="diag-summary-row">
                        <span className="diag-date">{new Date(d.diagnosedAt).toLocaleDateString()}</span>
                        <div className="diag-body"><strong>{d.diagnosis}</strong>
                          {d.medications?.length > 0 && <div className="medications-list" style={{ marginTop: 6 }}>{d.medications.map((m, j) => <div key={j} className="medication-item">{m.medicineName} — {m.dosage}, {m.frequency}</div>)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">No diagnoses recorded.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ Communication ══ */}
        {activeTab === "communication" && (
          <div className="tab-panel centered-panel">
            <div className="tab-hero">
              <h2>💬 Communication</h2>
            </div>
            <div className="comm-container">
              <div className="info-card">
                <h3>👤 Owner Contact</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Name</label><p>{caseData.pet?.owner?.firstName} {caseData.pet?.owner?.lastName || "N/A"}</p></div>
                  <div className="info-item"><label>Phone</label><p>{caseData.pet?.owner?.phoneNumber || "N/A"}</p></div>
                  <div className="info-item"><label>Email</label><p>{caseData.pet?.owner?.email || "N/A"}</p></div>
                </div>
                <div className="comm-actions">
                  <a href={`tel:${caseData.pet?.owner?.phoneNumber}`} className="comm-btn comm-btn-call">📞 Call Owner</a>
                  <a href={`mailto:${caseData.pet?.owner?.email}`} className="comm-btn comm-btn-email">✉️ Send Email</a>
                  <a href={`https://wa.me/${caseData.pet?.owner?.phoneNumber?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="comm-btn comm-btn-whatsapp">💬 WhatsApp</a>
                </div>
              </div>
              <div className="info-card">
                <h3>📝 Notes for Owner</h3>
                <div className="case-form" style={{ marginBottom: 0 }}>
                  <div className="form-group full-width"><label>Message / Instructions</label><textarea rows={4} placeholder="Write care instructions, follow-up notes, or reminders for the pet owner..." /></div>
                  <button type="button" className="submit-btn" style={{ marginTop: 12 }}>Send Note</button>
                </div>
              </div>
              <div className="info-card">
                <h3>🗂️ Communication Log</h3>
                {caseData.communications?.length > 0
                  ? caseData.communications.map((c, i) => (
                    <div key={i} className="comm-log-item">
                      <div className="comm-log-header"><strong>{c.type}</strong><span className="comm-log-date">{new Date(c.date).toLocaleString()}</span></div>
                      <p>{c.message}</p>
                    </div>
                  ))
                  : <div className="empty-state">No communication history yet.</div>}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Report Viewer Modal */}
      {reportModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            width: "90%",
            height: "90%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>{reportModal.title}</h2>
              <button
                onClick={closeReportModal}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "16px"
            }}>
              <iframe
                src={reportModal.url}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "4px"
                }}
                title="Report Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetCaseDetail;
