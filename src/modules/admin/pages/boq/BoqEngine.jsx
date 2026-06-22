import { createContext, useContext, useState, useCallback, useEffect } from "react";

import { generateBoqDocument } from "./boqDataUtils";

export const QAS_TOTAL_STEPS = 3;

export const QAS_STEPS = [
  { id: 1, key: "project", label: "Project", short: "Project" },
  { id: 2, key: "survey", label: "Survey Rooms", short: "Survey" },
  { id: 3, key: "quotation", label: "Quotation", short: "Quotation" },
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

const DRAFT_STORAGE_KEY = "fitouts_qas_drafts";

const QasContext = createContext(null);
export const useBoq = () => useContext(QasContext);
export const useQas = useBoq;

function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraftToStorage(session, floors, rooms) {
  if (!session?.ref) return;
  const drafts = loadDrafts();
  drafts[session.ref] = {
    session,
    floors,
    rooms,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

export function BoqProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentStep, setStep] = useState(1);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [generatedBoq, setGeneratedBoq] = useState(null);
  const [savedBoqs, setSavedBoqs] = useState([]);

  useEffect(() => {
    if (session?.ref) {
      saveDraftToStorage(session, floors, rooms);
    }
  }, [session, floors, rooms]);

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
    setFloors([{ id: "floor-1", name: "Ground Floor" }]);
    setRooms([]);
    setGeneratedBoq(null);
    setSavedBoqs([]);
  }, []);

  const resumeSession = useCallback((draft) => {
    if (!draft?.session) return;
    setSession(draft.session);
    setFloors(draft.floors || []);
    setRooms(draft.rooms || []);
    setStep(2);
    setGeneratedBoq(null);
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
    setGeneratedBoq(null);
    setSavedBoqs([]);
  }, []);

  const generateBoq = useCallback(() => {
    setGeneratedBoq((prev) => {
      const doc = generateBoqDocument(floors, rooms, session);
      if (prev?.ref) {
        return { ...doc, ref: prev.ref, generatedAt: new Date().toISOString() };
      }
      return doc;
    });
  }, [floors, rooms, session]);

  const saveBoq = useCallback(() => {
    setGeneratedBoq((current) => {
      if (!current) return current;
      setSavedBoqs((list) => {
        const exists = list.some((b) => b.ref === current.ref);
        if (exists) return list;
        return [...list, { ...current, savedAt: new Date().toISOString() }];
      });
      return current;
    });
  }, []);

  const value = {
    session,
    currentStep,
    floors,
    setFloors,
    rooms,
    setRooms,
    generatedBoq,
    savedBoqs,
    startSession,
    resumeSession,
    loadDrafts,
    goToStep,
    nextStep,
    prevStep,
    completeSession,
    resetSession,
    generateBoq,
    saveBoq,
  };

  return <QasContext.Provider value={value}>{children}</QasContext.Provider>;
};
