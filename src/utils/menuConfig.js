/**
 * Centralized menu configuration for different user roles
 * This ensures consistent menu items across the application
 */

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventIcon from "@mui/icons-material/Event";
import ScienceIcon from "@mui/icons-material/Science";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

/**
 * Super Admin Menu Items
 * Used for navigation in SuperAdmin Dashboard and Sidebar
 */
export const superAdminMenuItems = [
    {
        label: "Dashboard",
        icon: <DashboardIcon />,
        path: "/superadmin/dashboard",
    },
    {
        label: "Clinics",
        icon: <LocationOnIcon />,
        path: "/superadmin/dashboard?view=clinics",
    },
    {
        label: "Users",
        icon: <ManageAccountsIcon />,
        path: "/superadmin/dashboard?view=users",
    },
];

/**
 * Regular Staff Menu Items
 * Used for normal clinic users (admin, vet, receptionist, etc.)
 */
export const regularMenuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
    {
        label: "Customers",
        icon: <PeopleAltIcon />,
        path: "/customers",
        hasArrow: true,
    },
    { label: "Events", icon: <EventIcon />, path: "/events" },
    {
        label: "Laboratory",
        icon: <ScienceIcon />,
        hasArrow: true,
        hasDropdown: true,
        children: [
            { label: "Lab Reports", path: "/laboratory", icon: <ScienceIcon /> },
            { label: "Inpatient Reports", path: "/laboratory/inpatient", icon: <MedicalServicesIcon /> },
            { label: "Test Parameters", path: "/laboratory/parameters", icon: <SettingsIcon /> },
        ],
    },
    { label: "Imaging", icon: <MedicalServicesIcon />, path: "/imaging" },
    {
        label: "Pharmacy",
        icon: <LocalPharmacyIcon />,
        path: "/pharmacy",
        hasArrow: true,
    },
    {
        label: "Store",
        icon: <StorefrontIcon />,
        path: "/store",
        hasArrow: true,
    },
    { label: "Grooming", icon: <ContentCutIcon />, path: "/grooming" },
    {
        label: "Supplies",
        icon: <InventoryIcon />,
        path: "/supplies",
        hasArrow: true,
    },
    {
        label: "Finance",
        icon: <AccountBalanceWalletIcon />,
        path: "/finance",
        hasArrow: true,
    },
    { label: "Users", icon: <ManageAccountsIcon />, path: "/clinic-users" },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

/**
 * Get menu items based on user role
 * @param {string} userRole - The role of the current user
 * @returns {Array} Menu items array appropriate for the role
 */
export const getMenuItemsByRole = (userRole) => {
    if (userRole === "ROLE_SUPERADMIN" || userRole === "SUPERADMIN") {
        return superAdminMenuItems;
    }
    return regularMenuItems;
};

/**
 * Clinic Menu Items for ClinicPages
 * These tabs are shown in the sidebar when viewing a specific clinic
 */
export const getClinicMenuItems = (clinicId, userRole) => {
    const baseMenuItems = [
        { label: "Dashboard", value: "dashboard", icon: <DashboardIcon /> },
        { label: "Clients", value: "customers", icon: <PeopleAltIcon /> },
        { label: "Pets", value: "pets", icon: <DashboardIcon /> },
        { label: "Appointments", value: "events", icon: <EventIcon /> },
        {
            label: "Laboratory",
            value: "laboratory",
            icon: <ScienceIcon />,
            hasDropdown: true,
            children: [
                { label: "Lab Reports", value: "laboratory", icon: <ScienceIcon /> },
                { label: "Imaging Reports", value: "inpatient", icon: <MedicalServicesIcon /> },
                { label: "Test Parameters", value: "parameters", icon: <SettingsIcon /> },
            ],
        },
        { label: "Pharmacy", value: "pharmacy", icon: <LocalPharmacyIcon /> },
        { label: "Grooming", value: "grooming", icon: <ContentCutIcon /> },
        { label: "Store", value: "store", icon: <StorefrontIcon /> },
        { label: "Supplies", value: "supplies", icon: <InventoryIcon /> },
        { label: "Finance", value: "finance", icon: <AccountBalanceWalletIcon /> },
    ];

    // Add Users tab only for super admin and admin
    if (userRole === "ROLE_SUPERADMIN" || userRole === "ROLE_ADMIN") {
        baseMenuItems.push({ label: "Users", value: "users", icon: <ManageAccountsIcon /> });
    }

    baseMenuItems.push({ label: "Settings", value: "settings", icon: <SettingsIcon /> });

    return baseMenuItems;
};
