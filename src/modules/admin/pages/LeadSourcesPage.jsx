import { useEffect, useState, useMemo } from "react";
import { Search, Globe, Smartphone, Users, BarChart3, Activity, CheckCircle } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAllLeads } from "../api/leads.api";

const SOURCE_ICONS = {
  "Google": Search,
  "Website": Globe,
  "Social": Smartphone,
  "Referral": Users,
  "Other": Activity
};

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600", iconBg: "bg-blue-100", bar: "bg-blue-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600", iconBg: "bg-purple-100", bar: "bg-purple-500" },
  rose: { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600", iconBg: "bg-rose-100", bar: "bg-rose-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-600", iconBg: "bg-teal-100", bar: "bg-teal-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", iconBg: "bg-amber-100", bar: "bg-amber-500" },
};

const COLORS = ["blue", "purple", "rose", "teal", "amber"];

function SourceCard({ source }) {
  const colors = COLOR_MAP[source.color];
  const Icon = source.icon || Activity;
  
  return (
    <Card className={`border ${colors.border} ${colors.bg} shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-100">
            {source.convRate}% conv.
          </Badge>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-slate-900">{source.name}</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-slate-900">{source.total}</span>
            <span className="text-sm font-medium text-slate-600">leads</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Converted</span>
            <span className="text-emerald-600 font-semibold">{source.converted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Pending</span>
            <span className="text-amber-600 font-semibold">{source.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Lost</span>
            <span className="text-rose-600 font-semibold">{source.lost}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadSourcesPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLeads()
      .then(data => setLeads(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sourceStats = useMemo(() => {
    if (!leads.length) return [];
    
    const sourceMap = {};
    leads.forEach(lead => {
      let source = lead.source || "Other";
      if (source === "—") source = "Other";
      
      if (!sourceMap[source]) {
        sourceMap[source] = {
          name: source,
          total: 0,
          converted: 0,
          pending: 0,
          lost: 0
        };
      }
      
      sourceMap[source].total += 1;
      
      if (lead.status === "CLIENT" || lead.statusLabel === "Converted") {
        sourceMap[source].converted += 1;
      } else if (lead.status === "LOST") {
        sourceMap[source].lost += 1;
      } else {
        sourceMap[source].pending += 1;
      }
    });

    return Object.values(sourceMap)
      .sort((a, b) => b.total - a.total)
      .map((s, idx) => ({
        ...s,
        convRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
        icon: SOURCE_ICONS[s.name] || Activity,
        color: COLORS[idx % COLORS.length]
      }));
  }, [leads]);

  const maxLeads = Math.max(...sourceStats.map(s => s.total), 1);
  const totalConverted = sourceStats.reduce((acc, s) => acc + s.converted, 0);
  const overallConvRate = leads.length > 0 ? Math.round((totalConverted / leads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Sources"
        description="Performance breakdown by acquisition channel"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value={loading ? "..." : leads.length} icon={Users} />
        <StatCard title="Converted" value={loading ? "..." : totalConverted} icon={CheckCircle} valueColor="text-emerald-600" />
        <StatCard title="Overall Conv. Rate" value={loading ? "..." : `${overallConvRate}%`} icon={BarChart3} valueColor="text-blue-600" />
        <StatCard title="Active Sources" value={loading ? "..." : sourceStats.length} icon={Activity} />
      </section>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading source analytics...</div>
      ) : sourceStats.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No leads data available to show sources.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sourceStats.map((source) => (
              <SourceCard key={source.name} source={source} />
            ))}
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-base mb-6">Lead Volume by Source</h3>
              
              <div className="space-y-8">
                {sourceStats.map((source) => {
                  const Icon = source.icon;
                  const colors = COLOR_MAP[source.color];
                  const totalPct = (source.total / maxLeads) * 100;
                  
                  const convPct = source.total > 0 ? (source.converted / source.total) * 100 : 0;
                  const pendPct = source.total > 0 ? (source.pending / source.total) * 100 : 0;
                  const lostPct = source.total > 0 ? (source.lost / source.total) * 100 : 0;

                  return (
                    <div key={source.name}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                          {source.name}
                        </div>
                        <div className="font-bold text-sm">{source.total}</div>
                      </div>
                      
                      {/* Total Bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full mb-1 overflow-hidden">
                        <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${totalPct}%` }} />
                      </div>
                      
                      {/* Status Breakdown Bar */}
                      <div className="flex h-1.5 w-full bg-transparent gap-1" style={{ width: `${totalPct}%` }}>
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${convPct}%` }} title={`Converted: ${source.converted}`} />
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pendPct}%` }} title={`Pending: ${source.pending}`} />
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${lostPct}%` }} title={`Lost: ${source.lost}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Converted
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Pending
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  Lost
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
