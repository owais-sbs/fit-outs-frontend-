import { useCallback, useEffect, useState } from "react";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchStockBalances, fetchStockMovements } from "@/modules/admin/api/stock.api";
import { fetchBoqInbox, fetchCompanyBoqPortfolio } from "@/modules/admin/api/boq.api";
import { fetchCompanySummary } from "@/modules/admin/api/billing.api";
import { ROLES, filterBoqInboxForRole } from "@/shared/constants/roles";
import { fetchAllLeads } from "@/modules/admin/api/leads.api";
import { fetchAllSiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchCompanyPnl } from "@/modules/pnl/api/pnl.api";
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
} from "../utils/directorDashboardUtils";

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function mapPortfolioBoqs(portfolioRows) {
  const projectBoqs = {};
  const allBoqs = [];
  const projectCommercials = {};
  asList(portfolioRows).forEach((row) => {
    const projectId = String(row.projectId ?? row.id ?? "");
    if (!projectId) return;
    const boqs = asList(row.boqs).map((b) => ({ ...b, projectId }));
    projectBoqs[projectId] = boqs;
    allBoqs.push(...boqs);
    if (row.currentContractValue != null) {
      projectCommercials[projectId] = { currentContractValue: row.currentContractValue };
    }
    if (row.boqTotal != null && !projectBoqs[projectId].length) {
      projectBoqs[projectId] = [{
        projectId,
        status: row.boqStatus,
        version: row.boqVersion,
        grandTotal: row.boqTotal ?? row.grandTotal,
        subtotal: row.subtotal,
      }];
    }
  });
  return { projectBoqs, allBoqs, projectCommercials };
}

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
    companyPnl: null,
    billingByProject: {},
  });

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const [projects, stock, inboxRaw, leads, siteVisits, movementsRes, companyPnl, boqPortfolio, billingSummary] =
        await Promise.all([
          fetchAllProjects(),
          fetchStockBalances(),
          fetchBoqInbox(ROLES.BUSINESS_OWNER),
          fetchAllLeads(),
          fetchAllSiteVisits(),
          fetchStockMovements(0, 8),
          fetchCompanyPnl().catch(() => null),
          fetchCompanyBoqPortfolio().catch(() => []),
          fetchCompanySummary().catch(() => []),
        ]);

      if (signal?.aborted) return;

      const inbox = filterBoqInboxForRole(inboxRaw, ROLES.BUSINESS_OWNER);
      const movements = movementsRes?.content ?? (Array.isArray(movementsRes) ? movementsRes : []);
      const { projectBoqs, allBoqs, projectCommercials } = mapPortfolioBoqs(boqPortfolio);

      const billingByProject = {};
      asList(billingSummary).forEach((row) => {
        if (row?.projectId != null) {
          billingByProject[String(row.projectId)] = row;
        }
      });

      setData({
        projects: asList(projects),
        stock,
        movements,
        inbox,
        leads,
        siteVisits,
        projectBoqs,
        allBoqs,
        projectCommercials,
        companyPnl,
        billingByProject,
      });
    } catch (e) {
      if (signal?.aborted) return;
      setError(e.message || "Failed to load dashboard data");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const {
    projects,
    stock,
    movements,
    inbox,
    leads,
    siteVisits,
    projectBoqs,
    allBoqs,
    projectCommercials = {},
    companyPnl,
    billingByProject = {},
  } = data;

  const lowStock = stock.filter((s) => s.lowStock);
  const totalStockValue = stock.reduce((s, b) => s + Number(b.stockValue || 0), 0);
  const active = activeProjects(projects);

  const portfolio = projects.map((p) => {
    const id = String(p.id);
    const commercial = projectCommercials[id];
    const billing = billingByProject[id];
    const hasCommercial = commercial?.currentContractValue != null && Number(commercial.currentContractValue) > 0;
    const mappedBoqTotal = latestApprovedBoqTotal(projectBoqs[id] || []);
    const boqTotal = mappedBoqTotal || Number(billing?.billedAmount || 0);
    const contractVal = hasCommercial
      ? Number(commercial.currentContractValue)
      : Number(billing?.billedAmount || boqTotal);

    return {
      ...p,
      boqTotal,
      contractValue: contractVal,
      commercial,
    };
  });

  const contractValue = companyPnl?.contractValue != null
    ? Number(companyPnl.contractValue)
    : portfolio.reduce((sum, p) => sum + (p.contractValue || 0), 0);

  const kpis = {
    activeProjects: active.length,
    contractValue,
    totalCost: Number(companyPnl?.totalCost || 0),
    margin: Number(companyPnl?.margin || 0),
    marginPercent: companyPnl?.marginPercent != null ? Number(companyPnl.marginPercent) : null,
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
    reload: () => load(),
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
