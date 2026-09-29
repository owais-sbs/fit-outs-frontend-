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

function normalizeCompanyAdmins(tenant) {
  if (Array.isArray(tenant.companyAdmins) && tenant.companyAdmins.length > 0) {
    return tenant.companyAdmins;
  }
  if (tenant.adminEmail) {
    return [{ fullName: "", email: tenant.adminEmail, phone: "" }];
  }
  return [];
}

function formatAdminEmails(companyAdmins) {
  const emails = companyAdmins
    .map((admin) => admin.email)
    .filter(Boolean);
  return emails.length > 0 ? emails.join(", ") : "";
}

function normalizeTenant(tenant, planLookup) {
  const company = tenant.companyName || tenant.company || tenant.name || "Untitled company";
  const id = tenant.uuid || tenant.id;
  const status = (tenant.status || "active").toLowerCase();
  const planUuid = tenant.subscriptionPlanUuid || tenant.plan || null;
  const planName =
    tenant.subscriptionPlanName ||
    (planLookup && planUuid ? planLookup[planUuid] || planUuid : planUuid || "N/A");
  const companyAdmins = normalizeCompanyAdmins(tenant);
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
    companyAdmins,
    adminEmails: formatAdminEmails(companyAdmins),
    adminEmail: tenant.adminEmail || companyAdmins[0]?.email || "",
  };
}

function buildTenantRows(tenants, planLookup) {
  return tenants.map((t) => normalizeTenant(t, planLookup));
}

const TenantManagementContext = createContext(null);

export function TenantManagementProvider({ children }) {
  const [tenants, setTenants] = useState(() => buildTenantRows(TENANTS_LIST));
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState(null);
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
    const activeSubscriptions = tenants.filter((tenant) => tenant.status === "active").length;
    const suspendedTenants = tenants.filter((tenant) => tenant.status === "suspended").length;
    const trialTenants = tenants.filter((tenant) => tenant.status === "trial").length;
    const terminatedTenants = tenants.filter((tenant) => tenant.status === "terminated").length;

    return {
      totalRevenue: 0,
      activeSubscriptions,
      suspendedTenants,
      trialTenants,
      terminatedTenants,
      expiringSoon: 0,
    };
  }, [tenants]);

  const refreshTenants = useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError(null);
    try {
      const [companiesRes, plansRes] = await Promise.all([
        axiosInstance.get("/companies/GetAllCompanies"),
        axiosInstance.get("/subscription-plans").catch(() => ({ data: { data: [] } })),
      ]);
      const companyList = Array.isArray(companiesRes.data?.data) ? companiesRes.data.data : [];
      const planList = Array.isArray(plansRes.data?.data) ? plansRes.data.data : [];
      const planLookup = Object.fromEntries(planList.map((p) => [p.uuid, p.planName]));
      setTenants(buildTenantRows(companyList, planLookup));
    } catch (err) {
      setTenantsError(err?.response?.data?.message || err.message || "Failed to load companies");
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  const updateTenantStatus = useCallback(async (tenantId, action) => {
    const endpoint =
      action === "activate"
        ? `/companies/ActivateCompany/${tenantId}`
        : action === "suspend"
          ? `/companies/SuspendCompany/${tenantId}`
          : `/companies/TerminateCompany/${tenantId}`;
    const { data } = await axiosInstance.post(endpoint);
    const updated = data?.data;
    if (updated) {
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId
            ? normalizeTenant(
                {
                  ...tenant,
                  ...updated,
                  status: updated.status,
                  subscriptionPlanUuid: updated.subscriptionPlanUuid,
                  subscriptionPlanName: updated.subscriptionPlanName,
                },
                null
              )
            : tenant
        )
      );
    } else {
      await refreshTenants();
    }
    return updated;
  }, [refreshTenants]);

  const changeTenantPlan = useCallback(async (tenant, planUuid) => {
    const { data } = await axiosInstance.put(`/companies/UpdateCompany/${tenant.id}`, {
      companyName: tenant.company,
      domainSlug: tenant.domainSlug,
      logo: tenant.logo || undefined,
      subscriptionPlanUuid: planUuid,
      status: (tenant.status || "ACTIVE").toUpperCase(),
    });
    const updated = data?.data;
    if (updated) {
      setTenants((prev) =>
        prev.map((row) =>
          row.id === tenant.id
            ? normalizeTenant(
                {
                  ...row,
                  ...updated,
                  status: updated.status,
                  subscriptionPlanUuid: updated.subscriptionPlanUuid,
                  subscriptionPlanName: updated.subscriptionPlanName,
                },
                null
              )
            : row
        )
      );
    }
    return updated;
  }, []);

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
      getTenantById,
      refreshTenants,
      updateTenantStatus,
      changeTenantPlan,
    }),
    [
      tenants,
      tenantsLoading,
      tenantsError,
      stats,
      getTenantById,
      refreshTenants,
      updateTenantStatus,
      changeTenantPlan,
    ]
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
