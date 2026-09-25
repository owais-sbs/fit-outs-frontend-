import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import AssignedProgrammeView from "@/modules/shared/schedule/AssignedProgrammeView";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Full published programme for staff assigned to the project team.
 * Progress reporting stays on My Activities; this page is the project Gantt.
 */
export default function EmployeeProjectSchedulePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const detailPath = ROUTES.EMPLOYEE.PROJECTS;

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
          Back to projects
        </Link>
      </div>

      <PageTitle
        title="Programme"
        subtitle="Published schedule for your assigned project"
      />

      <AssignedProgrammeView
        projectOptions={[{ id: projectId, name: `Project #${projectId}` }]}
        initialProjectId={projectId}
        allowProgress={false}
        emptyMessage="Programme not published yet. Your project manager will publish it when ready."
      />
    </PageShell>
  );
}
