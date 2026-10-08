const STORAGE_KEY = "fitouts-admin-profile";

/** Frontend-only profile store (localStorage). No backend. */
export function loadAdminProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAdminProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || {}));
    window.dispatchEvent(new Event("fitouts-admin-profile-updated"));
  } catch {
    /* ignore */
  }
}
