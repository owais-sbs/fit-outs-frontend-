import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

export function normalizeSubcontractor(item = {}) {
  return {
    id: String(item.id),
    fullName: item.fullName || "",
    email: item.email || "",
    phone: item.phone || "",
    companyName: item.companyName || "",
    active: item.active ?? true,
    roles: item.roles || [],
  };
}

export const fetchAllSubcontractors = () =>
  axiosInstance
    .get("/accounts/role/SUBCONTRACTOR")
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return (Array.isArray(data) ? data : []).map(normalizeSubcontractor);
    });

export const fetchScPackages = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/sc-packages`).then(unwrap);

export const createScPackage = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages`, payload).then(unwrap);

export const updateScPackage = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/sc-packages/${uuid}`, payload).then(unwrap);

export const deleteScPackage = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/sc-packages/${uuid}`).then(unwrap);

export const appointScPackage = (projectId, uuid, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages/${uuid}/appoint`, payload).then(unwrap);

export const generateScPackagesFromBoq = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages/generate-from-boq`).then(unwrap);

export const fetchProjectScClaims = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/sc-claims`).then(unwrap);

export const approveScClaim = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/sc-claims/${uuid}/approve`).then(unwrap);

export const rejectScClaim = (projectId, uuid, reason) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-claims/${uuid}/reject`, reason ? { reason } : {})
    .then(unwrap);

export const fetchMyScPackages = () =>
  axiosInstance.get(`/subcontractor/my-packages`).then(unwrap);

export const fetchMyScProjects = () =>
  axiosInstance.get(`/subcontractor/my-projects`).then(unwrap);

export const fetchMyScProject = (projectId) =>
  axiosInstance.get(`/subcontractor/projects/${projectId}`).then(unwrap);

export const acceptScPackage = (packageUuid) =>
  axiosInstance.post(`/subcontractor/packages/${packageUuid}/accept`).then(unwrap);

export const fetchPackageClaims = (packageUuid) =>
  axiosInstance.get(`/subcontractor/packages/${packageUuid}/claims`).then(unwrap);

export const createScClaim = (packageUuid, payload) =>
  axiosInstance.post(`/subcontractor/packages/${packageUuid}/claims`, payload).then(unwrap);

export const submitScClaim = (claimUuid) =>
  axiosInstance.post(`/subcontractor/claims/${claimUuid}/submit`).then(unwrap);

export const uploadScClaimAttachment = (claimUuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/claims/${claimUuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => {
      if (r.data?.isSuccess === false) {
        const err = new Error(r.data?.error || r.data?.message || "Upload failed");
        err.response = r;
        throw err;
      }
      return r.data?.data ?? r.data;
    });
};

// Variations
export const fetchMyScVariations = () =>
  axiosInstance.get("/subcontractor/variations").then(unwrap);

export const createScVariation = (packageUuid, payload) =>
  axiosInstance.post(`/subcontractor/packages/${packageUuid}/variations`, payload).then(unwrap);

export const submitScVariation = (uuid) =>
  axiosInstance.post(`/subcontractor/variations/${uuid}/submit`).then(unwrap);

export const uploadScVariationAttachment = (uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/variations/${uuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => r.data?.data ?? r.data);
};

// Site reports (delay / issue / material)
export const fetchMyScSiteReports = (type) =>
  axiosInstance.get("/subcontractor/site-reports", { params: type ? { type } : {} }).then(unwrap);

export const createScSiteReport = (payload) =>
  axiosInstance.post("/subcontractor/site-reports", payload).then(unwrap);

// Invoices / payments
export const fetchMyScInvoices = () =>
  axiosInstance.get("/subcontractor/invoices").then(unwrap);

export const createScInvoice = (payload) =>
  axiosInstance.post("/subcontractor/invoices", payload).then(unwrap);

export const submitScInvoice = (uuid) =>
  axiosInstance.post(`/subcontractor/invoices/${uuid}/submit`).then(unwrap);

export const uploadScInvoiceAttachment = (uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/invoices/${uuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => r.data?.data ?? r.data);
};

// BOQ lines appointed to SC
export const fetchMyScBoqLines = (projectId) =>
  axiosInstance.get("/subcontractor/boq-lines", { params: projectId ? { projectId } : {} }).then(unwrap);

export const approveScVariation = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/sc-variations/${uuid}/approve`).then(unwrap);

export const rejectScVariation = (projectId, uuid, reason) =>
  axiosInstance.post(`/projects/${projectId}/sc-variations/${uuid}/reject`, reason ? { reason } : {}).then(unwrap);

