import { useState, useMemo, useCallback } from "react";
import { fetchReadyLeads, fetchRecentConversions, convertClient } from "../services/client-conversion.service";

export default function useClientConversion() {
  const [leads, setLeads] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadData, recentData] = await Promise.all([
      fetchReadyLeads(),
      fetchRecentConversions(),
    ]);
    setLeads(leadData);
    setRecent(recentData);
    setLoading(false);
  }, []);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const matchQ =
        !q ||
        l.clientName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q));
      const matchType = typeFilter === "all" || l.projectType === typeFilter;
      const matchManager = managerFilter === "all" || l.manager === managerFilter;
      return matchQ && matchType && matchManager;
    });
  }, [leads, search, typeFilter, managerFilter]);

  const handleConvert = useCallback(async (formData) => {
    setConverting(true);
    const res = await convertClient(formData);
    setResult(res);
    setConverting(false);
    setSuccessOpen(true);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedLead(null);
    setResult(null);
  }, []);

  return {
    leads,
    recent,
    loading,
    selectedLead,
    setSelectedLead,
    converting,
    result,
    successOpen,
    setSuccessOpen,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    managerFilter,
    setManagerFilter,
    filteredLeads,
    handleConvert,
    resetSelection,
    loadData,
  };
}
