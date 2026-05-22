import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { TENANTS_LIST } from "../data/tenants";

function normalizeTenant(tenant) {
  const company = tenant.company || tenant.name || "Untitled tenant";
  return {
    ...tenant,
    id: tenant.id,
    name: company,
    company,
    users: tenant.users ?? tenant.activeUsers ?? 0,
    activeUsers: tenant.activeUsers ?? tenant.users ?? 0,
    expiryDate: tenant.expiryDate || tenant.renewalDate || "",
    renewalDate: tenant.renewalDate || tenant.expiryDate || "",
    revenue: tenant.revenue ?? tenant.mrr ?? 0,
    mrr: tenant.mrr ?? tenant.revenue ?? 0,
    renewalState: tenant.renewalState || "manual",
  };
}

function createTenantId(existingTenants) {
  const nextIndex = existingTenants.length + 1;
  return `t${String(nextIndex).padStart(3, "0")}`;
}

function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildTenantRows(tenants) {
  return tenants.map(normalizeTenant);
}

function createCsvRows(tenants) {
  const headers = ["ID", "Company", "Plan", "Status", "Users", "Renewal Date", "Revenue", "Renewal State"];
  const rows = tenants.map((tenant) => [
    tenant.id,
    tenant.company,
    tenant.plan,
    tenant.status,
    tenant.activeUsers,
    tenant.renewalDate || tenant.expiryDate || "",
    tenant.revenue ?? 0,
    tenant.renewalState || "",
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

const defaultForm = {
  company: "",
  contactName: "",
  email: "",
  plan: "Pro",
  status: "trial",
  activeUsers: "0",
  renewalDate: "",
  renewalState: "manual",
  revenue: "0",
  notes: "",
};

const TenantManagementContext = createContext(null);

export function TenantManagementProvider({ children }) {
  const [tenants, setTenants] = useState(() => buildTenantRows(TENANTS_LIST));
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState(defaultForm);

  const stats = useMemo(() => {
    const totalRevenue = tenants.reduce((sum, tenant) => sum + Number(tenant.revenue || 0), 0);
    const activeSubscriptions = tenants.filter((tenant) => tenant.status === "active").length;
    const trialTenants = tenants.filter((tenant) => tenant.status === "trial").length;
    const expiringSoon = tenants.filter((tenant) => {
      if (!tenant.renewalDate) return false;
      const renewalDate = new Date(tenant.renewalDate);
      if (Number.isNaN(renewalDate.getTime())) return false;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 30);
      return renewalDate <= cutoff;
    }).length;

    return {
      totalRevenue,
      activeSubscriptions,
      trialTenants,
      expiringSoon,
    };
  }, [tenants]);

  const resetForm = useCallback(() => {
    setTenantForm(defaultForm);
  }, []);

  const addTenant = useCallback((payload) => {
    const createdTenant = normalizeTenant({
      id: createTenantId(tenants),
      company: payload.company.trim(),
      name: payload.company.trim(),
      plan: payload.plan,
      status: payload.status,
      activeUsers: Number(payload.activeUsers) || 0,
      users: Number(payload.activeUsers) || 0,
      renewalDate: payload.renewalDate,
      expiryDate: payload.renewalDate,
      renewalState: payload.renewalState,
      revenue: Number(payload.revenue) || 0,
      mrr: Number(payload.revenue) || 0,
      contactName: payload.contactName.trim(),
      email: payload.email.trim(),
      notes: payload.notes.trim(),
    });

    setTenants((current) => [createdTenant, ...current]);
    return createdTenant;
  }, [tenants]);

  const exportTenants = useCallback(() => {
    const csv = createCsvRows(tenants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tenants-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
      stats,
      createOpen,
      setCreateOpen,
      exportOpen,
      setExportOpen,
      tenantForm,
      setTenantForm,
      addTenant,
      exportTenants,
      resetForm,
      getTenantById,
      formatDateForInput,
    }),
    [tenants, stats, createOpen, exportOpen, tenantForm, addTenant, exportTenants, resetForm, getTenantById]
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

export { normalizeTenant, formatDateForInput };
