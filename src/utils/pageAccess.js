export const PAGE_ACCESS_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "vet", label: "Vet Dashboard" },
  { key: "customers", label: "Clients" },
  { key: "pets", label: "Pets" },
  { key: "appointments", label: "Appointments" },
  { key: "laboratory", label: "Laboratory" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "grooming", label: "Grooming" },
  { key: "store", label: "Store" },
  { key: "supplies", label: "Supplies" },
  { key: "finance", label: "Finance" },
  { key: "settings", label: "Settings" },
];

export const ROLE_LABELS = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  VET: "Veterinarian",
  GROOMER: "Groomer",
  RECEPTIONIST: "Receptionist",
  PHARMACIST: "Pharmacist",
  STAFF: "Staff",
  USER: "User",
};

export const ROLE_ALLOWED_PAGES = {
  SUPERADMIN: PAGE_ACCESS_OPTIONS.map((page) => page.key),
  ADMIN: PAGE_ACCESS_OPTIONS.map((page) => page.key),
  VET: ["dashboard", "vet", "customers", "pets", "appointments", "laboratory", "pharmacy", "settings"],
  GROOMER: ["dashboard", "customers", "pets", "appointments", "grooming", "settings"],
  RECEPTIONIST: ["dashboard", "customers", "pets", "appointments", "settings"],
  PHARMACIST: ["dashboard", "customers", "pets", "pharmacy", "store", "supplies", "settings"],
  STAFF: ["dashboard", "customers", "pets", "appointments", "store", "supplies", "settings"],
  USER: ["dashboard"],
};

export const getAllowedPagesForUser = (user) => {
  if (Array.isArray(user?.allowedPages)) {
    return user.allowedPages;
  }

  return ROLE_ALLOWED_PAGES[user?.role] || ["dashboard"];
};

export const canAccessPage = (user, pageKey) => {
  if (!pageKey) return true;
  if (user?.role === "SUPERADMIN") return true;
  return getAllowedPagesForUser(user).includes(pageKey);
};

export const getFirstAccessiblePage = (user, fallback = "dashboard") => {
  const allowedPages = getAllowedPagesForUser(user);
  return allowedPages[0] || fallback || null;
};

export const filterMenuItemsByAccess = (menuItems, user) =>
  menuItems.reduce((items, item) => {
    if (item.pageKey && !canAccessPage(user, item.pageKey)) {
      return items;
    }

    if (item.children?.length) {
      const children = item.children.filter((child) => !child.pageKey || canAccessPage(user, child.pageKey));
      if (children.length === 0) {
        return items;
      }

      items.push({
        ...item,
        children,
      });
      return items;
    }

    items.push(item);
    return items;
  }, []);
