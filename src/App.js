import { Fragment, useContext } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DarkModeContext } from "./context/darkModeContext";
import { ClinicProvider } from "./context/clinicContext";
import Home from "./pages/home/Home";
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
import Unauthorized from "./pages/Unauthorized";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AddClinic from "./pages/superadmin/AddClinic";
import ClinicDetail from "./pages/superadmin/ClinicDetail";
import ClinicPages from "./pages/superadmin/ClinicPages";
import PrivateRoute from "./PrivateRoute";
import RoleAccess from "./RoleAccess";
import "./style/dark.css";

function App() {
  const { darkMode } = useContext(DarkModeContext);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <ClinicProvider>
        <BrowserRouter>
          <Fragment>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<Navigate to="/login" />} />

              {/* Super Admin Only Routes */}
              <Route element={<RoleAccess roles={["SUPERADMIN"]} />}>
                <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/add-clinic" element={<AddClinic />} />
                <Route path="/superadmin/clinic/:id" element={<ClinicDetail />} />
              </Route>

              {/* Clinic Pages - Accessible to Super Admin, Admin, and Staff */}
              <Route element={<RoleAccess roles={["SUPERADMIN", "ADMIN", "STAFF"]} />}>
                <Route path="/superadmin/clinic/:id/pages" element={<ClinicPages />} />
              </Route>

              <Route path="/" element={<PrivateRoute />}>
                <Route path="/general-info" element={<GeneralInformation />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/events" element={<Events />} />
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

            </Routes>
          </Fragment>
        </BrowserRouter>
      </ClinicProvider>
    </div>
  );
}

export default App;
