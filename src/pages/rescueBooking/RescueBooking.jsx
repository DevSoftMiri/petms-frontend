import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./rescueBooking.css";

const PUBLIC_CENTER_FALLBACK = [
  {
    id: "cmpdou218001d7whln8lm3upd",
    clinicName: "Downtown Veterinary Clinic",
    clinicCode: "CLI001",
    email: "downtown@petvms.com",
    phoneNumber: "+1-555-001-0001",
    address: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    country: "USA",
    isActive: true,
  },
  {
    id: "cmpdou21o001e7whl0six8yux",
    clinicName: "Uptown Pet Care Center",
    clinicCode: "CLI002",
    email: "uptown@petvms.com",
    phoneNumber: "+1-555-002-0002",
    address: "456 Oak Avenue",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    country: "USA",
    isActive: true,
  },
];

const defaultFormValues = {
  rescuerName: "",
  rescuerPhone: "",
  rescuerEmail: "",
  petName: "",
  species: "",
  breed: "",
  gender: "Unknown",
  urgency: "Urgent",
  animalCondition: "Injured",
  transportMode: "Car",
  rescueNotes: "",
  appointmentDate: "",
  appointmentTime: "",
  selectedCenterId: "",
};

const buildLocationText = (clinic) => {
  const locationParts = [
    clinic?.address,
    clinic?.city,
    clinic?.state,
    clinic?.zipCode,
    clinic?.country,
  ].filter(Boolean);

  return locationParts.length ? locationParts.join(", ") : "Location details unavailable";
};

const createClinicCandidate = (clinic) => {
  if (!clinic?.id) return null;

  return {
    id: clinic.id,
    clinicName: clinic.clinicName || "Center",
    clinicCode: clinic.clinicCode || "",
    email: clinic.email || "",
    phoneNumber: clinic.phoneNumber || "",
    address: clinic.address || "",
    city: clinic.city || "",
    state: clinic.state || "",
    zipCode: clinic.zipCode || "",
    country: clinic.country || "",
    isActive: clinic.isActive !== false,
    locationText: buildLocationText(clinic),
  };
};

