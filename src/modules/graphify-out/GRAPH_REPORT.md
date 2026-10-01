# Graph Report - modules  (2026-09-25)

## Corpus Check
- 504 files · ~278,844 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 50 file(s) not represented in the graph (top: (none) 50)

## Summary
- 2709 nodes · 12296 edges · 136 communities (94 shown, 42 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 370 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `874ceb88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProjectApprovalsPage.jsx
- ProjectBillingPage.jsx
- ref_lucide_react
- PostCompletionPanel.jsx
- QtoWorkspacePage.jsx
- d_onepath_jct_fit_outs_frontend_src_components_ui_input_input
- room-collab.api.js
- d_onepath_jct_fit_outs_frontend_src_components_ui_badge_badge
- subcontractor.api.js
- ApprovalsConfigurationPage.jsx
- d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardheader
- DirectorSidebar.jsx
- VisitDraftBoqEditor.jsx
- UsersPage.jsx
- BoqViewPage.jsx
- d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_pageshell
- d_onepath_jct_fit_outs_frontend_src_components_ui_card_card
- PipelinePage.jsx
- analytics-dashboard.js
- d_onepath_jct_fit_outs_frontend_src_components_ui_table_table
- VariationDetailPage.jsx
- TenantTable.jsx
- BoqEngine.jsx
- scPortalRoutes.jsx
- d_onepath_jct_fit_outs_frontend_src_shared_context_auth_context_useauth
- InternalReviewPage.jsx
- adminDesignTasks.js
- Step06BoqGeneration.jsx
- CrmReportsPage.jsx
- LeadDetailPage.jsx
- admin/api/projects.api.js
- ProjectSnagsPage.jsx
- ValidationInboxPage.jsx
- SiteVisitsPage.jsx
- MaterialPlanPage.jsx
- ProjectSchedulePage.jsx
- SiteVisitReportPage.jsx
- CalendarPage.jsx
- ReportsAnalytics.jsx
- WorkItemConfigurationPage.jsx
- ScheduleApplyWizard.jsx
- renovationChecklist.js
- VendorListPage.jsx
- EmployeeCalendarPage.jsx
- SiteVisitSchedulePage.jsx
- ProjectDetailPage.jsx
- site-visit-estimate.api.js
- buildAdminDashboardAnalytics.js
- RoughEstimateEditor.jsx
- SuperAdminShell.jsx
- admin/pages/dashboard.js
- ext_shared_context_auth_context_js
- site-visits.api.js
- clients/ClientDetailPage.jsx
- MaterialConfigurationPage.jsx
- BillingMilestoneInboxPage.jsx
- Step03RoomCreation.jsx
- boqPdfExport.js
- ContractSection.jsx
- AddEmployeePage.jsx
- ClientConversionForm.jsx
- ext_shared_utils_currency_js
- CpmGantt.jsx
- business-owner/pages/dashboard.js
- QualifiedLeadsPage.jsx
- RoomConfigurationPage.jsx
- ScTenderPanel.jsx
- boqDataUtils.js
- CommercialMatricesPage.jsx
- ScheduleReadinessStrip.jsx
- SubcontractorOrganizationExtrasPage.jsx
- SubcontractorClaimsPage.jsx
- SubcontractorCompanyProfilePage.jsx
- ProjectSubcontractorPage.jsx
- tenant-management-context.jsx
- SubcontractorRfqDetailPage.jsx
- SubcontractorWorkersPage.jsx
- client-conversion.service.js
- SiteEngineerDashboard.jsx
- AppendixMastersPage.jsx
- site-engineer-tasks.api.js
- VendorReviewDialog.jsx
- subcontractorOnboardingMock.js
- ClientEmailPage.jsx
- communication-logs.api.js
- SubcontractorClarificationsPage.jsx
- Step04Review.jsx
- set-password.js
- ScheduleHubPage.jsx
- checklists.api.js
- SubcontractorPortalContext.jsx
- RevisionRequestsPage.jsx
- SubcontractorProjectsPage.jsx
- BaselineVarianceTable.jsx
- designer/pages/dashboard.js
- mock-dashboard.js

## God Nodes (most connected - your core abstractions)
1. `unwrap()` - 124 edges
2. `PageHeader()` - 58 edges
3. `fetchAllProjects()` - 42 edges
4. `formatScStatus()` - 40 edges
5. `useProjectLifecycle()` - 36 edges
6. `dataOf()` - 35 edges
7. `fetchAllLeads()` - 35 edges
8. `unwrap()` - 34 edges
9. `SiteVisitReportPage()` - 30 edges
10. `fetchAllEmployees()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `WorkerForm()` --calls--> `resolveFileUrl()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/subcontractor/pages/SubcontractorWorkersPage.jsx → fit-outs-frontend-/src/modules/admin/api/documents.api.js
- `LeadSourcesPage()` --calls--> `fetchAllLeads()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/LeadSourcesPage.jsx → fit-outs-frontend-/src/modules/admin/api/leads.api.js
- `PermissionPreview()` --calls--> `roleLabel()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/subcontractor/pages/SubcontractorTeamPage.jsx → fit-outs-frontend-/src/modules/subcontractor/utils/scPortalRoles.js
- `ProjectApprovalsPage()` --calls--> `fetchApprovalsCatalog()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/approvals/ProjectApprovalsPage.jsx → fit-outs-frontend-/src/modules/admin/api/approvals-config.api.js
- `CreateProjectPage()` --calls--> `fetchApprovalsCatalog()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/CreateProjectPage.jsx → fit-outs-frontend-/src/modules/admin/api/approvals-config.api.js

## Import Cycles
- None detected.

## Communities (136 total, 42 thin omitted)

### Community 0 - "ProjectApprovalsPage.jsx"
Cohesion: 0.07
Nodes (71): addProjectApprovalCase(), assemblePack(), attachChecklistItem(), bindApprovalCaseAuthority(), createAuthority(), createCaseComment(), createCaseFee(), createCaseSubmission() (+63 more)

### Community 1 - "ProjectBillingPage.jsx"
Cohesion: 0.06
Nodes (68): approvePaymentRequest(), clientAcceptPaymentRequest(), clientRejectPaymentRequest(), createBillingMilestone(), deleteBillingMilestone(), fetchBillingMilestoneInbox(), fetchBillingMilestones(), fetchClientInvoices() (+60 more)

### Community 2 - "ref_lucide_react"
Cohesion: 0.10
Nodes (28): fetchFinalReport(), fetchPendingClientTasks(), fetchIssuedEstimatesForClient(), CRM_NAV_GROUPS, QasSummaryStats(), STAT_ITEMS, PROJECT_TYPES, AVATAR_COLORS (+20 more)

### Community 3 - "PostCompletionPanel.jsx"
Cohesion: 0.07
Nodes (50): archiveProject(), CLOSEOUT_ITEM_KEYS, commerciallyCloseProject(), confirmCloseoutAccounting(), confirmCloseoutFinalInvoice(), fetchCloseoutChecklist(), fetchFinalAccount(), saveCloseoutCarriedSnags() (+42 more)

### Community 4 - "QtoWorkspacePage.jsx"
Cohesion: 0.07
Nodes (55): generateBoqFromQto(), createProjectDocument(), deleteDocument(), deleteProjectDocument, fetchClientDocuments(), fetchDocumentVersions(), fetchProjectDocuments(), publishDocumentToClient() (+47 more)

### Community 5 - "d_onepath_jct_fit_outs_frontend_src_components_ui_input_input"
Cohesion: 0.11
Nodes (37): ProgressMaterialIssuesFields(), BoqChargesEditor(), canAddLine(), EMPTY_FORM, UNIT_OPTIONS, AddClientPage(), CLIENT_DOC_TYPES, pwStrength() (+29 more)

### Community 6 - "room-collab.api.js"
Cohesion: 0.08
Nodes (51): createCommunicationChannel(), emailItemToMessage(), ensureProjectClientChannel(), fetchChannelMessages(), fetchCommunicationsInbox(), markChannelRead(), normalizeChannelMessage(), normalizeInboxItem() (+43 more)

### Community 7 - "d_onepath_jct_fit_outs_frontend_src_components_ui_badge_badge"
Cohesion: 0.12
Nodes (36): acceptScPackage(), fetchMyScPackages(), d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_pagetitle, d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_surface, d_onepath_jct_fit_outs_frontend_src_components_ui_badge_badge, ext_components_ui_badge_jsx, roleDashboardCopy(), SubcontractorDashboard() (+28 more)

### Community 8 - "subcontractor.api.js"
Cohesion: 0.07
Nodes (54): acknowledgeScBackCharge(), appointScPackage(), completeScPackage(), computeScScorecard(), createPackageInspection(), createProjectScBackCharge(), createScInvoice(), createScSiteReport() (+46 more)

### Community 9 - "ApprovalsConfigurationPage.jsx"
Cohesion: 0.09
Nodes (48): catalogTimeout, createAuthority(), createCompanyRegistration(), createDocumentType(), createJurisdictionPack(), createPermitType(), createProjectNature(), createPropertyType() (+40 more)

### Community 10 - "d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardheader"
Cohesion: 0.12
Nodes (33): formatTaskType(), ROOM_TASK_TYPES, EMPTY_FORM, LeadIntakePage(), validate(), STATUS_VARIANT, PRIORITIES, STATUS_BADGES (+25 more)

### Community 11 - "DirectorSidebar.jsx"
Cohesion: 0.10
Nodes (40): DESIGN_OVERVIEW_SUB_ITEMS, FULL_ACCESS, isSchedulePath(), NAV_GROUPS, NavLinkItem(), PROCUREMENT_SUB_ITEMS, PROJECT_CONFIG_SUB_ITEMS, QS_ROLES (+32 more)

### Community 12 - "VisitDraftBoqEditor.jsx"
Cohesion: 0.09
Nodes (49): applySavedLinesToSelections(), fetchProjectQasSurveySeed(), hydrateQasSurveySeed(), unwrap(), fetchRoomTypeById(), attachScopeMetadataToRooms(), LINE_SOURCE, matchRoomTypeByName() (+41 more)

### Community 13 - "UsersPage.jsx"
Cohesion: 0.10
Nodes (42): resendEmployeeInvite(), formatDate(), ProjectTable(), getAllLeads(), LEAD_SOURCES, AVATAR_HEX, avatarUrl(), ClientsPage() (+34 more)

### Community 14 - "BoqViewPage.jsx"
Cohesion: 0.12
Nodes (34): approveBoq(), fetchBoq(), fetchBoqApprovalHistory(), fetchBoqInbox(), fetchCompanyBoqPortfolio(), rejectBoq(), BoqApprovalInboxPage(), formatDate() (+26 more)

### Community 15 - "d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_pageshell"
Cohesion: 0.10
Nodes (28): fetchAllProjects(), fetchProjectRoomTasks(), ApprovalModal(), DesignCard(), formatDate(), RevisionModal(), CONFIG, StatusBadge() (+20 more)

### Community 16 - "d_onepath_jct_fit_outs_frontend_src_components_ui_card_card"
Cohesion: 0.11
Nodes (14): ConversionTimeline(), formatDate(), TYPE_COLORS, TYPE_ICONS, formatDate(), SiteVisitSummaryCard(), VISIT_VARIANTS, FLOOR_SUGGESTIONS (+6 more)

### Community 17 - "PipelinePage.jsx"
Cohesion: 0.08
Nodes (32): LeadCard(), PRIORITY_VARIANT, COLUMN_COLORS, PipelineColumn(), formatDate(), ProjectDetailDrawer(), INITIAL_LEADS, LEAD_DETAIL_EXTRA (+24 more)

### Community 18 - "analytics-dashboard.js"
Cohesion: 0.07
Nodes (33): d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_activedot, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_area, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_dot, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_evilareachart, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_grid, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_legend, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_tooltip, d_onepath_jct_fit_outs_frontend_src_components_evilcharts_charts_area_chart_xaxis (+25 more)

### Community 19 - "d_onepath_jct_fit_outs_frontend_src_components_ui_table_table"
Cohesion: 0.15
Nodes (25): ConversionSuccessModal(), NegotiationSummaryCard(), ReadyForConversionTable(), ClientConversionPage(), formatDate(), STATUS_CLASS, formatCurrencyNullable(), MOVEMENT_TYPES (+17 more)

### Community 20 - "VariationDetailPage.jsx"
Cohesion: 0.12
Nodes (33): clientApproveVariation(), clientRejectVariation(), createVariation(), fetchProjectCommercial(), fetchProjectVariations(), fetchVariation(), fetchVariationBoqAudit(), fetchVariationTriageInbox() (+25 more)

### Community 21 - "TenantTable.jsx"
Cohesion: 0.07
Nodes (29): COLOR_MAP, COLORS, LeadSourcesPage(), SOURCE_ICONS, StatCard(), StatCardSkeleton(), TenantManagementPanels(), TenantQuickActions() (+21 more)

### Community 22 - "BoqEngine.jsx"
Cohesion: 0.11
Nodes (34): createBoqRevision(), saveBoqFromSurvey(), submitBoq(), updateBoq(), apiBoqToDocument(), boqDocumentToApiPayload(), mapParentToCategory(), parseWorkItemIdFromLineKey() (+26 more)

### Community 23 - "scPortalRoutes.jsx"
Cohesion: 0.10
Nodes (32): ScPortalGate(), isNavActive(), SubcontractorSidebar(), useSubcontractorPortal(), ScPlaceholderPage(), DIMENSIONS, formatScore(), scoreColor() (+24 more)

### Community 24 - "d_onepath_jct_fit_outs_frontend_src_shared_context_auth_context_useauth"
Cohesion: 0.15
Nodes (18): NotificationDropdown(), timeAgo(), TYPE_CONFIG, ClientNavbar(), ClientSidebar(), d_onepath_jct_fit_outs_frontend_src_components_ui_dropdown_menu_dropdownmenulabel, d_onepath_jct_fit_outs_frontend_src_components_ui_dropdown_menu_dropdownmenuseparator, d_onepath_jct_fit_outs_frontend_src_components_ui_separator_separator (+10 more)

### Community 25 - "InternalReviewPage.jsx"
Cohesion: 0.08
Nodes (25): CLIENT_APPROVALS, COMPLETED_DESIGNS, DESIGN_REQUESTS, DESIGNERS, IN_PROGRESS_DESIGNS, INTERNAL_REVIEW_ITEMS, KANBAN_COLUMNS, REVISION_REQUESTS (+17 more)

### Community 26 - "adminDesignTasks.js"
Cohesion: 0.13
Nodes (27): useAdminDesignApprovals(), useAdminDesignOptions(), useAdminDesignRequests(), adminTaskDetailRoute(), fetchAdminDesignApprovals(), fetchAdminDesignOptions(), fetchAdminDesignRequests(), fetchAdminDesignTasks() (+19 more)

### Community 27 - "Step06BoqGeneration.jsx"
Cohesion: 0.15
Nodes (23): admin_pages_boq_boqdatautils_buildroomdetailrows, admin_pages_boq_boqdatautils_calcwallsqmtr, getQasStats(), admin_pages_boq_boqdatautils_getwallsforroom, admin_pages_boq_boqdatautils_unitlabel, BoqDocumentFooter(), BoqDocumentHeader(), BoqMetaBar() (+15 more)

### Community 28 - "CrmReportsPage.jsx"
Cohesion: 0.08
Nodes (27): CRM_REPORT_KPIS, LEAD_SOURCE_CONFIG, LEAD_SOURCE_DATA, PIPELINE_PERF_CONFIG, PIPELINE_PERF_DATA, TEAM_PERF_CONFIG, TEAM_PERF_DATA, EXTENDED_ICONS (+19 more)

### Community 29 - "LeadDetailPage.jsx"
Cohesion: 0.11
Nodes (21): assignLead(), convertLeadToClient(), createLead(), createLeadAccount(), fetchLeadById(), normalizeLead(), SOURCE_DISPLAY, STATUS_TO_LABEL (+13 more)

### Community 30 - "admin/api/projects.api.js"
Cohesion: 0.13
Nodes (21): fetchMineAssignedProjects(), normalizeProject(), updateProject(), fetchMyScheduleActivities(), fetchMySiteVisits(), EmployeeDashboard(), fmtDate(), STATUS_BADGE (+13 more)

### Community 31 - "ProjectSnagsPage.jsx"
Cohesion: 0.16
Nodes (27): fetchProjectRooms(), fetchProjectSchedule(), approveClientSnag(), createClientSnag(), createSnag(), deleteSnag(), fetchClientSnags(), fetchProjectSnags() (+19 more)

### Community 32 - "ValidationInboxPage.jsx"
Cohesion: 0.17
Nodes (27): approveScClaim(), approveScInvoice(), approveScVariation(), markScInvoicePaid(), rejectScClaim(), rejectScInvoice(), rejectScVariation(), approveValidation() (+19 more)

### Community 33 - "SiteVisitsPage.jsx"
Cohesion: 0.17
Nodes (20): fetchAllLeads(), fetchAllSiteVisits(), CompletedVisitsPage(), admin_pages_index_dashboard, SiteVisitsPage(), VisitCard(), visitStatusLabel(), visitStatusVariant() (+12 more)

### Community 34 - "MaterialPlanPage.jsx"
Cohesion: 0.17
Nodes (24): exportMaterialPlanCsv(), generateMaterialPlan(), reserveMaterialPlan(), unwrap(), updateMaterialPlan(), createCrewAssignment(), createLabourCrew(), deleteCrewAssignment() (+16 more)

### Community 35 - "ProjectSchedulePage.jsx"
Cohesion: 0.21
Nodes (27): fetchMaterialPlan(), addScheduleDependency(), createScheduleActivity(), createScheduleActivityFromRoomTask(), createScheduleBaseline(), deleteScheduleActivity(), deleteScheduleDependency(), fetchActivityMaterialSummary() (+19 more)

### Community 36 - "SiteVisitReportPage.jsx"
Cohesion: 0.13
Nodes (27): sendSiteVisitEstimateEmail(), fetchSiteVisitByUuid(), fetchSiteVisitReport(), isVideoMediaUrl(), submitSiteVisitReport(), appendCustomItemToRoomScopes(), buildCustomChecklistItem(), checklistItemsFromScopes() (+19 more)

### Community 37 - "CalendarPage.jsx"
Cohesion: 0.10
Nodes (23): buildVisits(), CALENDAR_EMPLOYEES, CALENDAR_PROJECTS, CALENDAR_SITES, CALENDAR_VISITS, dateStr(), today(), VISIT_STATUSES (+15 more)

### Community 38 - "ReportsAnalytics.jsx"
Cohesion: 0.13
Nodes (25): AnalyticsToolbar(), KpiGrid(), CrmPerformanceSection(), KPI_ICONS, LeadConversionSection(), MonthlyTrendsSection(), ReportsMetricsTable(), RevenueAnalyticsSection() (+17 more)

### Community 39 - "WorkItemConfigurationPage.jsx"
Cohesion: 0.16
Nodes (22): fetchScopeTags(), cloneWorkItem(), createWorkItem(), createWorkItemMaster(), deleteWorkItem(), deleteWorkItemMaster(), fetchWorkItemById(), fetchWorkItemMasters() (+14 more)

### Community 40 - "ScheduleApplyWizard.jsx"
Cohesion: 0.12
Nodes (22): applyProgramme(), applySchedule(), fetchScheduleTemplate(), fetchScheduleTemplates(), fetchWorkCalendars(), previewProgramme(), previewSchedule(), suggestBoqMatches() (+14 more)

### Community 41 - "renovationChecklist.js"
Cohesion: 0.15
Nodes (24): createSiteVisit(), normalizeSiteVisit(), updateSiteVisitChecklistScope(), emptyFloor(), emptyRoom(), findFloorIndex(), findRoomIndex(), RoomChecklistScopeBuilder() (+16 more)

### Community 42 - "VendorListPage.jsx"
Cohesion: 0.13
Nodes (23): addScTeamMemberManually(), completePublicScRegistration(), createScPublicRegistrationLink(), fetchPublicScRegistrationInfo(), fetchScTeamMembers(), fetchScVendors(), inviteScTeamMember(), inviteScVendor() (+15 more)

### Community 43 - "EmployeeCalendarPage.jsx"
Cohesion: 0.12
Nodes (22): createClient(), fetchAllClients(), fetchClientById(), normalizeClient(), updateClient(), fetchEmployeeSiteVisits(), CreateProjectPage(), generateTempPassword() (+14 more)

### Community 44 - "SiteVisitSchedulePage.jsx"
Cohesion: 0.13
Nodes (21): googleMapsShareUrl(), isMapsShareUrl(), resolveLocationQuery(), unwrap(), addLocationDetails(), addDays(), addressFromNominatimResult(), DEFAULT_COORDINATES (+13 more)

### Community 45 - "ProjectDetailPage.jsx"
Cohesion: 0.16
Nodes (19): ASSIGNABLE_TEAM_ROLES, fetchProjectTeamAssignments(), normalizeTeamAssignment(), PROJECT_TEAM_ROLES, syncProjectTeamAssignments(), unwrap(), fetchProjectById(), fetchAllSubcontractors() (+11 more)

### Community 46 - "site-visit-estimate.api.js"
Cohesion: 0.16
Nodes (19): applyAllScopeToSelections(), applyScopePreselection(), buildCustomWorkSelections(), buildScopedChecklistSelections(), clearVisitCoverSignature(), clearVisitCoverStamp(), fetchSiteVisitEstimate(), flattenSurveyToEstimateLines() (+11 more)

### Community 47 - "buildAdminDashboardAnalytics.js"
Cohesion: 0.14
Nodes (24): assigneeIdOf(), assigneeNameOf(), buildAdminDashboardAnalytics(), endOfDay(), formatBudget(), inRange(), lastNMonthKeys(), leadActivityDate() (+16 more)

### Community 48 - "RoughEstimateEditor.jsx"
Cohesion: 0.15
Nodes (20): computeLineAmount(), computeSubtotal(), CoverLetterTemplate, styles, emptyLine(), RoughEstimateEditor(), admin_data_jctcoverlettercopy_formatestimateamount, formatEstimateDate() (+12 more)

### Community 49 - "SuperAdminShell.jsx"
Cohesion: 0.12
Nodes (17): AdminNavbar(), AdminSidebar(), canSee(), AdminLayout(), DirectorNavbar(), DirectorSidebar(), DirectorLayout(), d_onepath_jct_fit_outs_frontend_src_components_ui_sidebar_sidebarinset (+9 more)

### Community 50 - "admin/pages/dashboard.js"
Cohesion: 0.14
Nodes (20): AdminCrmDashboard(), defaultDateRange(), exportCsv(), EXTENDED_ICONS, STATUS_VARIANT, BAR_CONFIG, KPI_CONFIG, PIE_COLORS (+12 more)

### Community 51 - "ext_shared_context_auth_context_js"
Cohesion: 0.11
Nodes (16): ROLE_ROUTES, d_onepath_jct_fit_outs_frontend_src_components_brand_brandmark_brand_name, d_onepath_jct_fit_outs_frontend_src_components_brand_brandmark_jctlogotile, d_onepath_jct_fit_outs_frontend_src_components_brand_sessionbootloader_sessionbootloader, d_onepath_jct_fit_outs_frontend_src_components_ui_tooltip_tooltip, d_onepath_jct_fit_outs_frontend_src_components_ui_tooltip_tooltipcontent, d_onepath_jct_fit_outs_frontend_src_components_ui_tooltip_tooltiptrigger, ext_components_brand_brandmark_jsx (+8 more)

### Community 52 - "site-visits.api.js"
Cohesion: 0.20
Nodes (17): deleteCoverLetterSignature(), deleteCoverLetterStamp(), fetchCoverLetterBranding(), normalizeCoverLetterBranding(), uploadCoverLetterSignature(), uploadCoverLetterStamp(), fetchSiteVisitRecordings(), multipartConfig() (+9 more)

### Community 53 - "clients/ClientDetailPage.jsx"
Cohesion: 0.14
Nodes (14): createProject(), CLIENT_STATUSES, INITIAL_CALLS, INITIAL_CLIENTS, INITIAL_EMAIL_THREADS, AVATAR_HEX, avatarUrl(), ClientCallsPage() (+6 more)

### Community 54 - "MaterialConfigurationPage.jsx"
Cohesion: 0.17
Nodes (17): createMaterial(), createMaterialCategory(), deleteMaterial(), fetchMaterialCategories(), fetchMaterials(), updateMaterial(), updateMaterialCategory(), recordStockIssue() (+9 more)

### Community 55 - "BillingMilestoneInboxPage.jsx"
Cohesion: 0.16
Nodes (17): BILLING_DONE_STATUSES, BILLING_PENDING_INDEX, BILLING_PIPELINE_STEPS, billingApprovalHistory(), BillingApprovalPipeline(), BillingApprovalTimeline(), billingPipelineStepState(), fallbackLog() (+9 more)

### Community 56 - "Step03RoomCreation.jsx"
Cohesion: 0.16
Nodes (17): QAS_TOTAL_STEPS, ALL_SCOPE_ITEMS, buildRoomDetailRows(), calcWallSqMtr(), getScopeItemById(), migrateWallData(), normalizeWorkUnit(), PHASE (+9 more)

### Community 57 - "boqPdfExport.js"
Cohesion: 0.22
Nodes (16): downloadCoverLetterPdf(), exportCoverLetterPdfBlob(), addCanvasToPdf(), captureFullHeight(), downloadBoqPdf(), exportBoqPdfBlob(), LAYOUT_PROPS, measureElementHeight() (+8 more)

### Community 58 - "ContractSection.jsx"
Cohesion: 0.24
Nodes (16): resolveFileUrl(), adminSignPackageContract(), fetchPackageContract(), fetchScAwardPack(), fetchSubcontractorSignature(), isScAwardPackMissingError(), mapAwardPackToContract(), scApiError() (+8 more)

### Community 59 - "AddEmployeePage.jsx"
Cohesion: 0.17
Nodes (12): createEmployee(), defaultFeaturesForRole(), FEATURE_OPTIONS, FINANCIAL_FEATURES, INITIAL_EMPLOYEES, MATRIX_FEATURES, SITE_ENGINEER_FEATURES, AddEmployeePage() (+4 more)

### Community 60 - "ClientConversionForm.jsx"
Cohesion: 0.14
Nodes (12): ClientConversionForm(), INITIAL_FORM, validate(), MANAGERS, CONVERSION_STATUS, NEGOTIATION_STATUS, PAYMENT_METHODS, PRIORITIES (+4 more)

### Community 61 - "ext_shared_utils_currency_js"
Cohesion: 0.14
Nodes (9): ClientInfoCard(), formatDate(), NEG_VARIANTS, formatDate(), PAYMENT_VARIANTS, PaymentSummaryCard(), formatDate(), ProposalSummaryCard() (+1 more)

### Community 62 - "CpmGantt.jsx"
Cohesion: 0.14
Nodes (13): ApplyCascadeOverlay(), CpmGantt(), DAY_INITIALS, daysBetween(), DEFAULT_NON_WORKING, formatDate(), MONTH_DAY_BG, MONTH_HEADER_BG (+5 more)

### Community 63 - "business-owner/pages/dashboard.js"
Cohesion: 0.19
Nodes (7): businessOwnerDashboard(), d_onepath_jct_fit_outs_frontend_src_shared_components_ui_card_card, d_onepath_jct_fit_outs_frontend_src_shared_components_ui_card_cardcontent, d_onepath_jct_fit_outs_frontend_src_shared_components_ui_card_cardheader, d_onepath_jct_fit_outs_frontend_src_shared_components_ui_card_cardtitle, ext_shared_components_ui_card_js, qasDashboard()

### Community 64 - "QualifiedLeadsPage.jsx"
Cohesion: 0.17
Nodes (11): fetchAllEmployees(), fetchEmployeeById(), normalizeEmployee(), updateEmployee(), FollowUpsPage(), QualifiedLeadsPage(), STAGES, d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_searchinput (+3 more)

### Community 65 - "RoomConfigurationPage.jsx"
Cohesion: 0.30
Nodes (13): activateRoomType(), createRoomMaster(), createRoomType(), deactivateRoomType(), deleteRoomMaster(), deleteRoomType(), fetchRoomMasters(), fetchRoomTypes() (+5 more)

### Community 66 - "ScTenderPanel.jsx"
Cohesion: 0.24
Nodes (15): addScTenderBidders(), answerScTenderClarification(), awardScPackage(), fetchScEligibleBidders(), fetchScTenderBidders(), fetchScTenderClarifications(), fetchScTenderComparison(), issueScRfq() (+7 more)

### Community 67 - "boqDataUtils.js"
Cohesion: 0.22
Nodes (15): BOQ_CATEGORIES, computeBoqTotals(), CUSTOM_CATEGORY_VALUE, generateBoqDocument(), getCategoryName(), isBoqApproved(), isBoqLive(), isBoqObsolete() (+7 more)

### Community 68 - "CommercialMatricesPage.jsx"
Cohesion: 0.27
Nodes (13): approveCommercialTask(), exportCommercialApprovalsCsv(), fetchCommercialApprovalInbox(), fetchCommercialApprovalRun(), fetchCommercialMatrices(), rejectCommercialTask(), unwrap(), upsertCommercialMatrix() (+5 more)

### Community 69 - "ScheduleReadinessStrip.jsx"
Cohesion: 0.29
Nodes (13): fetchPlanningAudit(), fetchPlanningGates(), fetchPlanningStatus(), unwrap(), updatePlanningGates(), updatePlanningStatus(), ProjectPlanningSection(), statusBadge() (+5 more)

### Community 70 - "SubcontractorOrganizationExtrasPage.jsx"
Cohesion: 0.24
Nodes (14): addScCommunityRegistration(), addScOrganizationReference(), deleteScCommunityRegistration(), deleteScOrganizationReference(), fetchScCommunityAuthorities(), updateScBankDetail(), updateScOrganizationExtension(), uploadScBankLetter() (+6 more)

### Community 71 - "SubcontractorClaimsPage.jsx"
Cohesion: 0.25
Nodes (14): createScClaim(), fetchMyScAwardPack(), fetchPackageClaims(), fetchScClaimTracker(), submitScClaim(), uploadScClaimAttachment(), ClaimPipeline(), demoQtyForLine() (+6 more)

### Community 72 - "SubcontractorCompanyProfilePage.jsx"
Cohesion: 0.21
Nodes (12): fetchScCompanyProfile(), fetchScTradeCategories(), submitScPrequalificationReview(), updateScCompanyProfile(), uploadScComplianceDoc(), uploadScTradeLicence(), upsertScComplianceDoc(), APPLICABILITY_BADGE (+4 more)

### Community 73 - "ProjectSubcontractorPage.jsx"
Cohesion: 0.26
Nodes (13): certifyScClaim(), createScPackage(), fetchProjectScCertificates(), fetchProjectScClaims(), fetchScPackageBoqLines(), fetchScPackages(), fetchScTradePackages(), markScCertificatePayable() (+5 more)

### Community 74 - "tenant-management-context.jsx"
Cohesion: 0.19
Nodes (12): buildTenantRows(), createCsvRows(), normalizeTenant(), TenantManagementContext, TenantManagementProvider(), MODULES, PLAN_MODULES, PLANS (+4 more)

### Community 75 - "SubcontractorRfqDetailPage.jsx"
Cohesion: 0.27
Nodes (12): addScRfqClarification(), fetchScPackageBids(), fetchScRfq(), fetchScRfqClarifications(), saveScQuoteDraft(), submitScQuote(), d_onepath_jct_fit_outs_frontend_src_shared_demo_formdemodata_demoquotelinerates, formatDate() (+4 more)

### Community 76 - "SubcontractorWorkersPage.jsx"
Cohesion: 0.26
Nodes (12): createScWorker(), deleteScWorker(), fetchScWorkers(), updateScWorker(), uploadScWorkerDocument(), d_onepath_jct_fit_outs_frontend_src_shared_demo_formdemodata_demoworkerdocuments, emptyWorker(), SubcontractorWorkersPage() (+4 more)

### Community 77 - "client-conversion.service.js"
Cohesion: 0.29
Nodes (9): MANAGERS, READY_FOR_CONVERSION, RECENT_CONVERSIONS, admin_data_leads_sales_reps, useClientConversion(), convertClient(), delay(), fetchReadyLeads() (+1 more)

### Community 78 - "SiteEngineerDashboard.jsx"
Cohesion: 0.31
Nodes (10): fetchMySnags(), unwrap(), updateMySnagStatus(), fmtDate(), isOverdue(), SiteEngineerDashboard(), STATUS_BADGE, todayStr() (+2 more)

### Community 79 - "AppendixMastersPage.jsx"
Cohesion: 0.36
Nodes (9): createAppendixMaster(), deleteAppendixMaster(), fetchAppendixMasters(), normalizeAppendix(), updateAppendixMaster(), AppendixPicker(), AppendixMastersPage(), d_onepath_jct_fit_outs_frontend_src_components_ui_checkbox_checkbox (+1 more)

### Community 80 - "site-engineer-tasks.api.js"
Cohesion: 0.35
Nodes (11): isSiteEngineerRole(), SiteEngineerTaskAssignSection(), cancelSiteEngineerTask(), createSiteEngineerTask(), fetchMySiteEngineerTasks(), fetchProjectSiteEngineerTasks(), normalizeSiteEngineerTask(), unwrap() (+3 more)

### Community 81 - "VendorReviewDialog.jsx"
Cohesion: 0.25
Nodes (8): fetchScVendor(), reviewScVendorPrequalification(), APPLICABILITY_BADGE, formatStatus(), parseRejectedNotes(), REVIEW_STATUS_OPTIONS, STATUS_BADGE, VendorReviewDialog()

### Community 82 - "subcontractorOnboardingMock.js"
Cohesion: 0.36
Nodes (10): JctAdminSubcontractorApplicationDetailPage(), JctAdminSubcontractorApplicationsPage(), formatHistoryDate(), getApplicationById(), getStoredApplications(), readStore(), SEED_APPLICATIONS, updateApplicationStatus() (+2 more)

### Community 83 - "ClientEmailPage.jsx"
Cohesion: 0.33
Nodes (8): AVATAR_HEX, avatarHex(), avatarUrl(), ClientEmailPage(), fmtTime(), initials(), LABEL_COLORS, ThreadView()

### Community 84 - "communication-logs.api.js"
Cohesion: 0.44
Nodes (8): ClientCommunicationsHubPage(), fmtDateTime(), createCommunicationLog(), fetchClientPortalCommunicationLogs(), fetchMyCommunicationLogs(), fetchProjectCommunicationLogs(), normalizeCommLog(), unwrap()

### Community 85 - "SubcontractorClarificationsPage.jsx"
Cohesion: 0.43
Nodes (6): fetchScRfqs(), formatDate(), formatMoney(), SubcontractorAwardPacksPage(), formatDate(), SubcontractorClarificationsPage()

### Community 86 - "Step04Review.jsx"
Cohesion: 0.39
Nodes (7): buildRoomDetailRows(), calcWallSqMtr(), getWallsForRoom(), RoomReviewTable(), Step04Review(), UNIT_LABELS, unitLabel()

### Community 87 - "set-password.js"
Cohesion: 0.50
Nodes (6): completePasswordSetup(), requestPasswordSetupEmail(), unwrap(), validatePasswordSetupToken(), ForgotPasswordPage(), SetPasswordPage()

### Community 88 - "ScheduleHubPage.jsx"
Cohesion: 0.48
Nodes (5): loadMeta(), mapPool(), ScheduleHubPage(), statusChip(), weightedPercent()

### Community 89 - "checklists.api.js"
Cohesion: 0.53
Nodes (5): fetchAllChecklists(), fetchChecklistByUuid(), normalizeChecklistItem(), normalizeChecklistTemplate(), ChecklistsPage()

### Community 90 - "SubcontractorPortalContext.jsx"
Cohesion: 0.47
Nodes (5): fetchScPortalContext(), mapPortalContext(), restrictiveContext, SubcontractorPortalContext, SubcontractorPortalProvider()

### Community 91 - "RevisionRequestsPage.jsx"
Cohesion: 0.50
Nodes (3): formatDate(), RevisionCard(), STATUS_VARIANT

### Community 92 - "SubcontractorProjectsPage.jsx"
Cohesion: 0.90
Nodes (4): isActiveStatus(), isCompletedStatus(), normalizeStatus(), SubcontractorProjectsPage()

### Community 93 - "BaselineVarianceTable.jsx"
Cohesion: 0.83
Nodes (3): BaselineVarianceTable(), daysBetween(), parseDate()

## Knowledge Gaps
- **290 isolated node(s):** `catalogTimeout`, `getCompanySummary`, `deleteProjectDocument`, `STATUS_TO_LABEL`, `SOURCE_DISPLAY` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 543 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetchAllProjects()` connect `d_onepath_jct_fit_outs_frontend_src_components_layout_pageshell_pageshell` to `ProjectBillingPage.jsx`, `ref_lucide_react`, `PostCompletionPanel.jsx`, `d_onepath_jct_fit_outs_frontend_src_components_ui_input_input`, `BoqViewPage.jsx`, `admin/pages/dashboard.js`, `d_onepath_jct_fit_outs_frontend_src_components_ui_table_table`, `communication-logs.api.js`, `clients/ClientDetailPage.jsx`, `BoqEngine.jsx`, `BillingMilestoneInboxPage.jsx`, `MaterialConfigurationPage.jsx`, `VariationDetailPage.jsx`, `adminDesignTasks.js`, `ScheduleHubPage.jsx`, `admin/api/projects.api.js`, `ProjectSnagsPage.jsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `useProjectLifecycle()` connect `QtoWorkspacePage.jsx` to `ProjectApprovalsPage.jsx`, `ValidationInboxPage.jsx`, `MaterialPlanPage.jsx`, `ref_lucide_react`, `ProjectSchedulePage.jsx`, `ProjectBillingPage.jsx`, `room-collab.api.js`, `ProjectSubcontractorPage.jsx`, `ProjectDetailPage.jsx`, `BoqViewPage.jsx`, `VariationDetailPage.jsx`, `ProjectSnagsPage.jsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `fetchAllEmployees()` connect `QualifiedLeadsPage.jsx` to `ProjectSchedulePage.jsx`, `d_onepath_jct_fit_outs_frontend_src_components_ui_input_input`, `CalendarPage.jsx`, `d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardheader`, `EmployeeCalendarPage.jsx`, `SiteVisitSchedulePage.jsx`, `UsersPage.jsx`, `ProjectDetailPage.jsx`, `d_onepath_jct_fit_outs_frontend_src_components_ui_card_card`, `site-engineer-tasks.api.js`, `admin/pages/dashboard.js`, `d_onepath_jct_fit_outs_frontend_src_components_ui_table_table`, `LeadDetailPage.jsx`, `ProjectSnagsPage.jsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `catalogTimeout`, `getCompanySummary`, `deleteProjectDocument` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProjectApprovalsPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06867088607594937 - nodes in this community are weakly interconnected._
- **Should `ProjectBillingPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05664556962025316 - nodes in this community are weakly interconnected._
- **Should `ref_lucide_react` be split into smaller, more focused modules?**
  _Cohesion score 0.10181086519114688 - nodes in this community are weakly interconnected._