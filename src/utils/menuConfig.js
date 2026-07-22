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
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SettingsIcon from "@mui/icons-material/Settings";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PetsIcon from "@mui/icons-material/Pets";

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
    { label: "Dashboard", icon: <DashboardIcon />, path: "/", pageKey: "dashboard" },
    {
        label: "Customers",
        icon: <PeopleAltIcon />,
        path: "/customers",
        hasArrow: true,
        pageKey: "customers",
    },
    { label: "Appointments", icon: <EventIcon />, path: "/appointments", pageKey: "appointments" },
    { label: "Rescue Booking", icon: <PetsIcon />, path: "/rescue-booking" },
    {
        label: "Laboratory",
        icon: <ScienceIcon />,
        hasArrow: true,
        hasDropdown: true,
        pageKey: "laboratory",
        children: [
            { label: "Lab Reports", path: "/laboratory", icon: <ScienceIcon />, pageKey: "laboratory" },
            { label: "Inpatient Reports", path: "/laboratory/inpatient", icon: <MedicalServicesIcon />, pageKey: "laboratory" },
            { label: "Test Parameters", path: "/laboratory/parameters", icon: <SettingsIcon />, pageKey: "laboratory" },
        ],
    },
    { label: "Imaging", icon: <MedicalServicesIcon />, path: "/imaging" },
    {
        label: "Pharmacy",
        icon: <LocalPharmacyIcon />,
        path: "/pharmacy",
        hasArrow: true,
        pageKey: "pharmacy",
    },
    {
        label: "Food",
        icon: <RestaurantMenuIcon />,
        path: "/food",
        hasArrow: true,
        pageKey: "food",
    },
    {
        label: "Store",
        icon: <StorefrontIcon />,
        path: "/store",
        hasArrow: true,
        pageKey: "store",
    },
    { label: "Grooming", icon: <ContentCutIcon />, path: "/grooming", pageKey: "grooming" },
    {
        label: "Supplies",
        icon: <InventoryIcon />,
        path: "/supplies",
        hasArrow: true,
        pageKey: "supplies",
    },
    {
        label: "Finance",
        icon: <AccountBalanceWalletIcon />,
        path: "/finance",
        hasArrow: true,
        pageKey: "finance",
    },
    { label: "Users", icon: <ManageAccountsIcon />, path: "/clinic-users" },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings", pageKey: "settings" },
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
    if (userRole === "VET" || userRole === "ROLE_VET") {
        // Add Vet Dashboard to regular menu items for VET role
        return [
            { label: "Vet Dashboard", icon: <LocalHospitalIcon />, path: "/vet", pageKey: "vet" },
            ...regularMenuItems,
        ];
    }
    return regularMenuItems;
};

/**
 * Clinic Menu Items for ClinicPages
 * These tabs are shown in the sidebar when viewing a specific clinic
 */
export const getClinicMenuItems = (clinicId, userRole) => {
    const baseMenuItems = [
        { label: "Dashboard", value: "dashboard", icon: <DashboardIcon />, pageKey: "dashboard" },
        { label: "Clients", value: "customers", icon: <PeopleAltIcon />, pageKey: "customers" },
        { label: "Pets", value: "pets", icon: <DashboardIcon />, pageKey: "pets" },
        { label: "Appointments", value: "appointments", icon: <EventIcon />, pageKey: "appointments" },
        {
            label: "Laboratory",
            value: "laboratory",
            icon: <ScienceIcon />,
            hasDropdown: true,
            pageKey: "laboratory",
            children: [
                { label: "Lab Reports", value: "laboratory", icon: <ScienceIcon />, pageKey: "laboratory" },
                { label: "Imaging Reports", value: "imaging-reports", icon: <MedicalServicesIcon />, pageKey: "laboratory" },
                { label: "Inpatient Reports", value: "inpatient", icon: <MedicalServicesIcon />, pageKey: "laboratory" },
                { label: "Test Parameters", value: "parameters", icon: <SettingsIcon />, pageKey: "laboratory" },
            ],
        },
        { label: "Pharmacy", value: "pharmacy", icon: <LocalPharmacyIcon />, pageKey: "pharmacy" },
        { label: "Grooming", value: "grooming", icon: <ContentCutIcon />, pageKey: "grooming" },
        { label: "Food", value: "food", icon: <RestaurantMenuIcon />, pageKey: "food" },
        { label: "Store", value: "store", icon: <StorefrontIcon />, pageKey: "store" },
        { label: "Supplies", value: "supplies", icon: <InventoryIcon />, pageKey: "supplies" },
        { label: "Finance", value: "finance", icon: <AccountBalanceWalletIcon />, pageKey: "finance" },
    ];

    // Add Vet Dashboard for VET and SUPERADMIN roles
    if (userRole === "VET" || userRole === "ROLE_VET" || userRole === "SUPERADMIN" || userRole === "ROLE_SUPERADMIN" || userRole === "ADMIN" || userRole === "ROLE_ADMIN") {
        baseMenuItems.unshift({ label: "Vet Dashboard", value: "vet", icon: <LocalHospitalIcon />, pageKey: "vet" });
    }

    // Add Users tab only for super admin and admin
    if (userRole === "ROLE_SUPERADMIN" || userRole === "ROLE_ADMIN") {
        baseMenuItems.push({ label: "Users", value: "users", icon: <ManageAccountsIcon /> });
    }

    baseMenuItems.push({ label: "Settings", value: "settings", icon: <SettingsIcon />, pageKey: "settings" });

    return baseMenuItems;
};
