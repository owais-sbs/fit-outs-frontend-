import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";

// Step Components
import ProjectSelectionStep from "./steps/ProjectSelectionStep";
import SurveySetupStep from "./steps/SurveySetupStep";
import RoomConfigStep from "./steps/RoomConfigStep";
import MeasurementsStep from "./steps/MeasurementsStep";
import PhotosStep from "./steps/PhotosStep";
import WorkItemsStep from "./steps/WorkItemsStep";
import ReviewStep from "./steps/ReviewStep";
import ProcessingStep from "./steps/ProcessingStep";
import QuotationStep from "./steps/QuotationStep";
import InvoiceStep from "./steps/InvoiceStep";

const STEPS = [
  { id: 1, name: "Project" },
  { id: 2, name: "Survey" },
  { id: 3, name: "Rooms" },
  { id: 4, name: "Measurements" },
  { id: 5, name: "Photos" },
  { id: 6, name: "Work Items" },
  { id: 7, name: "Review" },
  { id: 8, name: "BOQ" },
  { id: 9, name: "Quotation" },
  { id: 10, name: "Invoice" },
];

export default function BoqFlowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Shared state for the flow
  const [flowData, setFlowData] = useState({
    projectId: null,
    projectName: "",
    clientName: "",
    selectedFloor: "",
    selectedRoom: null,
    measurements: {},
    workItems: []
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 10));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step) => setCurrentStep(step);

  const updateData = (newData) => setFlowData({ ...flowData, ...newData });

  const renderStep = () => {
    const props = { nextStep, prevStep, flowData, updateData };
    switch (currentStep) {
      case 1: return <ProjectSelectionStep {...props} />;
      case 2: return <SurveySetupStep {...props} />;
      case 3: return <RoomConfigStep {...props} />;
      case 4: return <MeasurementsStep {...props} />;
      case 5: return <PhotosStep {...props} />;
      case 6: return <WorkItemsStep {...props} />;
      case 7: return <ReviewStep {...props} />;
      case 8: return <ProcessingStep {...props} />;
      case 9: return <QuotationStep {...props} />;
      case 10: return <InvoiceStep {...props} />;
      default: return <ProjectSelectionStep {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="BOQ & Survey Flow"
        description="Complete site visit quantities, BOQ generation, and quotation workflow."
      />

      {/* Global Stepper Wizard */}
      <div className="w-full bg-white border border-border/60 rounded-xl p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-max gap-2 text-sm font-medium">
          {STEPS.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isFuture = step.id > currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <button 
                  onClick={() => isCompleted && goToStep(step.id)}
                  disabled={!isCompleted && !isCurrent}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-full transition-colors ${
                    isCompleted ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer" :
                    isCurrent ? "bg-slate-900 text-white shadow-sm" :
                    "bg-slate-50 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 mr-1.5" /> : null}
                  {!isCompleted && <span className="mr-1.5 opacity-70">{step.id}.</span>}
                  <span>{step.name}</span>
                </button>
                
                {index < STEPS.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-2 ${isCompleted ? "text-emerald-300" : "text-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderStep()}
      </div>
    </div>
  );
}
