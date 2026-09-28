import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import AssignedProgrammeView from "@/modules/shared/schedule/AssignedProgrammeView";
import { ROUTES } from "@/shared/constants/routes";

export default function SiteEngineerProjectSchedulePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const detailPath = ROUTES.SITE_ENGINEER.PROJECT_DETAIL.replace(":projectId", projectId);

  return (
    <PageShell className="mx-auto max-w-[1400px]">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => navigate(detailPath)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link to={detailPath} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to project
        </Link>
      </div>

      <PageTitle
        title="Programme"
        subtitle="Published schedule · select a bar to update progress"
      />

      <AssignedProgrammeView
        projectOptions={[{ id: projectId, name: `Project #${projectId}` }]}
        initialProjectId={projectId}
        progressMode="immediate"
        allowProgress
        emptyMessage="Ask your project manager to publish the schedule. Once published, the Gantt appears here and you can update activity progress."
      />
    </PageShell>
  );
}