const formatSummaryDateTime = (date, time) => {
  if (!date || !time) return "Not selected";

  const combined = new Date(`${date}T${time}`);
  if (Number.isNaN(combined.getTime())) {
    return `${date} ${time}`;
  }

  return combined.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getUrgencyTone = (urgency) => {
  switch (urgency) {
    case "Critical":
      return "critical";
    case "Urgent":
      return "urgent";
    case "Same Day":
      return "same-day";
    default:
      return "routine";
  }
};

const RescueBooking = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centerError, setCenterError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const user = useMemo(() => AuthService.getCurrentUser(), []);
  const selectedClinicId = useMemo(() => localStorage.getItem("selectedClinicId"), []);
  const storedSelectedClinic = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedClinic") || "null");
    } catch (error) {
      return null;
    }
  }, []);
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    let isMounted = true;

    const loadCenters = async () => {
      setLoadingCenters(true);
      setCenterError("");

      const accessibleClinics = Array.isArray(user?.clinics) ? user.clinics : [];
      const clinicCandidates = [
        ...PUBLIC_CENTER_FALLBACK,
        ...accessibleClinics,
        createClinicCandidate(storedSelectedClinic),
        createClinicCandidate({
          id: selectedClinicId,
          clinicName: storedSelectedClinic?.clinicName || "Current Center",
          clinicCode: storedSelectedClinic?.clinicCode || "",
          address: storedSelectedClinic?.address || "",
          city: storedSelectedClinic?.city || "",
          state: storedSelectedClinic?.state || "",
          zipCode: storedSelectedClinic?.zipCode || "",
          country: storedSelectedClinic?.country || "",
          phoneNumber: storedSelectedClinic?.phoneNumber || "",
          email: storedSelectedClinic?.email || "",
        }),
        createClinicCandidate({
          id: user?.clinicId,
          clinicName: "Assigned Center",
        }),
      ].filter(Boolean);

      const uniqueClinics = clinicCandidates.filter(
        (clinic, index, allClinics) =>
          clinic?.id && allClinics.findIndex((item) => item.id === clinic.id) === index
      );

      if (uniqueClinics.length === 0) {
        if (!isMounted) return;
        setCenters([]);
        setCenterError("No centers are available right now.");
        setLoadingCenters(false);
        return;
      }

      if (isMounted) {
        setCenters(uniqueClinics.filter((clinic) => clinic.isActive !== false));
      }

      if (!user) {
        if (!isMounted) return;
        setLoadingCenters(false);
        return;
      }

      const centerResults = await Promise.allSettled(
        uniqueClinics.map(async (clinic) => {
          try {
            const response = await HttpService.getWithAuth(`/clinics/${clinic.id}`);
            const clinicData = response.data || response;

            return {
              id: clinicData.id || clinic.id,
              clinicName: clinicData.clinicName || clinic.clinicName || "Center",
              clinicCode: clinicData.clinicCode || clinic.clinicCode || "",
              email: clinicData.email || clinic.email || "",
              phoneNumber: clinicData.phoneNumber || clinic.phoneNumber || "",
              address: clinicData.address || clinic.address || "",
              city: clinicData.city || clinic.city || "",
              state: clinicData.state || clinic.state || "",
              zipCode: clinicData.zipCode || clinic.zipCode || "",
              country: clinicData.country || clinic.country || "",
              isActive: clinicData.isActive !== false,
              locationText: buildLocationText(clinicData),
            };
          } catch (error) {
            return {
              ...clinic,
              locationText: clinic.locationText || "Location details unavailable",
            };
          }
        })
      );

      if (!isMounted) return;

      const normalizedCenters = centerResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((center) => center.isActive !== false);

      setCenters(normalizedCenters);
      setLoadingCenters(false);

      if (normalizedCenters.length === 0) {
        setCenterError("No active centers are available right now.");
      }
    };

    loadCenters();

    return () => {
      isMounted = false;
    };
  }, [selectedClinicId, storedSelectedClinic, user]);

  useEffect(() => {
    if (centers.length === 1 && !formValues.selectedCenterId) {
      setFormValues((prev) => ({
        ...prev,
        selectedCenterId: centers[0].id,
      }));
    }
  }, [centers, formValues.selectedCenterId]);

  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === formValues.selectedCenterId) || null,
    [centers, formValues.selectedCenterId]
  );

  const completionPercent = useMemo(() => {
    const requiredFields = [
      formValues.rescuerName,
      formValues.petName,
      formValues.species,
      formValues.appointmentDate,
      formValues.appointmentTime,
      formValues.selectedCenterId,
    ];
    const completed = requiredFields.filter((value) => String(value || "").trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [
    formValues.appointmentDate,
    formValues.appointmentTime,
    formValues.petName,
    formValues.rescuerName,
    formValues.selectedCenterId,
    formValues.species,
  ]);

  const statusTone = useMemo(
    () => getUrgencyTone(formValues.urgency),
    [formValues.urgency]
  );

  const selectedCenterMeta = useMemo(() => {
    if (!selectedCenter) {
      return {
        headline: "Choose a center to lock the treatment destination.",
        detail: "You can use either the dropdown in the form or the center cards below.",
      };
    }

    return {
      headline: selectedCenter.clinicName,
      detail: selectedCenter.phoneNumber || selectedCenter.email || selectedCenter.locationText,
    };
  }, [selectedCenter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCenterSelect = (centerId) => {
    setFormValues((prev) => ({
      ...prev,
      selectedCenterId: centerId,
    }));
  };

  const getValidationMessage = () => {
    if (!formValues.rescuerName.trim()) return "Rescuer name is required.";
    if (!formValues.rescuerPhone.trim() && !formValues.rescuerEmail.trim()) {
      return "Add at least a phone number or an email address.";
    }
    if (!formValues.petName.trim()) return "Pet name or identifying label is required.";
    if (!formValues.species.trim()) return "Please choose the animal type.";
    if (!formValues.appointmentDate) return "Preferred appointment date is required.";
    if (!formValues.appointmentTime) return "Preferred appointment time is required.";
    if (!formValues.selectedCenterId) return "Please choose a center.";
    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationMessage = getValidationMessage();
    if (validationMessage) {
      enqueueSnackbar(validationMessage, { variant: "warning" });
      return;
    }

    const nextConfirmation = {
      rescuerName: formValues.rescuerName.trim(),
      petName: formValues.petName.trim(),
      species: formValues.species,
      urgency: formValues.urgency,
      animalCondition: formValues.animalCondition,
      transportMode: formValues.transportMode,
      centerName: selectedCenter?.clinicName || "Selected center",
      locationText: selectedCenter?.locationText || "Location details unavailable",
      appointmentDateTime: formatSummaryDateTime(
        formValues.appointmentDate,
        formValues.appointmentTime
      ),
    };

    setConfirmation(nextConfirmation);
    enqueueSnackbar("Preview prepared. This page still does not submit live records.", {
      variant: "info",
    });
  };

  return (
    <div className="rescue-booking-page">
      <section className="rescue-booking-hero">
        <div className="rescue-booking-hero-art"></div>
        <div className="rescue-booking-hero-shell">
          <div className="rescue-booking-hero-copy">
            <span className="rescue-booking-kicker">Public Rescue Intake</span>
            <div className="rescue-booking-meta-row">
              <span>NGO ready</span>
              <span>Public access</span>
              <span>{centers.length} centers available</span>
            </div>
            <h1>Guide a rescued animal to care with a cleaner, faster handoff.</h1>
            <p>
              This public page helps rescuers share the essential details before reaching
              a treatment center. It is designed to feel clear under pressure and present
              information in a professional intake format.
            </p>

            <div className="rescue-booking-highlight-grid">
              <div className="rescue-booking-highlight-card">
                <strong>{completionPercent}%</strong>
                <span>intake completeness</span>
              </div>
              <div className="rescue-booking-highlight-card">
                <strong>{formValues.urgency}</strong>
                <span>triage priority</span>
              </div>
              <div className="rescue-booking-highlight-card">
                <strong>{selectedCenter ? selectedCenter.clinicName : "Select center"}</strong>
                <span>treatment destination</span>
              </div>
            </div>
          </div>

          <div className="rescue-booking-form-wrap">
            <div className="rescue-booking-form-header">
              <div>
                <h2>Rescue Intake Form</h2>
                <p>Capture the essentials for the receiving team.</p>
              </div>
              <div className="rescue-booking-progress-chip">{completionPercent}% ready</div>
            </div>

            <form className="rescue-booking-form" onSubmit={handleSubmit}>
              <div className="rescue-booking-form-grid">
                <label className="rescue-booking-field rescue-booking-field-wide">
                  <span>Rescuer / Finder Name *</span>
                  <input
                    type="text"
                    name="rescuerName"
                    value={formValues.rescuerName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Phone Number</span>
                  <input
                    type="text"
                    name="rescuerPhone"
                    value={formValues.rescuerPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    name="rescuerEmail"
                    value={formValues.rescuerEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Animal Name / Label *</span>
                  <input
                    type="text"
                    name="petName"
                    value={formValues.petName}
                    onChange={handleInputChange}
                    placeholder="Temporary identifier or common name"
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Species *</span>
                  <select
                    name="species"
                    value={formValues.species}
                    onChange={handleInputChange}
                  >
                    <option value="">Select species</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="rescue-booking-field">
                  <span>Breed</span>
                  <input
                    type="text"
                    name="breed"
                    value={formValues.breed}
                    onChange={handleInputChange}
                    placeholder="If known"
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Gender</span>
                  <select
                    name="gender"
                    value={formValues.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </label>

                <label className="rescue-booking-field">
                  <span>Urgency Level</span>
                  <select
                    name="urgency"
                    value={formValues.urgency}
                    onChange={handleInputChange}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Same Day">Same Day</option>
                    <option value="Routine">Routine</option>
                  </select>
                </label>

                <label className="rescue-booking-field">
                  <span>Animal Condition</span>
                  <select
                    name="animalCondition"
                    value={formValues.animalCondition}
                    onChange={handleInputChange}
                  >
                    <option value="Injured">Injured</option>
                    <option value="Weak or dehydrated">Weak or dehydrated</option>
                    <option value="Accident case">Accident case</option>
                    <option value="Unable to walk">Unable to walk</option>
                    <option value="Stable but needs checkup">Stable but needs checkup</option>
                  </select>
                </label>

                <label className="rescue-booking-field">
                  <span>Transport Mode</span>
                  <select
                    name="transportMode"
                    value={formValues.transportMode}
                    onChange={handleInputChange}
                  >
                    <option value="Car">Car</option>
                    <option value="Auto / Taxi">Auto / Taxi</option>
                    <option value="Ambulance">Ambulance</option>
                    <option value="On foot nearby">On foot nearby</option>
                    <option value="NGO rescue van">NGO rescue van</option>
                  </select>
                </label>

                <label className="rescue-booking-field">
                  <span>Preferred Date *</span>
                  <input
                    type="date"
                    name="appointmentDate"
                    min={todayDate}
                    value={formValues.appointmentDate}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="rescue-booking-field">
                  <span>Preferred Time *</span>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={formValues.appointmentTime}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="rescue-booking-field rescue-booking-field-wide">
                  <span>Choose Center *</span>
                  <select
                    name="selectedCenterId"
                    value={formValues.selectedCenterId}
                    onChange={handleInputChange}
                    disabled={centers.length === 0}
                  >
                    <option value="">
                      {loadingCenters && centers.length === 0
                        ? "Loading centers..."
                        : "Select a center"}
                    </option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.clinicName} - {center.locationText}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rescue-booking-field rescue-booking-field-wide">
                  <span>Current Triage Tags</span>
                  <div className="rescue-booking-chip-row">
                    <span className={`rescue-booking-chip ${statusTone}`}>
                      {formValues.urgency}
                    </span>
                    <span className="rescue-booking-chip neutral">
                      {formValues.animalCondition}
                    </span>
                    <span className="rescue-booking-chip neutral">
                      {formValues.transportMode}
                    </span>
                  </div>
                </div>

                <div className="rescue-booking-center-brief rescue-booking-field-wide">
                  <strong>{selectedCenterMeta.headline}</strong>
                  <p>{selectedCenterMeta.detail}</p>
                </div>

                <label className="rescue-booking-field rescue-booking-field-wide">
                  <span>Rescue Notes</span>
                  <textarea
                    name="rescueNotes"
                    rows="5"
                    value={formValues.rescueNotes}
                    onChange={handleInputChange}
                    placeholder="Describe visible injuries, rescue location, behavior, bleeding, mobility, or anything the center should know before arrival."
                  />
                </label>
              </div>

              <div className="rescue-booking-form-footer">
                <div className="rescue-booking-preview-note">
                  <strong>Preview only</strong>
                  <span>This page does not create a live record yet.</span>
                </div>
                <button type="submit" className="rescue-booking-primary-btn">
                  Preview Intake Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="rescue-booking-centers-section">
        <div className="rescue-booking-shell">
          <div className="rescue-booking-section-head">
            <span className="rescue-booking-section-label">Treatment Centers</span>
            <h2>Choose the hospital that should receive the rescued animal.</h2>
            <p>
              These cards mirror the center dropdown above, while giving rescuers a more
              visual and professional way to compare location and contact details.
            </p>
          </div>

          <div className="rescue-booking-guidance-grid">
            <div className="rescue-booking-guidance-card">
              <strong>Stabilize first</strong>
              <span>Keep the animal warm, reduce movement, and avoid force-feeding.</span>
            </div>
            <div className="rescue-booking-guidance-card">
              <strong>Share condition clearly</strong>
              <span>Use urgency, transport mode, and rescue notes to reduce intake delay.</span>
            </div>
            <div className="rescue-booking-guidance-card">
              <strong>Confirm destination</strong>
              <span>Make sure the selected center matches where the animal will be taken.</span>
            </div>
          </div>

          {loadingCenters && centers.length === 0 ? (
            <div className="rescue-booking-state-card">
              <strong>Loading centers...</strong>
              <p>Gathering clinic locations for this public rescue intake page.</p>
            </div>
          ) : null}

          {!loadingCenters && centerError ? (
            <div className="rescue-booking-state-card rescue-booking-state-card-error">
              <strong>Center list unavailable</strong>
              <p>{centerError}</p>
            </div>
          ) : null}

          {!centerError ? (
            <div className="rescue-booking-centers-grid">
              {centers.map((center) => {
                const isSelected = formValues.selectedCenterId === center.id;

                return (
                  <button
                    type="button"
                    key={center.id}
                    className={`rescue-booking-center-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleCenterSelect(center.id)}
                  >
                    <div className="rescue-booking-center-top">
                      <span className="rescue-booking-center-code">{center.clinicCode || "Center"}</span>
                      <span className="rescue-booking-center-state">
                        {isSelected ? "Selected" : "Available"}
                      </span>
                    </div>

                    <h3>{center.clinicName}</h3>
                    <p className="rescue-booking-center-location">{center.locationText}</p>

                    <div className="rescue-booking-center-meta">
                      {center.phoneNumber ? <span>{center.phoneNumber}</span> : null}
                      {center.email ? <span>{center.email}</span> : null}
                    </div>

                    <div className="rescue-booking-center-footer">
                      <span>{isSelected ? "Linked to intake form" : "Tap to choose this center"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rescue-booking-summary-section">
        <div className="rescue-booking-shell">
          <div className="rescue-booking-section-head compact">
            <span className="rescue-booking-section-label">Case Preview</span>
            <h2>Structured summary for the receiving team.</h2>
          </div>

          <div className="rescue-booking-summary-grid">
            <div className="rescue-booking-summary-card large">
              <h3>Rescue Intake Summary</h3>
              {confirmation ? (
                <div className="rescue-booking-summary-content">
                  <p><strong>Rescuer:</strong> {confirmation.rescuerName}</p>
                  <p><strong>Animal:</strong> {confirmation.petName} ({confirmation.species})</p>
                  <p><strong>Preferred Visit:</strong> {confirmation.appointmentDateTime}</p>
                  <p><strong>Center:</strong> {confirmation.centerName}</p>
                  <p><strong>Location:</strong> {confirmation.locationText}</p>
                </div>
              ) : (
                <p className="rescue-booking-summary-placeholder">
                  Fill in the form and use the preview button to create a polished intake summary.
                </p>
              )}
            </div>

            <div className="rescue-booking-summary-card">
              <h3>Triage Snapshot</h3>
              <div className="rescue-booking-metric-stack">
                <div>
                  <strong>{formValues.urgency}</strong>
                  <span>urgency</span>
                </div>
                <div>
                  <strong>{formValues.animalCondition}</strong>
                  <span>condition</span>
                </div>
                <div>
                  <strong>{formValues.transportMode}</strong>
                  <span>transport</span>
                </div>
              </div>
            </div>

            <div className="rescue-booking-summary-card">
              <h3>Good Intake Habits</h3>
              <ul className="rescue-booking-guidance-list">
                <li>Share a reachable phone number whenever possible.</li>
                <li>Pick the exact center before transport starts.</li>
                <li>Keep the notes short, factual, and clinically useful.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RescueBooking;