export const approveScInvoice = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/sc-invoices/${uuid}/approve`).then(unwrap);

export const rejectScInvoice = (projectId, uuid, reason) =>
  axiosInstance.post(`/projects/${projectId}/sc-invoices/${uuid}/reject`, reason ? { reason } : {}).then(unwrap);

export const markScInvoicePaid = (projectId, uuid, paymentReference) =>
  axiosInstance.post(`/projects/${projectId}/sc-invoices/${uuid}/mark-paid`, { paymentReference }).then(unwrap);

// Company profile, compliance & workers
export const fetchScCompanyProfile = () =>
  axiosInstance.get("/subcontractor/company-profile").then(unwrap);

export const updateScCompanyProfile = (payload) =>
  axiosInstance.put("/subcontractor/company-profile", payload).then(unwrap);

export const fetchScTradeCategories = () =>
  axiosInstance.get("/subcontractor/company-profile/trade-categories").then(unwrap);

export const uploadScTradeLicence = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post("/subcontractor/company-profile/trade-licence/upload", fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const upsertScComplianceDoc = (docType, payload) =>
  axiosInstance.put(`/subcontractor/company-profile/compliance/${docType}`, payload).then(unwrap);

export const uploadScComplianceDoc = (docType, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/company-profile/compliance/${docType}/upload`, fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const fetchScWorkers = () =>
  axiosInstance.get("/subcontractor/workers").then(unwrap);

export const createScWorker = (payload) =>
  axiosInstance.post("/subcontractor/workers", payload).then(unwrap);

export const updateScWorker = (uuid, payload) =>
  axiosInstance.put(`/subcontractor/workers/${uuid}`, payload).then(unwrap);

export const deleteScWorker = (uuid) =>
  axiosInstance.delete(`/subcontractor/workers/${uuid}`).then(unwrap);

export const fetchScAppointmentEligibility = (accountId, packageUuid) =>
  axiosInstance
    .get(`/sc-companies/${accountId}/appointment-eligibility`, { params: { packageUuid } })
    .then(unwrap);

// Vendor list & prequalification (invite-only onboarding)
export const fetchScVendors = (status) =>
  axiosInstance
    .get("/subcontractors", { params: status ? { status } : {} })
    .then(unwrap);

export const fetchScVendor = (organizationUuid) =>
  axiosInstance.get(`/subcontractors/${organizationUuid}`).then(unwrap);

export const inviteScVendor = (payload) =>
  axiosInstance.post("/subcontractors/invite", payload).then(unwrap);

export const reviewScVendorPrequalification = (organizationUuid, payload) =>
  axiosInstance.put(`/subcontractors/${organizationUuid}/prequalification`, payload).then(unwrap);

export const fetchScPortalContext = () =>
  axiosInstance.get("/subcontractor/portal-context").then(unwrap);

export const updateScOrganizationExtension = (payload) =>
  axiosInstance.put("/subcontractor/organization-extension", payload).then(unwrap);

export const updateScBankDetail = (payload) =>
  axiosInstance.put("/subcontractor/bank-detail", payload).then(unwrap);

export const uploadScBankLetter = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post("/subcontractor/bank-detail/letter/upload", fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const fetchScCommunityAuthorities = () =>
  axiosInstance.get("/subcontractor/community-authorities").then(unwrap);

export const addScCommunityRegistration = (payload) =>
  axiosInstance.post("/subcontractor/community-registrations", payload).then(unwrap);

export const uploadScCommunityRegistrationFile = (uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/community-registrations/${uuid}/upload`, fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const deleteScCommunityRegistration = (uuid) =>
  axiosInstance.delete(`/subcontractor/community-registrations/${uuid}`).then(unwrap);

export const addScOrganizationReference = (payload) =>
  axiosInstance.post("/subcontractor/references", payload).then(unwrap);

export const updateScOrganizationReference = (uuid, payload) =>
  axiosInstance.put(`/subcontractor/references/${uuid}`, payload).then(unwrap);

export const deleteScOrganizationReference = (uuid) =>
  axiosInstance.delete(`/subcontractor/references/${uuid}`).then(unwrap);

export const uploadScOrgDocument = (code, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/organization-documents/${code}/upload`, fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const fetchScTeamMembers = () =>
  axiosInstance.get("/subcontractor/team").then(unwrap);

export const inviteScTeamMember = (payload) =>
  axiosInstance.post("/subcontractor/team/invite", payload).then(unwrap);

export const addScTeamMemberManually = (payload) =>
  axiosInstance.post("/subcontractor/team/manual-add", payload).then(unwrap);

export const updateScTeamMember = (uuid, payload) =>
  axiosInstance.put(`/subcontractor/team/${uuid}`, payload).then(unwrap);

// ── Wave 6: SC estimator tender portal ─────────────────────────────────────

export const fetchScRfqs = () =>
  axiosInstance.get("/subcontractor/tender/rfqs").then(unwrap);

export const fetchScRfq = (packageUuid) =>
  axiosInstance.get(`/subcontractor/tender/rfqs/${packageUuid}`).then(unwrap);

export const saveScQuoteDraft = (packageUuid, payload) =>
  axiosInstance.put(`/subcontractor/tender/rfqs/${packageUuid}/quote`, payload).then(unwrap);

export const submitScQuote = (packageUuid, quoteUuid) =>
  axiosInstance
    .post(`/subcontractor/tender/rfqs/${packageUuid}/quote/${quoteUuid}/submit`)
    .then(unwrap);

export const fetchScMyBids = () =>
  axiosInstance.get("/subcontractor/tender/bids").then(unwrap);

export const fetchScPackageBids = (packageUuid) =>
  axiosInstance.get(`/subcontractor/tender/rfqs/${packageUuid}/bids`).then(unwrap);

export const fetchScRfqClarifications = (packageUuid) =>
  axiosInstance.get(`/subcontractor/tender/rfqs/${packageUuid}/clarifications`).then(unwrap);

export const addScRfqClarification = (packageUuid, payload) =>
  axiosInstance.post(`/subcontractor/tender/rfqs/${packageUuid}/clarifications`, payload).then(unwrap);

// ── Wave 6: Staff tender management ────────────────────────────────────────

export const fetchScEligibleBidders = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-packages/${packageUuid}/tender/eligible-bidders`)
    .then(unwrap);

export const fetchScTenderBidders = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-packages/${packageUuid}/tender/bidders`)
    .then(unwrap);

export const addScTenderBidders = (projectId, packageUuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-packages/${packageUuid}/tender/bidders`, payload)
    .then(unwrap);

export const issueScRfq = (projectId, packageUuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-packages/${packageUuid}/tender/issue`, payload)
    .then(unwrap);

export const fetchScTenderComparison = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-packages/${packageUuid}/tender/comparison`)
    .then(unwrap);

export const fetchScTenderClarifications = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-packages/${packageUuid}/tender/clarifications`)
    .then(unwrap);

