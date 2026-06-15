import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TENANTS_LIST } from "../data/tenants";
import axiosInstance from "@/lib/axiosInstance";

function normalizeTenant(tenant, planLookup) {
  const company = tenant.companyName || tenant.company || tenant.name || "Untitled company";
  const id = tenant.uuid || tenant.id;
  const status = (tenant.status || "active").toLowerCase();
  const planUuid = tenant.subscriptionPlanUuid || tenant.plan || null;
  const planName = planLookup && planUuid ? (planLookup[planUuid] || planUuid) : (planUuid || "—");
  return {
    ...tenant,
    id,
    uuid: id,
    name: company,
    company,
    plan: planName,
    planUuid,
    status,
    users: tenant.users ?? tenant.activeUsers ?? 0,
    activeUsers: tenant.activeUsers ?? tenant.users ?? 0,
    expiryDate: tenant.expiryDate || "",
    renewalDate: "",
    revenue: 0,
    mrr: 0,
    renewalState: "manual",
    domainSlug: tenant.domainSlug || "",
    logo: tenant.logo || "",
    createdAt: tenant.createdAt || "",
  };
}

function buildTenantRows(tenants, planLookup) {
  return tenants.map((t) => normalizeTenant(t, planLookup));
}

function createCsvRows(tenants) {
  const headers = ["ID", "Company", "Plan", "Status", "Domain", "Created"];
  const rows = tenants.map((tenant) => [
    tenant.id,
    tenant.company,
    tenant.plan,
    tenant.status,
    tenant.domainSlug,
    tenant.createdAt || "",
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

const TenantManagementContext = createContext(null);

export function TenantManagementProvider({ children }) {
  const [tenants, setTenants] = useState(() => buildTenantRows(TENANTS_LIST));
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTenantsLoading(true);
    setTenantsError(null);

    Promise.all([
      axiosInstance.get("/companies/GetAllCompanies"),
      axiosInstance.get("/subscription-plans").catch(() => ({ data: { data: [] } })),
    ])
      .then(([companiesRes, plansRes]) => {
        if (cancelled) return;
        const companyList = Array.isArray(companiesRes.data?.data) ? companiesRes.data.data : [];
        const planList = Array.isArray(plansRes.data?.data) ? plansRes.data.data : [];
        const planLookup = Object.fromEntries(
          planList.map((p) => [p.uuid, p.planName])
        );
        if (companyList.length > 0) setTenants(buildTenantRows(companyList, planLookup));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch companies:", err);
        setTenantsError(err?.response?.data?.message || err.message || "Failed to load companies");
      })
      .finally(() => {
        if (!cancelled) setTenantsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = 0;
    const activeSubscriptions = tenants.filter((tenant) => tenant.status === "active").length;
    const trialTenants = tenants.filter((tenant) => tenant.status === "trial").length;
    const expiringSoon = 0;

    return {
      totalRevenue,
      activeSubscriptions,
      trialTenants,
      expiringSoon,
    };
  }, [tenants]);

  const exportTenants = useCallback(() => {
    const csv = createCsvRows(tenants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [tenants]);

  const getTenantById = useCallback(
    (id) => tenants.find((tenant) => tenant.id === id),
    [tenants]
  );

  const value = useMemo(
    () => ({
      tenants,
      tenantsLoading,
      tenantsError,
      stats,
      exportOpen,
      setExportOpen,
      exportTenants,
      getTenantById,
    }),
    [tenants, tenantsLoading, tenantsError, stats, exportOpen, exportTenants, getTenantById]
  );

  return (
    <TenantManagementContext.Provider value={value}>
      {children}
    </TenantManagementContext.Provider>
  );
}

export function useTenantManagement() {
  const context = useContext(TenantManagementContext);

  if (!context) {
    throw new Error("useTenantManagement must be used within a TenantManagementProvider");
  }

  return context;
}

export { normalizeTenant };
