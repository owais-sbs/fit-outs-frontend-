import { BOQ_CATEGORIES, BOQ_STATUS } from "./boqDataUtils";

export function boqDocumentToApiPayload(doc, session) {
  const lines = (doc?.lines || []).map((line, idx) => ({
    categoryCode: line.categoryCode || mapParentToCategory(line.parent),
    categoryName: line.categoryName || line.parent || "Other Charges",
    description: line.description || "",
    unit: line.unitShort || line.unit || "lot",
    quantity: parseFloat(line.qty) || 0,
    rate: parseFloat(line.rate) || 0,
    floorLabel: line.floor || null,
    roomLabel: line.room || null,
    sortOrder: idx,
    source: line.source === "additional" ? "ADDITIONAL" : "SURVEY",
  }));

  return {
    projectId: Number(session?.project?.id),
    version: doc?.version || "1.0",
    notes: doc?.notes || null,
    lines,
  };
}

function mapParentToCategory(parent) {
  const match = BOQ_CATEGORIES.find((c) => c.name === parent);
  return match?.code || "OTHER";
}

export function apiBoqToDocument(apiBoq, session) {
  const lines = (apiBoq.lines || []).map((line, idx) => ({
    id: line.id || `api-${idx}`,
    source: line.source === "ADDITIONAL" ? "additional" : "qas",
    sr: idx + 1,
    categoryCode: line.categoryCode,
    categoryName: line.categoryName,
    parent: line.categoryName,
    description: line.description,
    unit: line.unit,
    unitShort: line.unit,
    qty: line.quantity,
    rate: line.rate,
    amount: line.amount,
    floor: line.floorLabel,
    room: line.roomLabel,
  }));

  return {
    ref: apiBoq.id,
    apiId: apiBoq.id,
    status: apiBoq.status || BOQ_STATUS.DRAFT,
    version: apiBoq.version || "1.0",
    revisionLabel: apiBoq.revisionLabel,
    parentBoqId: apiBoq.parentBoqId,
    currentApprovalStep: apiBoq.currentApprovalStep,
    lastRejectionComment: apiBoq.lastRejectionComment,
    submittedAt: apiBoq.submittedAt,
    approvedAt: apiBoq.approvedAt,
    qasRef: session?.ref || "—",
    generatedAt: apiBoq.createdAt,
    savedAt: apiBoq.updatedAt,
    project: session?.project || { id: apiBoq.projectId },
    lines,
    totals: {
      subtotal: apiBoq.subtotal,
      vat: apiBoq.vatAmount,
      grandTotal: apiBoq.grandTotal,
      vatRate: 0.05,
    },
    currency: "AED",
  };
}
