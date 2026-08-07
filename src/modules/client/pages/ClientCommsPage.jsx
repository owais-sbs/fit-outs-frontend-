import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Loader2, MessageSquare } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchPendingClientTasks } from "@/modules/admin/api/room-collab.api";

/**
 * Live inbox of room tasks awaiting client review (replaces mock Communications).
 */
export default function ClientCommsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projects = await fetchAllProjects();
      const pendingLists = await Promise.all(
        projects.map(async (p) => {
          try {
            const tasks = await fetchPendingClientTasks(p.id);
            return tasks.map((t) => ({
              ...t,
              projectId: p.id,
              projectName: p.projectName || p.name || "Project",
            }));
          } catch {
            return [];
          }
        })
      );
      setItems(pendingLists.flat());
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load items for review");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Communications"
        description="Items waiting for your review — open a task to view files and reply."
      />

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center space-y-3">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No items waiting for your review</p>
            <p className="text-sm text-muted-foreground">
              When the team submits a design for approval, it will appear here.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to={ROUTES.CLIENT.PROJECTS_MY}>
                <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                Go to My Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const href = ROUTES.CLIENT.PROJECT_ROOM_TASK
              .replace(":projectId", item.projectId)
              .replace(":taskId", item.uuid);
            return (
              <Link
                key={`${item.projectId}-${item.uuid}`}
                to={href}
                className="block rounded-lg border border-border/60 bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {item.projectName}
                      {item.floorLabel || item.roomName
                        ? ` · ${[item.floorLabel, item.roomName].filter(Boolean).join(" · ")}`
                        : ""}
                    </p>
                    <p className="font-semibold text-sm mt-0.5 truncate">{item.title}</p>
                    {item.typeLabel && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.typeLabel}</p>
                    )}
                  </div>
                  <Badge className="shrink-0 bg-amber-500/15 text-amber-800 border-none font-medium">
                    Awaiting you
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
