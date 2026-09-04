import { useCallback, useEffect, useState } from "react";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchStockBalances, fetchStockMovements } from "@/modules/admin/api/stock.api";
import { fetchBoqInbox, fetchBoqsByProject } from "@/modules/admin/api/boq.api";
import { ROLES, filterBoqInboxForRole } from "@/shared/constants/roles";
import { fetchAllLeads } from "@/modules/admin/api/leads.api";
import { fetchAllSiteVisits } from "@/modules/admin/api/site-visits.api";
import {
  activeProjects,
  atRiskProjects,
  avgProgress,
  boqFunnelCounts,
  isThisMonth,
  latestApprovedBoqTotal,
  leadsByStatusPie,
  openLeads,
  stockValueByCategory,
  sumApprovedBoqTotals,
} from "../utils/directorDashboardUtils";

export default function useDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    projects: [],
    stock: [],
    movements: [],
    inbox: [],
    leads: [],
    siteVisits: [],
    projectBoqs: {},
    allBoqs: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, stock, inboxRaw, leads, siteVisits, movementsRes] = await Promise.all([
        fetchAllProjects(),
        fetchStockBalances(),
        fetchBoqInbox(ROLES.BUSINESS_OWNER),
        fetchAllLeads(),
        fetchAllSiteVisits(),
        fetchStockMovements(0, 8),
      ]);

      const inbox = filterBoqInboxForRole(inboxRaw, ROLES.BUSINESS_OWNER);

      const movements = movementsRes?.content ?? (Array.isArray(movementsRes) ? movementsRes : []);

      const boqResults = await Promise.all(
        projects.map((p) =>
          fetchBoqsByProject(p.id)
            .then((boqs) => ({ projectId: p.id, boqs: Array.isArray(boqs) ? boqs : [] }))
            .catch(() => ({ projectId: p.id, boqs: [] }))
        )
      );

      const projectBoqs = {};
      const allBoqs = [];
      boqResults.forEach(({ projectId, boqs }) => {
        projectBoqs[projectId] = boqs;
        allBoqs.push(...boqs.map((b) => ({ ...b, projectId })));
      });

      setData({ projects, stock, movements, inbox, leads, siteVisits, projectBoqs, allBoqs });
    } catch (e) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { projects, stock, movements, inbox, leads, siteVisits, projectBoqs, allBoqs } = data;

  const lowStock = stock.filter((s) => s.lowStock);
  const totalStockValue = stock.reduce((s, b) => s + Number(b.stockValue || 0), 0);
  const contractValue = sumApprovedBoqTotals(projectBoqs);
  const active = activeProjects(projects);

  const portfolio = projects.map((p) => ({
    ...p,
    boqTotal: latestApprovedBoqTotal(projectBoqs[p.id] || []),
  }));

  const kpis = {
    activeProjects: active.length,
    contractValue,
    avgProgress: avgProgress(projects),
    stockValue: totalStockValue,
    lowStockCount: lowStock.length,
    pendingApprovals: inbox.length,
    openLeads: openLeads(leads).length,
    siteVisitsThisMonth: siteVisits.filter((v) => isThisMonth(v.scheduledDate)).length,
  };

  return {
    loading,
    error,
    reload: load,
    kpis,
    portfolio,
    stock,
    lowStock,
    movements: movements.slice(0, 8),
    inbox,
    atRisk: atRiskProjects(projects),
    stockByCategory: stockValueByCategory(stock),
    boqFunnel: boqFunnelCounts(allBoqs),
    leadsPie: leadsByStatusPie(leads),
    leads,
    siteVisits,
    allBoqs,
  };
}
