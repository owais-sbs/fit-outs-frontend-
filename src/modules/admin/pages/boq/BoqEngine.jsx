import { createContext, useContext, useState, useCallback, useEffect } from "react";

import {
  BOQ_STATUS,
  createAdditionalLine,
  generateBoqDocument,
  isBoqApproved,
  isBoqEditable,
  splitProjectBoqs,
} from "./boqDataUtils";
import { calcLineAmount } from "./quantityCalcUtils";
import {
  fetchBoq,
  fetchBoqsByProject,
  saveBoqFromSurvey,
  submitBoq as submitBoqApi,
  updateBoq,
  createBoqRevision,
} from "../../api/boq.api";
import { apiBoqToDocument, boqDocumentToApiPayload } from "./boqApiUtils";
import { fetchProjectQasSurveySeed, hydrateQasSurveySeed } from "../../api/qas-survey-seed.api";

export const QAS_TOTAL_STEPS = 3;

export const QAS_STEPS = [
  { id: 1, key: "project", label: "Project", short: "Project" },
  { id: 2, key: "survey", label: "Survey Rooms", short: "Survey" },
  { id: 3, key: "quotation", label: "BOQ & Quotation", short: "BOQ" },
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
export const BOQ_STATUS_LEGACY = QAS_STATUS;

const DRAFT_STORAGE_KEY = "fitouts_qas_drafts";
const BOQ_DRAFT_STORAGE_KEY = "fitouts_boq_drafts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value || ""));
}

function resolveApiBoqId(boqDoc) {
  if (!boqDoc) return null;
  if (boqDoc.apiId) return boqDoc.apiId;
  return isUuid(boqDoc.ref) ? boqDoc.ref : null;
}

function sessionStatusFromBoq(boqStatus) {
  if (isBoqApproved(boqStatus)) return QAS_STATUS.COMPLETED;
  if (isBoqEditable(boqStatus)) return QAS_STATUS.DRAFT;
  return QAS_STATUS.IN_PROGRESS;
}

function projectKey(projectOrId) {
  if (projectOrId == null) return "";
  if (typeof projectOrId === "object") {
    return String(projectOrId.id ?? "");
  }
  return String(projectOrId);
}

function normalizeDraftsByProject(raw = {}, getProjectId) {
  const byProject = {};
  Object.entries(raw).forEach(([key, entry]) => {
    const projectId = getProjectId(entry, key);
    if (!projectId) return;
    const existing = byProject[projectId];
    const entrySaved = new Date(entry.savedAt || entry.session?.lastSaved || 0).getTime();
    const existingSaved = existing
      ? new Date(existing.savedAt || existing.session?.lastSaved || 0).getTime()
      : 0;
    if (!existing || entrySaved >= existingSaved) {
      byProject[projectId] = entry;
    }
  });
  return byProject;
}

function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const normalized = normalizeDraftsByProject(parsed, (entry) =>
      projectKey(entry.session?.project)
    );
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return {};
  }
}

