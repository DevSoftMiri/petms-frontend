import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import Dropdown from "react-bootstrap/Dropdown";
import HttpService from "../../services/HttpService";
import VetDashboardNav from "./VetDashboardNav";
import "./VetDashboard.css";

const getResponseDataArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

// Filter cases: exclude closed cases and cases for admitted pets
const getOpenCases = (caseItems) => (
  caseItems.filter((caseItem) => {
    if (caseItem.status === "CLOSED") return false;
    if (caseItem.pet?.status === "ADMITTED") return false;
    return true;
  })
);

const VetDashboard = ({ clinicId: propClinicId }) => {
  const { clinicId: paramClinicId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const clinicId = propClinicId || paramClinicId;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cases, setCases] = useState([]);
  const [closedCases, setClosedCases] = useState([]);
  const [inpatientPets, setInpatientPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [activeView, setActiveView] = useState("assigned");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const getVetApiPath = useCallback((endpoint) => {
    if (clinicId) return `/clinics/${clinicId}/vet${endpoint}`;
    return `/vet${endpoint}`;
  }, [clinicId]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, petsRes, todayRes, casesRes, inpatientRes, closedRes] = await Promise.allSettled([
        HttpService.getWithAuth(getVetApiPath("/dashboard/stats")),
        HttpService.getWithAuth(getVetApiPath("/pets")),
        HttpService.getWithAuth(getVetApiPath("/appointments/today")),
        HttpService.getWithAuth(getVetApiPath("/cases")),
        HttpService.getWithAuth(getVetApiPath("/inpatient-pets")).catch(() => ({ data: [] })),
        HttpService.getWithAuth(getVetApiPath("/cases?status=CLOSED")).catch(() => ({ data: [] })),
      ]);

      const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
      const petsData = petsRes.status === "fulfilled" ? petsRes.value : null;
      const todayData = todayRes.status === "fulfilled" ? todayRes.value : null;
      const casesData = casesRes.status === "fulfilled" ? casesRes.value : null;
      const inpatientData = inpatientRes.status === "fulfilled" ? inpatientRes.value : null;
      const closedData = closedRes.status === "fulfilled" ? closedRes.value : null;

      setStats(stats?.data || stats || null);
      setPets(getResponseDataArray(petsData));
      setAppointments(getResponseDataArray(todayData));
      setCases(getOpenCases(getResponseDataArray(casesData)));
      setInpatientPets(getResponseDataArray(inpatientData));
      setClosedCases(getResponseDataArray(closedData));
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [clinicId, getVetApiPath]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown]);



  const fetchVets = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await HttpService.getWithAuth(`/users?clinicId=${clinicId}&role=VET`);
      setVets(res.data || []);
    } catch (error) {
      console.error("Error fetching vets:", error);
    }
  }, [clinicId]);

  const handleOpenAssignModal = (pet) => {
    if (!pet || !pet.id) {
      enqueueSnackbar("Unable to assign: Pet information incomplete", { variant: "error" });
      return;
    }
    setSelectedPet(pet);
    setShowAssignModal(true);
    fetchVets();
  };

  const handleAssignVet = async (vetId) => {
    if (!selectedPet || !vetId) {
      enqueueSnackbar("Please select a veterinarian", { variant: "error" });
      return;
    }
    if (!selectedPet.id) {
      enqueueSnackbar("Pet ID is missing. Please try again.", { variant: "error" });
      return;
    }
    setAssigning(true);
    try {
      const response = await HttpService.putWithAuth(`/clinics/${clinicId}/pets/${selectedPet.id}/assign-vet`, { vetId });
      console.log("Assignment response:", response);
      enqueueSnackbar("✅ Pet assigned to vet successfully", { variant: "success" });
      setShowAssignModal(false);
      setSelectedPet(null);
      // Refresh after a small delay to ensure backend state is updated
      setTimeout(() => fetchDashboardData(), 500);
    } catch (error) {
      console.error("Error assigning pet:", error.response?.data || error.message);
      enqueueSnackbar(error.response?.data?.message || "Failed to assign pet", { variant: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const handleSearch = async (term) => {
    try {
      const res = await HttpService.getWithAuth(getVetApiPath(`/pets?search=${term}`));
      setPets(getResponseDataArray(res));
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleStatusFilter = async (status) => {
    try {
      const res = await HttpService.getWithAuth(getVetApiPath(`/cases?status=${status}`));
      setCases(getOpenCases(getResponseDataArray(res)));
    } catch (error) {
      console.error("Filter error:", error);
    }
  };

  const handleViewCase = (caseId, options = {}) => {
    if (clinicId) localStorage.setItem("selectedClinicId", clinicId);
    navigate(`/vet/case/${caseId}${options.historyOnly ? "?view=history" : ""}`);
  };

  const handleMoveToInpatient = async (caseItem) => {
    try {
      const petId = caseItem.petId || caseItem.pet?.id;
      await HttpService.putWithAuth(
        `/clinics/${clinicId}/vet/pets/${petId}/admission`,
        { caseId: caseItem.id, admissionDate: new Date().toISOString() }
      );
      enqueueSnackbar(
        `🏥 ${caseItem.pet?.name || "Pet"} moved to inpatient! Now appears in 'Inpatient Pets' section.`,
        { variant: "success", autoHideDuration: 5000 }
      );
      fetchDashboardData();
    } catch (error) {
      console.error("Error moving to inpatient:", error);
      enqueueSnackbar("Failed to move pet to inpatient", { variant: "error" });
    }
  };

  const handleCloseCase = async (caseItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to close the case for ${caseItem.pet?.name || "this pet"}?`
    );
    if (!confirmed) return;
    try {
      await HttpService.putWithAuth(
        `/clinics/${clinicId}/vet/cases/${caseItem.id}/status`,
        { status: "CLOSED", closedAt: new Date().toISOString() }
      );
      enqueueSnackbar(
        `✅ Case for ${caseItem.pet?.name || "the pet"} closed! Now appears in 'Closed Case Pets' section.`,
        { variant: "success", autoHideDuration: 5000 }
      );
      fetchDashboardData();
    } catch (error) {
      console.error("Error closing case:", error);
      enqueueSnackbar("Failed to close case", { variant: "error" });
    }
  };

  const handleViewPet = (petId, appointmentId = null) => {
    if (clinicId) localStorage.setItem("selectedClinicId", clinicId);
    if (appointmentId) {
      navigate(`/vet/pet/${petId}/appointment/${appointmentId}`);
    } else {
      navigate(`/vet/pet/${petId}/details`);
    }
  };

  const handleCreateCase = async (pet) => {
    try {
      const res = await HttpService.postWithAuth(getVetApiPath("/cases"), {
        petId: pet.id,
        caseDate: new Date().toISOString(),
        status: "ACTIVE",
      });
      const newCase = res.data || res;
      enqueueSnackbar(`✅ Case created for ${pet.name}! Moved to My Cases.`, {
        variant: "success",
        autoHideDuration: 4000,
      });
      await fetchDashboardData();
      setActiveView("cases");
      if (newCase?.id) {
        if (clinicId) localStorage.setItem("selectedClinicId", clinicId);
        navigate(`/vet/case/${newCase.id}`);
      }
    } catch (error) {
      console.error("Error creating case:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Failed to create case",
        { variant: "error" }
      );
    }
  };

  if (loading) {
    return (
      <div className="vet-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Vet Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vet-dashboard-container">
      <div className="vet-header">
        <h1>🐾 Vet Dashboard</h1>
        <p>Welcome to your veterinary workspace</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e0f2fe" }}>
            <span style={{ color: "#0284c7" }}>🐶</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Assigned Pets</span>
            <span className="stat-value">{stats?.totalPets || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f0fdf4" }}>
            <span style={{ color: "#16a34a" }}>📅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Appointments</span>
            <span className="stat-value">{stats?.todayAppointments || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7" }}>
            <span style={{ color: "#d97706" }}>🏥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Cases</span>
            <span className="stat-value">{stats?.activeCases || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fce7f3" }}>
            <span style={{ color: "#db2777" }}>✅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Cases</span>
            <span className="stat-value">{stats?.completedCases || 0}</span>
          </div>
        </div>
      </div>

      {/* Dropdown Navigation */}
      <VetDashboardNav
        activeView={activeView}
        onViewChange={setActiveView}
        counts={{
          assigned: pets.length,
          cases: cases.length,
          inpatient: inpatientPets.length,
          closed: closedCases.length,
        }}
      />

      {/* ── ASSIGNED PETS ── */}
      {activeView === "assigned" && (
        <div className="view-content">
          <h2>🐾 Assigned Pets</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by pet name, ID, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            />
            <button onClick={() => handleSearch(searchTerm)}>Search</button>
          </div>

          {pets.length === 0 ? (
            <div className="empty-state"><p>No pets assigned to you</p></div>
          ) : (
            <div className="assigned-pets-table">
              <div className="assigned-pets-header assigned-pets-row">
                <span>Pet</span>
                <span>Pet ID</span>
                <span>DOB</span>
                <span>Species / Breed</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {pets.map((pet) => (
                <div key={pet.id} className="assigned-pets-row">
                  <div className="assigned-pet-name">
                    <span className="assigned-pet-avatar">
                      {pet.species === "Dog" ? "Dog" : pet.species === "Cat" ? "Cat" : "Pet"}
                    </span>
                    <strong>{pet.name}</strong>
                  </div>
                  <span>{pet.petId || "-"}</span>
                  <span>{pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : "-"}</span>
                  <span>{pet.species || "Pet"} / {pet.breed || "Breed not set"}</span>
                  <span>{pet.owner?.firstName} {pet.owner?.lastName}</span>
                  <div className="assigned-pet-badges">
                    {pet.assignedVetId && (
                      <span className="appointment-badge" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                        Assigned
                      </span>
                    )}
                    {pet.appointments?.length > 0 && (
                      <span className="appointment-badge">
                        {pet.appointments.length} appt.
                      </span>
                    )}
                  </div>
                  <div className="assigned-pet-actions">
                    <button className="assign-btn" onClick={() => handleOpenAssignModal(pet)}>
                      {pet.assignedVetId ? "Reassign" : "Assign"}
                    </button>
                    <button className="create-case-btn" onClick={() => handleCreateCase(pet)}>
                      + Create Case
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY CASES ── */}
      {activeView === "cases" && (
        <div className="view-content">
          <h2>📋 My Cases</h2>
          <div className="filter-bar">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleStatusFilter(e.target.value);
              }}
            >
              <option value="">All Open Cases</option>
              <option value="ACTIVE">Active</option>
              <option value="FOLLOW_UP">Follow Up</option>
            </select>
          </div>

          {cases.length === 0 ? (
            <div className="empty-state"><p>No cases found</p></div>
          ) : (
            <div className="cases-table">
              <div className="cases-table-header cases-table-row">
                <span>Client ID</span>
                <span>Medical Record #</span>
                <span>Pet</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Case Date</span>
                <span>Records</span>
                <span>Actions</span>
              </div>
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="cases-table-row">
                  <span className="client-id">{caseItem.pet?.owner?.customerId || "N/A"}</span>
                  <span className="medical-record-number">{caseItem.medicalRecordNumber || "N/A"}</span>
                  <div className="case-pet-info">
                    <span className="case-avatar">
                      {caseItem.pet?.species === "Dog" ? "🐕" : caseItem.pet?.species === "Cat" ? "🐱" : "🐾"}
                    </span>
                    <strong>{caseItem.pet?.name}</strong>
                  </div>
                  <span>{caseItem.pet?.owner?.firstName} {caseItem.pet?.owner?.lastName}</span>
                  <span>
                    <span className={`status-badge ${caseItem.status?.toLowerCase()}`}>
                      {caseItem.status}
                    </span>
                  </span>
                  <span>{new Date(caseItem.caseDate).toLocaleDateString()}</span>
                  <span className="case-records">
                    <span className="record-count">{caseItem._count?.symptoms || 0}S</span>
                    <span className="record-count">{caseItem._count?.diagnoses || 0}D</span>
                  </span>

                  {/* ── React Bootstrap Actions Dropdown ── */}
                  {/* ── Custom Three-Dot Actions Dropdown ── */}
                  <div className="case-actions-group" style={{ position: "relative" }}>
                    <button
                      className="three-dot-btn"
                      onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === caseItem.id ? null : caseItem.id); }}
                      aria-label="Case actions"
                    >
                      <span></span>
                      <span></span>
                      <span></span>
                    </button>

                    {openDropdown === caseItem.id && (
                      <div className="three-dot-menu">
                        <button
                          className="three-dot-item view-item"
                          onClick={() => { handleViewCase(caseItem.id); setOpenDropdown(null); }}
                        >
                          📋 View Case
                        </button>
                        <button
                          className="three-dot-item inpatient-item"
                          onClick={() => { handleMoveToInpatient(caseItem); setOpenDropdown(null); }}
                        >
                          🏥 Move to Inpatient
                        </button>
                        <div className="three-dot-divider" />
                        <button
                          className="three-dot-item close-item"
                          onClick={() => { handleCloseCase(caseItem); setOpenDropdown(null); }}
                        >
                          🔒 Close Case
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INPATIENT PETS — Table Row Layout ── */}
      {activeView === "inpatient" && (
        <div className="view-content">
          <h2>🏥 Inpatient Pets</h2>

          {inpatientPets.length === 0 ? (
            <div className="empty-state"><p>No inpatient pets currently</p></div>
          ) : (
            <div className="inpatient-table">
              {/* Header */}
              <div className="inpatient-row inpatient-header">
                <span>Pet</span>
                <span>Species / Breed</span>
                <span>Owner</span>
                <span>Admitted</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {/* Rows */}
              {inpatientPets.map((pet) => (
                <div key={pet.id} className="inpatient-row">
                  {/* Pet name + avatar */}
                  <div className="inpatient-pet-name">
                    <span className="inpatient-avatar">
                      {pet.species === "Dog" ? "🐕" : pet.species === "Cat" ? "🐱" : "🐾"}
                    </span>
                    <strong>{pet.name}</strong>
                  </div>
                  {/* Species / Breed */}
                  <span>{pet.species || "—"} / {pet.breed || "—"}</span>
                  {/* Owner */}
                  <span>{pet.owner?.firstName} {pet.owner?.lastName}</span>
                  {/* Admission date */}
                  <span>
                    {pet.admissionDate
                      ? new Date(pet.admissionDate).toLocaleDateString()
                      : "—"}
                  </span>
                  {/* Badge */}
                  <span>
                    <span className="appointment-badge" style={{ background: "#fef3c7", color: "#d97706" }}>
                      🏥 Inpatient
                    </span>
                  </span>
                  {/* Action */}
                  <div className="inpatient-actions">
                    <button className="view-btn" onClick={() => handleViewPet(pet.id)}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CLOSED CASES ── */}
      {activeView === "closed" && (
        <div className="view-content">
          <h2>✅ Closed Case Pets</h2>

          {closedCases.length === 0 ? (
            <div className="empty-state"><p>No pets with closed cases yet</p></div>
          ) : (
            <div className="closed-cases-table">
              <div className="closed-cases-header closed-cases-row">
                <span>Pet</span>
                <span>Case</span>
                <span>Owner</span>
                <span>Case Date</span>
                <span>Closed Date</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {closedCases.map((caseItem) => (
                <div key={caseItem.id} className="closed-cases-row">
                  <div className="closed-case-pet">
                    <span className="closed-case-avatar">
                      {caseItem.pet?.species === "Dog" ? "Dog" : caseItem.pet?.species === "Cat" ? "Cat" : "Pet"}
                    </span>
                    <div>
                      <strong>{caseItem.pet?.name || "Unnamed Pet"}</strong>
                      <span>{caseItem.pet?.species || "Pet"} / {caseItem.pet?.breed || "Breed not set"}</span>
                    </div>
                  </div>
                  <span>{caseItem.caseNumber || "-"}</span>
                  <span>
                    {caseItem.pet?.owner
                      ? `${caseItem.pet.owner.firstName || ""} ${caseItem.pet.owner.lastName || ""}`.trim()
                      : "Owner Unknown"}
                  </span>
                  <span>{caseItem.caseDate ? new Date(caseItem.caseDate).toLocaleDateString() : "Not set"}</span>
                  <span>{caseItem.closedAt ? new Date(caseItem.closedAt).toLocaleDateString() : "Not set"}</span>
                  <span className={`status-badge ${caseItem.status?.toLowerCase()}`}>
                    {caseItem.status}
                  </span>
                  <div className="closed-case-actions">
                    <button className="view-btn" onClick={() => handleViewCase(caseItem.id, { historyOnly: true })}>
                      View History
                    </button>
                    {caseItem.pet?.id && (
                      <button className="assign-btn" onClick={() => handleOpenAssignModal(caseItem.pet)}>
                        Reassign
                      </button>
                    )}
                    {caseItem.pet?.id && (
                      <button className="view-btn secondary" onClick={() => handleViewPet(caseItem.pet.id)}>
                        View Pet
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TODAY'S SCHEDULE ── */}
      <div className="todays-schedule-section">
        <h2>📅 Today's Schedule</h2>
        {appointments.length === 0 ? (
          <div className="empty-state"><p>No appointments scheduled for today</p></div>
        ) : (
          <div className="appointments-list">
            {appointments.map((apt) => (
              <div key={apt.id} className="appointment-card">
                <div className="appointment-time">
                  {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="appointment-details">
                  <h3>{apt.pet?.name}</h3>
                  <p className="pet-info">{apt.pet?.species} • {apt.pet?.breed}</p>
                  <p className="owner-info">Owner: {apt.pet?.owner?.firstName} {apt.pet?.owner?.lastName}</p>
                  <p className="reason">Reason: {apt.reason || "Not specified"}</p>
                </div>
                <div className="appointment-actions">
                  <span className={`status-badge ${apt.status?.toLowerCase()}`}>{apt.status}</span>
                  <button className="view-btn" onClick={() => handleViewPet(apt.petId, apt.id)}>
                    Start Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ASSIGN VET MODAL ── */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Pet to Vet</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "15px" }}>
                Select a veterinarian to assign <strong>{selectedPet?.name}</strong>:
              </p>
              <div className="vet-list">
                {vets.length === 0 ? (
                  <p>No vets available in this clinic</p>
                ) : (
                  vets.map((vet) => (
                    <button
                      key={vet.id}
                      className="vet-option-btn"
                      onClick={() => handleAssignVet(vet.id)}
                      disabled={assigning}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        marginBottom: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        background: "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Dr. {vet.firstName} {vet.lastName} ({vet.email})
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetDashboard;
