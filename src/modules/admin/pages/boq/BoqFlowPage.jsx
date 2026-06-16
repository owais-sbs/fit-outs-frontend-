import { BoqProvider, useBoq, QAS_STEPS } from "./BoqEngine";
import BoqProgressBar from "./BoqProgressBar";

import Step01ProjectSelection from "./steps/Step01ProjectSelection";
import Step02FloorSetup from "./steps/Step02FloorSetup";
import Step03RoomCreation from "./steps/Step03RoomCreation";
import Step04Review from "./steps/Step04Review";
import Step05Completion from "./steps/Step05Completion";

const STEP_COMPONENTS = {
  1: Step01ProjectSelection,
  2: Step02FloorSetup,
  3: Step03RoomCreation,
  4: Step04Review,
  5: Step05Completion,
};

function QasWorkspace() {
  const { currentStep, session } = useBoq();
  const StepComponent = STEP_COMPONENTS[currentStep] || Step01ProjectSelection;
  const stepDef = QAS_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="flex flex-col min-h-0">
      <div className="border-b border-border/60 bg-background px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">QAS Management</h1>
            {session ? (
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-primary">{session.ref}</span>
                <span>·</span>
                <span>{session.project?.projectName || session.project?.name}</span>
                <span>·</span>
                <span className="capitalize">{session.status}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a project to begin the QAS workflow
              </p>
            )}
          </div>
          {session && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Current Step</p>
                <p className="text-sm font-semibold">{stepDef?.label}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm shadow-md shadow-primary/30">
                {currentStep}
              </div>
            </div>
          )}
        </div>
      </div>

      <BoqProgressBar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}

export default function BoqFlowPage() {
  return (
    <BoqProvider>
      <QasWorkspace />
    </BoqProvider>
  );
}
