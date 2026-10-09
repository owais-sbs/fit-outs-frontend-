const STORAGE_KEY = "fitouts-pm-profile";

/** Frontend-only profile store (localStorage). No backend. */
export function loadPmProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function savePmProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || {}));
    window.dispatchEvent(new Event("fitouts-pm-profile-updated"));
  } catch {
    /* ignore quota / private mode */
  }
}