export const answerScTenderClarification = (projectId, packageUuid, clarificationUuid, payload) =>
  axiosInstance
    .post(
      `/projects/${projectId}/sc-packages/${packageUuid}/tender/clarifications/${clarificationUuid}/answer`,
      payload
    )
    .then(unwrap);

export const awardScPackage = (projectId, packageUuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-packages/${packageUuid}/tender/award`, payload)
    .then(unwrap);

export const fetchScAwardPack = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-packages/${packageUuid}/tender/award-pack`)
    .then(unwrap);

// ── Wave 7: SC commercial portal ───────────────────────────────────────────

export const fetchScCertificates = () =>
  axiosInstance.get("/subcontractor/commercial/certificates").then(unwrap);

export const fetchScRetention = () =>
  axiosInstance.get("/subcontractor/commercial/retention").then(unwrap);

export const fetchScBackCharges = () =>
  axiosInstance.get("/subcontractor/commercial/back-charges").then(unwrap);

export const acknowledgeScBackCharge = (uuid, dispute = false) =>
  axiosInstance
    .post(`/subcontractor/commercial/back-charges/${uuid}/acknowledge`, null, {
      params: { dispute },
    })
    .then(unwrap);

export const fetchScClaimTracker = () =>
  axiosInstance.get("/subcontractor/commercial/claim-tracker").then(unwrap);

// ── Wave 7: SC submittals & snags ──────────────────────────────────────────

export const fetchScSubmittals = () =>
  axiosInstance.get("/subcontractor/submittals").then(unwrap);

export const createScSubmittal = (payload) =>
  axiosInstance.post("/subcontractor/submittals", payload).then(unwrap);

export const fetchScSnags = () =>
  axiosInstance.get("/subcontractor/snags").then(unwrap);

// ── Wave 7: Staff commercial ───────────────────────────────────────────────

export const measureScClaim = (projectId, uuid, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-claims/${uuid}/measure`, payload).then(unwrap);

export const certifyScClaim = (projectId, uuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-claims/${uuid}/certify`, payload ?? {})
    .then(unwrap);

export const markScClaimPaid = (projectId, uuid, accountingRef) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-claims/${uuid}/mark-paid`, null, {
      params: accountingRef ? { accountingRef } : {},
    })
    .then(unwrap);

export const fetchProjectScCertificates = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/sc-certificates`).then(unwrap);

export const fetchProjectScRetention = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-retention`, { params: packageUuid ? { packageUuid } : {} })
    .then(unwrap);

export const fetchProjectScBackCharges = (projectId, packageUuid) =>
  axiosInstance
    .get(`/projects/${projectId}/sc-back-charges`, { params: packageUuid ? { packageUuid } : {} })
    .then(unwrap);

export const createProjectScBackCharge = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-back-charges`, payload).then(unwrap);

export const computeScScorecard = (organizationUuid, packageUuid) =>
  axiosInstance
    .post(`/subcontractors/${organizationUuid}/scorecard`, null, {
      params: packageUuid ? { packageUuid } : {},
    })
    .then(unwrap);

export const fetchScScorecards = () =>
  axiosInstance.get("/subcontractor/commercial/scorecard").then(unwrap);

export const fetchLatestScScorecard = (packageUuid) =>
  axiosInstance
    .get("/subcontractor/commercial/scorecard/latest", {
      params: packageUuid ? { packageUuid } : {},
    })
    .then(unwrap);

// ── Notification preferences ─────────────────────────────────────────────────

export const fetchScNotificationPrefs = () =>
  axiosInstance.get("/subcontractor/notification-prefs").then(unwrap);

export const updateScNotificationPrefs = (payload) =>
  axiosInstance.put("/subcontractor/notification-prefs", payload).then(unwrap);
