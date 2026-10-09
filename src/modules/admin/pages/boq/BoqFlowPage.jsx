import { BoqProvider, useBoq, QAS_STEPS } from "./BoqEngine";
import BoqProgressBar from "./BoqProgressBar";
import { boqStatusLabel } from "@/shared/constants/roles";
import { Navigate, useSearchParams } from "react-router-dom";

import Step01ProjectSelection from "./steps/Step01ProjectSelection";
import Step02SurveyRooms from "./steps/Step02SurveyRooms";
import Step03GenerateQuotation from "./steps/Step03GenerateQuotation";

const STEP_COMPONENTS = {
  1: Step01ProjectSelection,
  2: Step02SurveyRooms,
  3: Step03GenerateQuotation,
};

function QasWorkspace() {
  const { currentStep, session, generatedBoq } = useBoq();
  const StepComponent = STEP_COMPONENTS[currentStep] || Step01ProjectSelection;
  const stepDef = QAS_STEPS.find((s) => s.id === currentStep);
  const workflowStatus = generatedBoq?.status
    ? boqStatusLabel(generatedBoq.status)
    : session?.status;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="boq-app-chrome border-b border-border/60 bg-background px-4 py-4 print:hidden md:px-6" data-boq-chrome>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">QAS Management</h1>
            {session ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-primary">{session.ref}</span>
                <span>·</span>
                <span>{session.project?.projectName || session.project?.name}</span>
                <span>·</span>
                <span>{workflowStatus}</span>
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Select a project to begin the QAS workflow
              </p>
            )}
          </div>
          {session && stepDef ? (
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Step {currentStep}: {stepDef.label}
            </p>
          ) : null}
        </div>
      </div>

      <div className="boq-app-chrome print:hidden" data-boq-chrome>
        <BoqProgressBar />
      </div>

      <div className="flex-1 overflow-y-auto print:overflow-visible">
        <div className="w-full max-w-none p-4 md:p-6 print:p-0">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}

export default function BoqFlowPage() {
  const [searchParams] = useSearchParams();
  const boqId = searchParams.get("boqId");
  const projectId = searchParams.get("projectId");
  if (boqId) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return <Navigate to={`/admin/boq/${boqId}${query}`} replace />;
  }
  return (
    <BoqProvider>
      <QasWorkspace />
    </BoqProvider>
  );
}