function loadBoqDrafts() {
  try {
    const raw = localStorage.getItem(BOQ_DRAFT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const normalized = normalizeDraftsByProject(parsed, (entry, key) =>
      projectKey(entry.session?.project) || (/^\d+$/.test(key) ? key : "")
    );
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(BOQ_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return {};
  }
}

function saveDraftToStorage(session, floors, rooms) {
  const key = projectKey(session?.project);
  if (!key || !session?.ref) return;
  const drafts = loadDrafts();
  drafts[key] = {
    session,
    floors,
    rooms,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function saveBoqDraftToStorage(boqDoc, session, floors, rooms, additionalLines) {
  const key = projectKey(session?.project);
  if (!key || !boqDoc?.ref) return;
  const drafts = loadBoqDrafts();
  drafts[key] = {
    boq: boqDoc,
    session,
    floors,
    rooms,
    additionalLines,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(BOQ_DRAFT_STORAGE_KEY, JSON.stringify(drafts));

  // BOQ supersedes in-progress QAS draft for the same project
  const qasDrafts = loadDrafts();
  if (qasDrafts[key]) {
    delete qasDrafts[key];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(qasDrafts));
  }
}

export function getBoqDraftForProject(projectId) {
  const key = projectKey(projectId);
  if (!key) return null;
  return loadBoqDrafts()[key] || null;
}

export function removeBoqDraftForProject(projectId) {
  const key = projectKey(projectId);
  if (!key) return;
  const drafts = loadBoqDrafts();
  if (!drafts[key]) return;
  delete drafts[key];
  localStorage.setItem(BOQ_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function mapBoqDraftEntry(projectId, entry) {
  const apiBoqId = resolveApiBoqId(entry.boq);
  return {
    projectId,
    boqRef: entry.boq?.ref || projectId,
    apiBoqId,
    qasRef: entry.boq?.qasRef || entry.session?.ref,
    projectName: entry.session?.project?.projectName || entry.session?.project?.name || "Unknown project",
    status: entry.boq?.status || BOQ_STATUS.DRAFT,
    savedAt: entry.savedAt || entry.boq?.savedAt || entry.boq?.generatedAt,
    grandTotal: entry.boq?.totals?.grandTotal ?? 0,
    entry,
  };
}

export function listStoredBoqDrafts() {
  const raw = loadBoqDrafts();
  return Object.entries(raw)
    .map(([projectId, entry]) => mapBoqDraftEntry(projectId, entry))
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
}

export async function syncLocalBoqDraftsWithServer() {
  const localDrafts = loadBoqDrafts();
  const projectIds = Object.keys(localDrafts);
  if (!projectIds.length) return;

  await Promise.all(
    projectIds.map(async (projectId) => {
      const entry = localDrafts[projectId];
      if (!entry) return;

      try {
        const boqs = await fetchBoqsByProject(projectId);
        const { live } = splitProjectBoqs(boqs);
        if (!live) return;

        const localApiId = resolveApiBoqId(entry.boq);
        if (localApiId && String(live.id) !== String(localApiId)) return;

        if (isBoqApproved(live.status)) {
          removeBoqDraftForProject(projectId);
          return;
        }

        const syncedDoc = apiBoqToDocument(live, entry.session);
        saveBoqDraftToStorage(
          syncedDoc,
          entry.session,
          entry.floors,
          entry.rooms,
          entry.additionalLines
        );
      } catch (err) {
        console.error(`Failed to sync BOQ draft for project ${projectId}`, err);
      }
    })
  );
}

export function listStoredQasDrafts() {
  const boqProjectIds = new Set(listStoredBoqDrafts().map((d) => String(d.projectId)));
  const raw = loadDrafts();
  return Object.entries(raw)
    .filter(([projectId]) => !boqProjectIds.has(String(projectId)))
    .map(([projectId, entry]) => ({
      projectId,
      qasRef: entry.session?.ref || projectId,
      projectName: entry.session?.project?.projectName || entry.session?.project?.name || "Unknown project",
      status: entry.session?.status || QAS_STATUS.IN_PROGRESS,
      savedAt: entry.savedAt || entry.session?.lastSaved,
      roomCount: (entry.rooms || []).length,
      entry,
    }))
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
}

export function getDraftsForProject(projectId, boqDrafts, qasDrafts) {
  const id = String(projectId);
  const boq = boqDrafts.find((d) => String(d.projectId) === id);
  const qas = qasDrafts.find((d) => String(d.projectId) === id);
  return {
    boq: boq ? [boq] : [],
    qas: qas ? [qas] : [],
  };
}

const QasContext = createContext(null);
export const useBoq = () => useContext(QasContext);
export const useQas = useBoq;

export function BoqProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentStep, setStep] = useState(1);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [additionalLines, setAdditionalLines] = useState([]);
  const [generatedBoq, setGeneratedBoq] = useState(null);
  const [savedBoqs, setSavedBoqs] = useState([]);
  const [saveNotice, setSaveNotice] = useState(null);
  const [apiBoqId, setApiBoqId] = useState(null);

  useEffect(() => {
    if (session?.ref && currentStep < 3) {
      saveDraftToStorage(session, floors, rooms);
    }
  }, [session, floors, rooms, currentStep]);

  const buildBoq = useCallback(
    (prevDoc = null, extraLines = additionalLines, status = BOQ_STATUS.DRAFT) => {
      const existing = getBoqDraftForProject(session?.project?.id);
      const baseDoc = prevDoc || existing?.boq || null;
      const lines = extraLines.length ? extraLines : (existing?.additionalLines || []);
      return generateBoqDocument(floors, rooms, session, lines, {
        ref: baseDoc?.ref,
        status: baseDoc?.status || status,
        generatedAt: baseDoc?.generatedAt || new Date().toISOString(),
        savedAt: baseDoc?.savedAt || null,
      });
    },
    [floors, rooms, session, additionalLines]
  );

  const applySyncedBoq = useCallback((syncedDoc, draftSession, draftFloors, draftRooms, draftLines) => {
    if (!syncedDoc) return;
    setGeneratedBoq(syncedDoc);
    setApiBoqId(resolveApiBoqId(syncedDoc));
    setSession((prev) =>
      prev || draftSession
        ? {
            ...(prev || draftSession),
            status: sessionStatusFromBoq(syncedDoc.status),
            lastSaved: new Date().toISOString(),
          }
        : null
    );
    if (draftFloors) setFloors(draftFloors);
    if (draftRooms) setRooms(draftRooms);
    if (draftLines) setAdditionalLines(draftLines);
  }, []);

  const startSession = useCallback(async (project) => {
    const key = projectKey(project);
    const existingBoq = getBoqDraftForProject(project);
    if (existingBoq) {
      if (existingBoq.boq && isBoqApproved(existingBoq.boq.status)) {
        removeBoqDraftForProject(project);
      } else {
        setSession(existingBoq.session);
        setFloors(existingBoq.floors || []);
        setRooms(existingBoq.rooms || []);
        setAdditionalLines(existingBoq.additionalLines || []);
        setGeneratedBoq(existingBoq.boq || null);
        setApiBoqId(resolveApiBoqId(existingBoq.boq));
        setStep(3);
        setSavedBoqs([]);
        setSaveNotice(null);
        return;
      }
    }

    const qasDrafts = loadDrafts();
    const existingQas = qasDrafts[key];
    if (existingQas) {
      setSession(existingQas.session);
      setFloors(existingQas.floors || []);
      setRooms(existingQas.rooms || []);
      setAdditionalLines([]);
      setGeneratedBoq(null);
      setStep(2);
      setSavedBoqs([]);
      setSaveNotice(null);
      return;
    }

    const ref = `QAS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    const nextSession = {
      ref,
      version: 1,
      project,
      status: QAS_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      lastSaved: new Date().toISOString(),
    };
    setSession(nextSession);
    setStep(2);
    setAdditionalLines([]);
    setGeneratedBoq(null);
    setSavedBoqs([]);
    setSaveNotice(null);

    let seeded = false;
    try {
      const seed = await fetchProjectQasSurveySeed(project?.id);
      const hydrated = await hydrateQasSurveySeed(seed);
      if (hydrated?.floors?.length) {
        setFloors(hydrated.floors);
        setRooms(hydrated.rooms || []);
        setSaveNotice("Pre-filled from issued site-visit estimate");
        saveDraftToStorage(nextSession, hydrated.floors, hydrated.rooms || []);
        seeded = true;
      }
    } catch (err) {
      console.error("Failed to load QAS survey seed", err);
    }

    if (!seeded) {
      setFloors([{ id: "floor-1", name: "Ground Floor" }]);
      setRooms([]);
    }
  }, []);

  const resumeSession = useCallback((draft) => {
    if (!draft?.session) return;
    if (draft.boq && isBoqApproved(draft.boq.status)) {
      removeBoqDraftForProject(draft.session?.project);
      setSaveNotice("This BOQ is approved and locked. Open it from the project or BOQ inbox.");
      return;
    }
    setSession(draft.session);
    setFloors(draft.floors || []);
    setRooms(draft.rooms || []);
    setAdditionalLines(draft.additionalLines || []);
    setGeneratedBoq(draft.boq || null);
    setApiBoqId(resolveApiBoqId(draft.boq));
    setStep(draft.boq ? 3 : 2);
    setSaveNotice(null);
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

  const markBoqDraft = useCallback(() => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: QAS_STATUS.DRAFT,
            lastSaved: new Date().toISOString(),
          }
        : null
    );
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
    setAdditionalLines([]);
    setGeneratedBoq(null);
    setSavedBoqs([]);
    setSaveNotice(null);
  }, []);

  const generateBoq = useCallback(() => {
    const existing = getBoqDraftForProject(session?.project?.id);
    const extra = additionalLines.length ? additionalLines : (existing?.additionalLines || []);
    if (existing?.additionalLines?.length && additionalLines.length === 0) {
      setAdditionalLines(existing.additionalLines);
    }
    setGeneratedBoq((prev) => buildBoq(prev || existing?.boq, extra, BOQ_STATUS.DRAFT));
    markBoqDraft();
  }, [buildBoq, additionalLines, session, markBoqDraft]);

  const refreshBoqFromSurvey = useCallback(() => {
    setGeneratedBoq((prev) => buildBoq(prev, additionalLines, prev?.status || BOQ_STATUS.DRAFT));
  }, [buildBoq, additionalLines]);

  const addAdditionalLine = useCallback((overrides = {}) => {
    setAdditionalLines((prev) => {
      const next = [...prev, createAdditionalLine(overrides)];
      setGeneratedBoq((doc) => buildBoq(doc, next, doc?.status || BOQ_STATUS.DRAFT));
      return next;
    });
  }, [buildBoq]);

  const updateAdditionalLine = useCallback((lineId, patch) => {
    setAdditionalLines((prev) => {
      const next = prev.map((line) => {
        if (line.id !== lineId) return line;
        const merged = { ...line, ...patch };
        const qty = parseFloat(merged.qty) || 0;
        const rate = parseFloat(merged.rate) || 0;
        return { ...merged, amount: calcLineAmount(qty, rate) };
      });
      setGeneratedBoq((doc) => buildBoq(doc, next, doc?.status || BOQ_STATUS.DRAFT));
      return next;
    });
  }, [buildBoq]);

  const removeAdditionalLine = useCallback((lineId) => {
    setAdditionalLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      setGeneratedBoq((doc) => buildBoq(doc, next, doc?.status || BOQ_STATUS.DRAFT));
      return next;
    });
  }, [buildBoq]);

  const persistBoqDraft = useCallback(
    (saved) => {
      const payload = boqDocumentToApiPayload(saved, session);
      const persist = apiBoqId
        ? updateBoq(apiBoqId, { notes: payload.notes, lines: payload.lines })
        : saveBoqFromSurvey(payload);
      return persist
        .then((apiBoq) => {
          if (!apiBoq) return saved;
          const synced = apiBoqToDocument(apiBoq, session);
          saveBoqDraftToStorage(synced, session, floors, rooms, additionalLines);
          setApiBoqId(apiBoq.id);
          setGeneratedBoq(synced);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  status: sessionStatusFromBoq(synced.status),
                  lastSaved: new Date().toISOString(),
                }
              : null
          );
          return synced;
        });
    },
    [session, floors, rooms, additionalLines, apiBoqId]
  );

  const saveBoqDraft = useCallback(() => {
    setGeneratedBoq((current) => {
      if (!current) return current;
      const saved = {
        ...current,
        status: BOQ_STATUS.DRAFT,
        savedAt: new Date().toISOString(),
      };
      saveBoqDraftToStorage(saved, session, floors, rooms, additionalLines);
      persistBoqDraft(saved)
        .then(() => setSaveNotice("BOQ draft saved to server."))
        .catch(() => setSaveNotice("BOQ saved locally (server sync failed)."));
      setSavedBoqs((list) => {
        const filtered = list.filter((b) => b.ref !== saved.ref);
        return [...filtered, saved];
      });
      markBoqDraft();
      return saved;
    });
  }, [session, floors, rooms, additionalLines, markBoqDraft, persistBoqDraft]);

  const submitBoqForApproval = useCallback(() => {
    setGeneratedBoq((current) => {
      if (!current) return current;
      const submitted = {
        ...current,
        savedAt: new Date().toISOString(),
      };
      saveBoqDraftToStorage(submitted, session, floors, rooms, additionalLines);
      const payload = boqDocumentToApiPayload(submitted, session);
      const saveThenSubmit = async () => {
        try {
          let id = apiBoqId;
          if (!id) {
            const created = await saveBoqFromSurvey(payload);
            id = created.id;
            setApiBoqId(id);
          } else {
            await updateBoq(id, { notes: payload.notes, lines: payload.lines });
          }
          const apiBoq = await submitBoqApi(id);
          const synced = apiBoqToDocument(apiBoq, session);
          saveBoqDraftToStorage(synced, session, floors, rooms, additionalLines);
          applySyncedBoq(synced, session, floors, rooms, additionalLines);
          setSaveNotice("BOQ submitted for Senior QS approval.");
        } catch (e) {
          setSaveNotice(e.response?.data?.message || "Failed to submit BOQ for approval.");
        }
      };
      saveThenSubmit();
      return submitted;
    });
  }, [session, floors, rooms, additionalLines, apiBoqId, applySyncedBoq]);

  const createRevision = useCallback(async (revisionLabel) => {
    if (!apiBoqId) return;
    try {
      const apiBoq = await createBoqRevision(apiBoqId, revisionLabel);
      const synced = apiBoqToDocument(apiBoq, session);
      saveBoqDraftToStorage(synced, session, floors, rooms, additionalLines);
      applySyncedBoq(synced, session, floors, rooms, additionalLines);
      setSaveNotice(`Revision v${apiBoq.version} created as draft.`);
    } catch (e) {
      setSaveNotice(e.response?.data?.message || "Failed to create revision.");
    }
  }, [apiBoqId, session, floors, rooms, additionalLines, applySyncedBoq]);

  const refreshBoqDraftsFromServer = useCallback(async () => {
    await syncLocalBoqDraftsWithServer();
    return listStoredBoqDrafts();
  }, []);

  const refreshActiveBoqFromServer = useCallback(async (boqIdOverride) => {
    const draft = getBoqDraftForProject(session?.project?.id);
    const id = boqIdOverride || apiBoqId || resolveApiBoqId(draft?.boq);
    if (!id) return null;
    try {
      const apiBoq = await fetchBoq(id);
      const synced = apiBoqToDocument(apiBoq, session);
      if (isBoqApproved(synced.status)) {
        removeBoqDraftForProject(session?.project);
      } else {
        saveBoqDraftToStorage(synced, session, floors, rooms, additionalLines);
      }
      applySyncedBoq(synced, session, floors, rooms, additionalLines);
      return synced;
    } catch (err) {
      console.error("Failed to refresh active BOQ from server", err);
      return null;
    }
  }, [apiBoqId, session, floors, rooms, additionalLines, applySyncedBoq]);

  const saveBoq = saveBoqDraft;

  const value = {
    session,
    currentStep,
    floors,
    setFloors,
    rooms,
    setRooms,
    additionalLines,
    generatedBoq,
    savedBoqs,
    saveNotice,
    setSaveNotice,
    startSession,
    resumeSession,
    loadDrafts,
    loadBoqDrafts,
    listStoredBoqDrafts,
    listStoredQasDrafts,
    refreshBoqDraftsFromServer,
    refreshActiveBoqFromServer,
    getDraftsForProject,
    getBoqDraftForProject,
    goToStep,
    nextStep,
    prevStep,
    markBoqDraft,
    completeSession,
    resetSession,
    generateBoq,
    refreshBoqFromSurvey,
    addAdditionalLine,
    updateAdditionalLine,
    removeAdditionalLine,
    saveBoqDraft,
    submitBoqForApproval,
    createRevision,
    apiBoqId,
    saveBoq,
  };

  return <QasContext.Provider value={value}>{children}</QasContext.Provider>;
}
