import { useCallback, useEffect, useState } from "react";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchStockBalances, fetchStockMovements } from "@/modules/admin/api/stock.api";
import { fetchBoqInbox, fetchBoqsByProject } from "@/modules/admin/api/boq.api";
import { ROLES, filterBoqInboxForRole } from "@/shared/constants/roles";
import { fetchAllLeads } from "@/modules/admin/api/leads.api";
import { fetchAllSiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchProjectCommercial } from "@/modules/admin/api/variations.api";
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
    projectCommercials: {},
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

      const [boqResults, commercialResults] = await Promise.all([
        Promise.all(
          projects.map((p) =>
            fetchBoqsByProject(p.id)
              .then((boqs) => ({ projectId: p.id, boqs: Array.isArray(boqs) ? boqs : [] }))
              .catch(() => ({ projectId: p.id, boqs: [] }))
          )
        ),
        Promise.all(
          projects.map((p) =>
            fetchProjectCommercial(p.id)
              .then((comm) => ({ projectId: p.id, commercial: comm }))
              .catch(() => ({ projectId: p.id, commercial: null }))
          )
        ),
      ]);

      const projectBoqs = {};
      const allBoqs = [];
      boqResults.forEach(({ projectId, boqs }) => {
        projectBoqs[projectId] = boqs;
        allBoqs.push(...boqs.map((b) => ({ ...b, projectId })));
      });

      const projectCommercials = {};
      commercialResults.forEach(({ projectId, commercial }) => {
        projectCommercials[projectId] = commercial;
      });

      setData({
        projects,
        stock,
        movements,
        inbox,
        leads,
        siteVisits,
        projectBoqs,
        allBoqs,
        projectCommercials,
      });
    } catch (e) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { projects, stock, movements, inbox, leads, siteVisits, projectBoqs, allBoqs, projectCommercials = {} } = data;

  const lowStock = stock.filter((s) => s.lowStock);
  const totalStockValue = stock.reduce((s, b) => s + Number(b.stockValue || 0), 0);
  const active = activeProjects(projects);

  const portfolio = projects.map((p) => {
    const commercial = projectCommercials[p.id];
    const hasCommercial = commercial?.currentContractValue != null && Number(commercial.currentContractValue) > 0;
    const boqTotal = latestApprovedBoqTotal(projectBoqs[p.id] || []);
    const contractVal = hasCommercial ? Number(commercial.currentContractValue) : Number(boqTotal);

    return {
      ...p,
      boqTotal,
      contractValue: contractVal,
      commercial,
    };
  });

  const contractValue = portfolio.reduce((sum, p) => sum + (p.contractValue || 0), 0);

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
