import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { rememberProjectName } from "../../hooks/useProjectName";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchProjectById } from "../../api/projects.api";
import { portalRoutesFromPath, PROJECT_DETAIL_NAV_STATE } from "@/shared/constants/routes";
import CloseoutChecklistPanel from "./CloseoutChecklistPanel";
import FinalAccountPanel from "./FinalAccountPanel";
import PostCompletionPanel from "./PostCompletionPanel";
import CommercialLifecycleBadge from "../../components/projects/CommercialLifecycleBadge";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { fetchCloseoutChecklist } from "../../api/closeout.api";

const TAB_CHECKLIST = "checklist";
const TAB_FINAL_ACCOUNT = "final-account";
const TAB_POST_COMPLETION = "post-completion";
const VALID_TABS = new Set([TAB_CHECKLIST, TAB_FINAL_ACCOUNT, TAB_POST_COMPLETION]);

function projectSubPath(routes, key, projectId) {
  const template = routes?.[key];
  return template ? template.replace(":projectId", projectId) : null;
}

/**
 * Project Completion shell: Close-out Checklist | Final Account | Post-Completion.
 */
export default function ProjectCompletionPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routes = portalRoutesFromPath(location.pathname);
  const detailPath = projectSubPath(routes, "PROJECT_DETAIL", projectId) || routes.PROJECTS;

  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : TAB_CHECKLIST;

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [commercialStage, setCommercialStage] = useState(null);

  useEffect(() => {
    setLoadingProject(true);
    Promise.all([
      fetchProjectById(projectId),
      fetchCloseoutChecklist(projectId).catch(() => null),
    ])
      .then(([p, cl]) => {
        setProject(p);
        rememberProjectName(projectId, p?.projectName || p?.name);
        setCommercialStage(cl?.commercialStage || p?.commercialStage || null);
      })
      .catch(() => setProject(null))
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  const setTab = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams);
      if (next === TAB_CHECKLIST) {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      const qs = params.toString();
      navigate(
        { pathname: location.pathname, search: qs ? `?${qs}` : "" },
        { replace: true, state: location.state }
      );
    },
    [navigate, location.pathname, location.state, searchParams]
  );

  if (loadingProject) {
    return (
      <PageShell className="max-w-4xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ProjectPageFrame>
      <ProjectPathLine
        projectId={projectId}
        initialName={project?.projectName || project?.name || ""}
      />
      <PageHeader
        title="Project Completion"
        subtitle={project?.projectName || project?.name || "Project"}
        actions={commercialStage ? <CommercialLifecycleBadge stage={commercialStage} /> : null}
      />

      <ProjectLifecycleBanner commercialStage={commercialStage} />

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value={TAB_CHECKLIST}>Close-out Checklist</TabsTrigger>
          <TabsTrigger value={TAB_FINAL_ACCOUNT}>Final Account</TabsTrigger>
          <TabsTrigger value={TAB_POST_COMPLETION}>Post-Completion</TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_CHECKLIST}>
          <CloseoutChecklistPanel />
        </TabsContent>

        <TabsContent value={TAB_FINAL_ACCOUNT}>
          <FinalAccountPanel onOpenChecklist={() => setTab(TAB_CHECKLIST)} />
        </TabsContent>

        <TabsContent value={TAB_POST_COMPLETION}>
          <PostCompletionPanel
            onLifecycleChange={(cl) => setCommercialStage(cl?.commercialStage || null)}
          />
        </TabsContent>
      </Tabs>
      </ProjectPageFrame>
    </PageShell>
  );
}
