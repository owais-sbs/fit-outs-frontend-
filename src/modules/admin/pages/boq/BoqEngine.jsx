import { createContext, useContext, useState, useCallback } from "react";

export const QAS_TOTAL_STEPS = 5;

export const QAS_STEPS = [
  { id: 1, key: "project",   label: "Project",    short: "Project"   },
  { id: 2, key: "floors",    label: "Floors",     short: "Floors"    },
  { id: 3, key: "rooms",     label: "Rooms",      short: "Rooms"     },
  { id: 4, key: "review",    label: "Review",     short: "Review"    },
  { id: 5, key: "complete",  label: "Complete",   short: "Complete"  },
];

/** @deprecated use QAS_STEPS */
export const BOQ_STEPS = QAS_STEPS;

export const QAS_STATUS = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DRAFT: "Draft",
  COMPLETED: "Completed",
};

/** @deprecated use QAS_STATUS */
export const BOQ_STATUS = QAS_STATUS;

const QasContext = createContext(null);
export const useBoq = () => useContext(QasContext);
export const useQas = useBoq;

export function BoqProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentStep, setStep] = useState(1);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [measurements, setMeas] = useState({});
  const [photos, setPhotos] = useState({});
  const [workItems, setWorkItems] = useState({});

  const startSession = useCallback((project) => {
    const ref = `QAS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    setSession({
      ref,
      version: 1,
      project,
      status: QAS_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      lastSaved: new Date().toISOString(),
    });
    setStep(2);
    setFloors([]);
    setRooms([]);
    setMeas({});
    setPhotos({});
    setWorkItems({});
    window.__boq_walls = {};
  }, []);

  const goToStep = useCallback((step) => {
    if (QAS_STEPS.some((s) => s.id === step)) setStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, QAS_TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const completeSession = useCallback(() => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: QAS_STATUS.COMPLETED,
            completedAt: new Date().toISOString(),
            lastSaved: new Date().toISOString(),
          }
        : null
    );
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
    setStep(1);
    setFloors([]);
    setRooms([]);
    setMeas({});
    setPhotos({});
    setWorkItems({});
    window.__boq_walls = {};
  }, []);

  const value = {
    session,
    currentStep,
    floors,
    setFloors,
    rooms,
    setRooms,
    measurements,
    setMeas,
    photos,
    setPhotos,
    workItems,
    setWorkItems,
    startSession,
    goToStep,
    nextStep,
    prevStep,
    completeSession,
    resetSession,
  };

  return <QasContext.Provider value={value}>{children}</QasContext.Provider>;
}
