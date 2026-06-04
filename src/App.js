import { Fragment, useContext } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DarkModeContext } from "./context/darkModeContext";
import { ClinicProvider } from "./context/clinicContext";
import GeneralInformation from "./pages/generalInformation/GeneralInformation";
import Customers from "./pages/customers/Customers";
import Events from "./pages/events/Events";
import Laboratory from "./pages/laboratory/Laboratory";
import Store from "./pages/store/Store";
import Grooming from "./pages/grooming/Grooming";
import Pharmacy from "./pages/pharmacy/Pharmacy";
import Finance from "./pages/finance/Finance";
import Settings from "./pages/settings/Settings";
import ClinicUsers from "./pages/clinicUsers/ClinicUsers";
import Supplies from "./pages/supplies/Supplies";
import EditPet from "./pages/pet/EditPet";
import ListPet from "./pages/pet/ListPet";
import NewPet from "./pages/pet/NewPet";
import EditProfile from "./pages/profile/EditProfile";
import Profile from "./pages/profile/Profile";
import EditUser from "./pages/user/EditUser";
import ListUser from "./pages/user/ListUser";
import Login from "./pages/login/Login";
import AuthService from "./services/AuthService";
import ClinicSelect from "./pages/clinicSelect/ClinicSelect";
import Unauthorized from "./pages/Unauthorized";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AddClinic from "./pages/superadmin/AddClinic";
import ClinicDetail from "./pages/superadmin/ClinicDetail";
import ClinicPages from "./pages/superadmin/ClinicPages";
import VetDashboard from "./pages/vet/VetDashboard";
import PetCaseDetail from "./pages/vet/PetCaseDetail";
import VetPetDetails from "./pages/vet/VetPetDetails";
import PrivateRoute from "./PrivateRoute";
import RoleAccess from "./RoleAccess";
import "./style/dark.css";

const ClinicEntry = () => {
  const user = AuthService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "SUPERADMIN") return <Navigate to="/superadmin/dashboard" replace />;

  const selectedClinicId = localStorage.getItem("selectedClinicId");
  if (selectedClinicId) return <Navigate to={`/clinics/${selectedClinicId}/dashboard`} replace />;

  const clinics = user.clinics || [];
  if (clinics.length === 1) return <Navigate to={`/clinics/${clinics[0].id}/dashboard`} replace />;

  return <Navigate to="/select-clinic" replace />;
};

function App() {
  const { darkMode } = useContext(DarkModeContext);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <ClinicProvider>
        <BrowserRouter>
          <Fragment>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/select-clinic" element={<ClinicSelect />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/dashboard" element={<ClinicEntry />} />

              {/* Super Admin Only Routes */}
              <Route element={<RoleAccess roles={["SUPERADMIN"]} />}>
                <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/add-clinic" element={<AddClinic />} />
                <Route path="/superadmin/clinic/:id" element={<ClinicDetail />} />
              </Route>

              {/* Clinic Pages - Accessible to Super Admin, Admin, and Staff */}
              <Route element={<RoleAccess roles={["SUPERADMIN", "ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF", "USER"]} />}>
                <Route path="/superadmin/clinic/:id/pages" element={<ClinicPages />} />

                {/* Clinic-scoped routes for direct navigation */}
                <Route path="/clinics/:id/dashboard" element={<ClinicPages />} />
                <Route path="/clinics/:id/vet" element={<ClinicPages />} />
                <Route path="/clinics/:id/customers" element={<ClinicPages />} />
                <Route path="/clinics/:id/pets" element={<ClinicPages />} />
                <Route path="/clinics/:id/appointments" element={<ClinicPages />} />
                <Route path="/clinics/:id/events" element={<ClinicPages />} />
                <Route path="/clinics/:id/laboratory" element={<ClinicPages />} />
                <Route path="/clinics/:id/imaging-reports" element={<ClinicPages />} />
                <Route path="/clinics/:id/inpatient" element={<ClinicPages />} />
                <Route path="/clinics/:id/parameters" element={<ClinicPages />} />
                <Route path="/clinics/:id/grooming" element={<ClinicPages />} />
                <Route path="/clinics/:id/pharmacy" element={<ClinicPages />} />
                <Route path="/clinics/:id/store" element={<ClinicPages />} />
                <Route path="/clinics/:id/finance" element={<ClinicPages />} />
                <Route path="/clinics/:id/supplies" element={<ClinicPages />} />
                <Route path="/clinics/:id/settings" element={<ClinicPages />} />
              </Route>

              <Route path="/" element={<PrivateRoute />}>
                <Route path="/general-info" element={<GeneralInformation />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/appointments" element={<Events />} />
                <Route path="/events" element={<Navigate to="/appointments" replace />} />
                <Route path="/laboratory" element={<Laboratory />} />
                <Route path="/laboratory/inpatient" element={<Laboratory />} />
                <Route path="/laboratory/parameters" element={<Laboratory />} />
                <Route path="/store" element={<Store />} />
                <Route path="/grooming" element={<Grooming />} />
                <Route path="/pharmacy" element={<Pharmacy />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/clinic-users" element={<ClinicUsers />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/supplies" element={<Supplies />} />
              </Route>

              <Route path="pets" element={<PrivateRoute />}>
                <Route element={<RoleAccess roles={["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "STAFF", "SUPERADMIN"]} />} >
                  <Route index element={<ListPet />} />
                </Route>
                <Route element={<RoleAccess roles={["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "STAFF", "SUPERADMIN"]} />} >
                  <Route path="new" element={<NewPet />} />
                </Route>
                <Route element={<RoleAccess roles={["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "STAFF", "SUPERADMIN"]} />} >
                  <Route path="edit" element={<EditPet />} />
                </Route>
              </Route>

              <Route path="profile" element={<PrivateRoute />}>
                <Route element={<RoleAccess roles={["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF", "SUPERADMIN"]} />} >
                  <Route index element={<Profile />} />
                </Route>
                <Route element={<RoleAccess roles={["ADMIN", "VET", "GROOMER", "RECEPTIONIST", "PHARMACIST", "STAFF", "SUPERADMIN"]} />} >
                  <Route path="edit" element={<EditProfile />} />
                </Route>
              </Route>

              <Route path="users" element={<PrivateRoute />}>
                <Route element={<RoleAccess roles={["ADMIN", "SUPERADMIN"]} />} >
                  <Route index element={<ListUser />} />
                </Route>
                <Route element={<RoleAccess roles={["ADMIN", "SUPERADMIN"]} />}>
                  <Route path="edit" element={<EditUser />} />
                </Route>
              </Route>

              {/* Vet Dashboard - Accessible to VET role */}
              <Route path="/vet" element={<PrivateRoute />}>
                <Route element={<RoleAccess roles={["VET", "ADMIN", "SUPERADMIN"]} />} >
                  <Route index element={<VetDashboard />} />
                  <Route path="dashboard" element={<VetDashboard />} />
                  <Route path="case/:caseId" element={<PetCaseDetail />} />
                  <Route path="pet/:petId" element={<PetCaseDetail />} />
                  <Route path="pet/:petId/details" element={<VetPetDetails />} />
                  <Route path="medical-record/:medicalRecordNumber" element={<PetCaseDetail />} />
                  <Route path="medical-record/:medicalRecordNumber/appointment/:appointmentId" element={<PetCaseDetail />} />
                </Route>
              </Route>

            </Routes>
          </Fragment>
        </BrowserRouter>
      </ClinicProvider>
    </div>
  );
}

export default App;

