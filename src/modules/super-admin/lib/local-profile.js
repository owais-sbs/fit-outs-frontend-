const STORAGE_KEY = "fitouts-sa-profile";

/** Frontend-only profile store (localStorage). No backend. */
export function loadSuperAdminProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSuperAdminProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || {}));
    window.dispatchEvent(new Event("fitouts-sa-profile-updated"));
  } catch {
    /* ignore quota / private mode */
  }
}
