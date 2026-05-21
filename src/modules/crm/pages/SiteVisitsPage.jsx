import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, MapPin, Search } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { SITE_VISITS } from "../data/site-visits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function CountdownBadge({ hours }) {
  const label = hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
  return (
    <Badge variant="warning" className="gap-1">
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function VisitCard({ visit, upcoming }) {
  const initials = visit.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <Card className="border-border/60 transition-all hover:border-primary/25 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{visit.client}</p>
            <p className="text-sm text-muted-foreground">{visit.company}</p>
          </div>
          {upcoming ? <CountdownBadge hours={visit.countdownHours} /> : <Badge variant="success">Completed</Badge>}
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {visit.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(visit.date).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{visit.assignee}</span>
          </div>
          {!upcoming && visit.reportId && (
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link to={ROUTES.CRM.SITE_VISIT_REPORT.replace(":visitId", visit.reportId)}>
                <FileText className="h-3 w-3" />
                Report
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SiteVisitsPage() {
  const [search, setSearch] = useState("");

  const filter = (list) =>
    list.filter(
      (v) =>
        !search.trim() ||
        v.client.toLowerCase().includes(search.toLowerCase()) ||
        v.company.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site visits"
        description="Upcoming inspections and completed reports."
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.CRM.SITE_VISIT_SCHEDULE}>Schedule visit</Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({filter(SITE_VISITS.upcoming).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filter(SITE_VISITS.completed).length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filter(SITE_VISITS.upcoming).map((v) => (
            <VisitCard key={v.id} visit={v} upcoming />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filter(SITE_VISITS.completed).map((v) => (
            <VisitCard key={v.id} visit={v} upcoming={false} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
