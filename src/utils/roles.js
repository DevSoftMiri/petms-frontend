/**
 * Role-Based Access Control Utilities for Frontend
 * Updated for PostgreSQL + Prisma backend
 * 
 * Role mapping from backend:
 * - SUPERADMIN: Full system access
 * - ADMIN: Clinic management
 * - VET: Veterinarian access
 * - GROOMER: Grooming services
 * - RECEPTIONIST: Appointment scheduling
 * - PHARMACIST: Pharmacy management
 * - STAFF: Limited staff access
 */

// ===========================
// ROLE DEFINITIONS
// ===========================

export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    VET: 'VET',
    GROOMER: 'GROOMER',
    RECEPTIONIST: 'RECEPTIONIST',
    PHARMACIST: 'PHARMACIST',
    STAFF: 'STAFF',
};

// ===========================
// ROLE DISPLAY NAMES
// ===========================

export const ROLE_LABELS = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    VET: 'Veterinarian',
    GROOMER: 'Groomer',
    RECEPTIONIST: 'Receptionist',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff',
};

// ===========================
// ROLE ICONS
// ===========================

export const ROLE_ICONS = {
    SUPERADMIN: '👑',
    ADMIN: '🔧',
    VET: '🩺',
    GROOMER: '✂️',
    RECEPTIONIST: '📞',
    PHARMACIST: '💊',
    STAFF: '👤',
};

// ===========================
// MODULE ACCESS MATRIX
// ===========================

export const MODULE_ACCESS = {
    [ROLES.SUPERADMIN]: [
        'dashboard',
        'clinics',
        'users',
        'customers',
        'pets',
        'appointments',
        'pharmacy',
        'grooming',
        'settings',
        'reports',
    ],

    [ROLES.ADMIN]: [
        'dashboard',
        'users',
        'customers',
        'pets',
        'appointments',
        'pharmacy',
        'grooming',
        'settings',
    ],

    [ROLES.VET]: [
        'dashboard',
        'pets',
        'appointments',
        'pharmacy',
    ],

    [ROLES.GROOMER]: [
        'dashboard',
        'pets',
        'grooming',
    ],

    [ROLES.RECEPTIONIST]: [
        'dashboard',
        'customers',
        'pets',
        'appointments',
    ],

    [ROLES.PHARMACIST]: [
        'dashboard',
        'pharmacy',
    ],

    [ROLES.STAFF]: ['dashboard'],
};

// ===========================
// MENU STRUCTURE BY ROLE
// ===========================

export const SIDEBAR_MENU = {
    [ROLES.SUPERADMIN]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Clinics', path: '/clinics', icon: 'clinic' },
        { label: 'Users', path: '/users', icon: 'users' },
        { label: 'Customers', path: '/customers', icon: 'customers' },
        { label: 'Pets', path: '/pets', icon: 'pets' },
        { label: 'Appointments', path: '/appointments', icon: 'calendar' },
        { label: 'Pharmacy', path: '/pharmacy', icon: 'pharmacy' },
        { label: 'Grooming', path: '/grooming', icon: 'grooming' },
        { label: 'Settings', path: '/settings', icon: 'settings' },
    ],

    [ROLES.ADMIN]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Staff', path: '/users', icon: 'users' },
        { label: 'Customers', path: '/customers', icon: 'customers' },
        { label: 'Pets', path: '/pets', icon: 'pets' },
        { label: 'Appointments', path: '/appointments', icon: 'calendar' },
        { label: 'Pharmacy', path: '/pharmacy', icon: 'pharmacy' },
        { label: 'Grooming', path: '/grooming', icon: 'grooming' },
        { label: 'Settings', path: '/settings', icon: 'settings' },
    ],

    [ROLES.VET]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Pets', path: '/pets', icon: 'pets' },
        { label: 'Appointments', path: '/appointments', icon: 'calendar' },
        { label: 'Pharmacy', path: '/pharmacy', icon: 'pharmacy' },
    ],

    [ROLES.GROOMER]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Pets', path: '/pets', icon: 'pets' },
        { label: 'Grooming', path: '/grooming', icon: 'grooming' },
    ],

    [ROLES.RECEPTIONIST]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Customers', path: '/customers', icon: 'customers' },
        { label: 'Pets', path: '/pets', icon: 'pets' },
        { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    ],

    [ROLES.PHARMACIST]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Pharmacy', path: '/pharmacy', icon: 'pharmacy' },
    ],

    [ROLES.STAFF]: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    ],
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Check if user can access a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean}
 */
export const canAccessModule = (role, module) => {
    const modules = MODULE_ACCESS[role] || [];
    return modules.includes(module);
};

/**
 * Get sidebar menu items for a role
 * @param {string} role - User role
 * @returns {array} Menu items
 */
export const getSidebarMenu = (role) => {
    return SIDEBAR_MENU[role] || [];
};

/**
 * Get display name for a role
 * @param {string} role - Role code
 * @returns {string} Display name
 */
export const getRoleLabel = (role) => {
    return ROLE_LABELS[role] || role;
};

/**
 * Get icon for a role
 * @param {string} role - Role code
 * @returns {string} Role icon
 */
export const getRoleIcon = (role) => {
    return ROLE_ICONS[role] || '👤';
};
