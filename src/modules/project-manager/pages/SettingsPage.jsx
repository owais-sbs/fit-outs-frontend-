import { useCallback } from "react";
import AccountProfileSettings from "@/components/shared/AccountProfileSettings";
import { loadPmProfile, savePmProfile } from "../lib/local-profile";

export default function PmSettingsPage() {
  const loadProfile = useCallback(() => loadPmProfile(), []);
  const saveProfile = useCallback((profile) => savePmProfile(profile), []);

  return (
    <AccountProfileSettings
      title="My Profile"
      description="Manage your profile and account password."
      accountLabel="your Project Manager account"
      loadProfile={loadProfile}
      saveProfile={saveProfile}
    />
  );
}
