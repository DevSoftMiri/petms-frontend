import { useCallback, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClinicContext } from "../../context/clinicContext";
import AuthService from "../../services/AuthService";
import "./clinicSelect.css";

const ClinicSelect = () => {
  const navigate = useNavigate();
  const { dispatch } = useContext(ClinicContext);
  const user = AuthService.getCurrentUser();
  const clinics = useMemo(() => user?.clinics || [], [user?.clinics]);

  const selectClinic = useCallback((clinic) => {
    dispatch({ type: "SET_CLINIC", payload: clinic });
    navigate(`/clinics/${clinic.id}/dashboard`, { replace: true });
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role === "SUPERADMIN") {
      navigate("/superadmin/dashboard", { replace: true });
      return;
    }

    if (clinics.length === 1) {
      selectClinic(clinics[0]);
    }
  }, [user, clinics, navigate, selectClinic]);

  if (!user || user.role === "SUPERADMIN" || clinics.length === 1) {
    return <div className="clinic-select-loading">Opening clinic...</div>;
  }

  return (
    <div className="clinic-select-page">
      <div className="clinic-select-panel">
        <div className="clinic-select-header">
          <p>Welcome, {user.firstName || user.username}</p>
          <h1>Choose a clinic</h1>
        </div>

        <div className="clinic-select-grid">
          {clinics.map((clinic) => (
            <button
              key={clinic.id}
              className="clinic-select-card"
              onClick={() => selectClinic(clinic)}
            >
              <span className="clinic-select-name">{clinic.clinicName}</span>
              <span className="clinic-select-code">{clinic.clinicCode}</span>
              <span className="clinic-select-role">{clinic.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicSelect;
