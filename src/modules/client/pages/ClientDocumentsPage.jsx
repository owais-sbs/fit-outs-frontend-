import { FileText, Download, Eye, Search, FolderOpen } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DOCS = [
  { id: "doc-1", name: "Luxury Penthouse — Design Brief v1.2.pdf", project: "Luxury Penthouse Fit-Out", category: "Design Brief", size: "4.2 MB", date: "2026-06-01", type: "pdf" },
  { id: "doc-2", name: "Corporate HQ — FF&E Schedule Rev-A.pdf", project: "Corporate HQ Office Fit-Out", category: "FF&E Schedule", size: "8.7 MB", date: "2026-05-30", type: "pdf" },
  { id: "doc-3", name: "Villa Interior — Material Board.pdf", project: "High-End Villa Interior", category: "Material Board", size: "12.1 MB", date: "2026-05-28", type: "pdf" },
  { id: "doc-4", name: "Hotel Lobby — Construction Drawings.pdf", project: "Boutique Hotel Lobby", category: "Construction Drawings", size: "22.4 MB", date: "2026-05-20", type: "pdf" },
  { id: "doc-5", name: "Retail Store — Lighting Design Report.pdf", project: "Flagship Retail Store", category: "Lighting Design", size: "3.8 MB", date: "2026-05-18", type: "pdf" },
  { id: "doc-6", name: "Penthouse — Signed Client Approval.pdf", project: "Luxury Penthouse Fit-Out", category: "Signed Approval", size: "1.1 MB", date: "2026-06-02", type: "pdf" },
];

const CATEGORY_COLORS = {
  "Design Brief": "default",
  "FF&E Schedule": "warning",
  "Material Board": "secondary",
  "Construction Drawings": "outline",
  "Lighting Design": "success",
  "Signed Approval": "success",
};

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function ClientDocumentsPage() {
  const [search, setSearch] = useState("");
  const filtered = DOCS.filter(
    (d) =>
      !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="All design briefs, schedules, drawings, and signed approvals for your fit-out projects."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No documents found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.project} · {doc.size} · {formatDate(doc.date)}</p>
                </div>
                <Badge variant={CATEGORY_COLORS[doc.category] || "secondary"} className="shrink-0 hidden sm:flex">
                  {doc.category}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
