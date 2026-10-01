# Graph Report - fit-outs-frontend-  (2026-10-01)

## Corpus Check
- 640 files · ~351,773 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 68 file(s) not represented in the graph (top: (none) 65, .css 2, .ico 1)

## Summary
- 3557 nodes · 15636 edges · 168 communities (113 shown, 55 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 430 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ade66aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- room-collab.api.js
- ApprovalsConfigurationPage.jsx
- subcontractor.api.js
- useAuth
- App.js
- card.jsx
- MaterialPlanPage.jsx
- ProjectApprovalsPage.jsx
- button.jsx
- sidebar.tsx
- admin/api/projects.api.js
- table.jsx
- react
- radial-chart.tsx
- lucide-react
- area-chart.tsx
- variations.api.js
- bar-chart.tsx
- formatScStatus
- line-chart.tsx
- ValidationInboxPage.jsx
- dependencies
- formatCurrency
- react-router-dom
- boqDataUtils.js
- SiteVisitSchedulePage.jsx
- dialog.jsx
- Component map
- ProjectDocumentsPage.jsx
- tooltip.jsx
- ResourcePlanPage.jsx
- package.json
- ProjectSnagsPage.jsx
- BoqInvoiceTemplate.jsx
- cn
- SubcontractorPackageDetailPage.jsx
- ProjectCompletionPage.jsx
- ScheduleApplyWizard.jsx
- ProjectDetailPage.jsx
- buildAdminDashboardAnalytics.js
- SubcontractAgreementLetter.jsx
- BoqEngine.jsx
- SiteVisitReportPage.jsx
- Step01ProjectSelection.jsx
- DesignApprovalsPage.jsx
- ProjectSchedulePage.jsx
- useDirectorDashboard.js
- LeadDetailPage.jsx
- VisitDraftBoqEditor.jsx
- EmployeeCalendarPage.jsx
- ProjectBillingPage.jsx
- BoqViewPage.jsx
- renovationChecklist.js
- projectStore.js
- ReportsAnalytics.jsx
- scPortalRoutes.jsx
- PostCompletionPanel.jsx
- SiteVisitsPage.jsx
- ScheduleReadinessStrip.jsx
- super-admin/index.js
- subcontractor/pages/dashboard.js
- ClientEmailPage.jsx
- ProjectClientCommsPanel.jsx
- ClientProjectRoomsSection.jsx
- checkbox.jsx
- compilerOptions
- VariationsInboxPage.jsx
- admin/pages/dashboard.js
- site-visits.api.js
- ProjectSubcontractorPage.jsx
- Step03RoomCreation.jsx
- DrawingMeasureCanvas.jsx
- ClientApprovalPage.jsx
- ContractSection.jsx
- ProjectTeamAssignmentSection.jsx
- PlanningHubLayout.jsx
- ChannelChatPanel.jsx
- components.json
- Learn More
- CoverLetterStep.jsx
- CpmGantt.jsx
- ScTenderPanel.jsx
- SubcontractorClaimsPage
- src/index.js
- PackageDrawingsSection.jsx
- communication-logs.api.js
- TenantDetailPage.jsx
- VendorReviewDialog.jsx
- axiosInstance.js
- client-conversion.constants.js
- clients.api.js
- roles.js
- formDemoData.js
- SiteEngineerSiteVisitsPage.jsx
- ScheduleHubPage.jsx
- DurationExtensionInboxPage
- SuperAdminDashboard.jsx
- site-engineer-tasks.api.js
- axios
- EmployeesPage
- CalendarPage.jsx
- subcontractorOnboardingMock.js
- browserslist
- ClientDocumentsPage
- ProjectManagerDashboard
- BillingApprovalPipeline.jsx
- devDependencies
- CreateCompanyPage
- manifest.json
- billingMilestonePresets.js
- fetchMyScProjects
- routes.js
- scripts
- EmployeeDetailPage
- craco.config.js
- extends
- BaselineVarianceTable.jsx
- SKILL.md
- providers/index.js
- designer/pages/dashboard.js
- qasDashboard
- sales/pages/dashboard.js
- mock-dashboard.js
- users.js
- designWorkflowStore.js
- settings.js

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 296 edges
2. `react` - 295 edges
3. `Button` - 249 edges
4. `cn()` - 218 edges
5. `react-router-dom` - 187 edges
6. `Badge()` - 176 edges
7. `Card` - 156 edges
8. `PageShell()` - 144 edges
9. `CardContent` - 142 edges
10. `ROUTES` - 139 edges

## Surprising Connections (you probably didn't know these)
- `Component map` --references--> `EvilAreaChart()`  [INFERRED]
  .agents/prompts/super-admin-analytics-dashboard.md → src/components/evilcharts/charts/area-chart.tsx
- `Component map` --references--> `EvilBarChart()`  [INFERRED]
  .agents/prompts/super-admin-analytics-dashboard.md → src/components/evilcharts/charts/bar-chart.tsx
- `Component map` --references--> `EvilLineChart()`  [INFERRED]
  .agents/prompts/super-admin-analytics-dashboard.md → src/components/evilcharts/charts/line-chart.tsx
- `Component map` --references--> `EvilPieChart()`  [INFERRED]
  .agents/prompts/super-admin-analytics-dashboard.md → src/components/evilcharts/charts/pie-chart.tsx
- `Component map` --references--> `EvilRadialChart()`  [INFERRED]
  .agents/prompts/super-admin-analytics-dashboard.md → src/components/evilcharts/charts/radial-chart.tsx

## Import Cycles
- None detected.

## Communities (168 total, 55 thin omitted)

### Community 0 - "room-collab.api.js"
Cohesion: 0.15
Nodes (26): resolveCommunicationChannel(), approveRoomTask(), closeRoomTask(), createProjectRoom(), createRoomTask(), fetchRoomMessages(), fetchRoomTask(), fetchTaskMessages() (+18 more)

### Community 1 - "ApprovalsConfigurationPage.jsx"
Cohesion: 0.06
Nodes (72): DropdownMenuCheckboxItem, catalogTimeout, createAuthority(), createCompanyRegistration(), createDocumentType(), createJurisdictionPack(), createPermitType(), createProjectNature() (+64 more)

### Community 2 - "subcontractor.api.js"
Cohesion: 0.05
Nodes (88): multipartConfig(), addScCommunityRegistration(), addScOrganizationReference(), addScRfqClarification(), appointScPackage(), completePublicScRegistration(), completeScPackage(), computeScScorecard() (+80 more)

### Community 3 - "useAuth"
Cohesion: 0.16
Nodes (18): ProtectedRoute(), RoleRoute(), PORTAL_CONFIG, RolesManagement(), SuperAdminTopNav(), ROLE_LABELS, ROLE_PERMISSIONS, ROLES (+10 more)

### Community 4 - "App.js"
Cohesion: 0.02
Nodes (79): ProjectDrawingsPage, QtoWorkspacePage, SC_ADMIN, SC_ESTIMATOR, SC_QS, SC_SUPERVISOR, src_modules_admin_pages_boq_index_boqflowpage, src_modules_admin_pages_boq_index_boqviewpage (+71 more)

### Community 5 - "card.jsx"
Cohesion: 0.05
Nodes (46): Card, CardContent, CardDescription, CardHeader, CardTitle, ConversionTimeline(), formatDate(), TYPE_COLORS (+38 more)

### Community 6 - "MaterialPlanPage.jsx"
Cohesion: 0.08
Nodes (48): html2canvas, createMaterial(), createMaterialCategory(), deleteMaterial(), fetchMaterialCategories(), fetchMaterials(), updateMaterial(), updateMaterialCategory() (+40 more)

### Community 7 - "ProjectApprovalsPage.jsx"
Cohesion: 0.08
Nodes (68): src_components_ui_select_selectgroup, SelectLabel, addProjectApprovalCase(), assemblePack(), attachChecklistItem(), bindApprovalCaseAuthority(), createAuthority(), createCaseComment() (+60 more)

### Community 8 - "button.jsx"
Cohesion: 0.07
Nodes (70): AttachmentUploadField(), FillDemoDataButton(), Button, buttonVariants, Input, Label, labelVariants, src_components_ui_select_select (+62 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.06
Nodes (64): SidebarBrand(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+56 more)

### Community 10 - "admin/api/projects.api.js"
Cohesion: 0.09
Nodes (40): StatTile(), EmptyState(), loadingMessages, LoadingPanel(), usePrefersReducedMotion(), humanizeStatus(), normalizeStatus(), STATUS_VARIANT (+32 more)

### Community 11 - "table.jsx"
Cohesion: 0.10
Nodes (49): FilterToolbar(), SearchInput(), TableSkeleton(), Pagination(), PaginationContent, PaginationItem, PaginationLink(), PaginationNext() (+41 more)

### Community 12 - "react"
Cohesion: 0.14
Nodes (14): react, src_components_ui_accordion_accordion, AccordionContent, AccordionItem, AccordionTrigger, ConfigurationLayout(), PageHeader(), StatusBadge() (+6 more)

### Community 13 - "radial-chart.tsx"
Cohesion: 0.05
Nodes (60): recharts, ColorGradient(), ColorGradient(), DuotonePattern(), DuotoneReversePattern(), ColorGradient(), RadialColorGradient(), ColorGradientStyle() (+52 more)

### Community 14 - "lucide-react"
Cohesion: 0.24
Nodes (11): lucide-react, PageShell(), PageTitle(), Surface(), Badge(), badgeVariants, FOLDER_ORDER, DIMENSIONS (+3 more)

### Community 15 - "area-chart.tsx"
Cohesion: 0.04
Nodes (49): ActiveDot(), Area(), AreaActiveDotProp, AreaAnimationType, AreaChartContext, AreaChartContextValue, AreaDotProp, AreaProps (+41 more)

### Community 16 - "variations.api.js"
Cohesion: 0.22
Nodes (18): clientApproveVariation(), clientRejectVariation(), createVariation(), fetchProjectCommercial(), fetchProjectVariations(), fetchVariation(), fetchVariationBoqAudit(), submitVariationReview() (+10 more)

### Community 17 - "bar-chart.tsx"
Cohesion: 0.04
Nodes (48): motion, BarAnimationType, BarChartContext, BarChartContextValue, BarLayout, BarProps, BarShapeProps, BarVariant (+40 more)

### Community 18 - "formatScStatus"
Cohesion: 0.06
Nodes (37): acknowledgeScBackCharge(), createScInvoice(), createScSubmittal(), fetchMyScAwardPacks(), fetchMyScInvoices(), fetchScBackCharges(), fetchScCertificates(), fetchScMyBids() (+29 more)

### Community 19 - "line-chart.tsx"
Cohesion: 0.05
Nodes (44): ActiveDot(), bufferLineShape(), CurvePoint, CurveType, Dot(), DotProps, DrawableCurvePoint, EvilLineChart() (+36 more)

### Community 20 - "ValidationInboxPage.jsx"
Cohesion: 0.15
Nodes (31): acknowledgeScSiteReport(), approveScClaim(), approveScInvoice(), approveScVariation(), markScInvoicePaid(), rejectScClaim(), rejectScInvoice(), rejectScVariation() (+23 more)

### Community 21 - "dependencies"
Cohesion: 0.05
Nodes (44): dependencies, axios, class-variance-authority, clsx, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, dxf-viewer (+36 more)

### Community 22 - "formatCurrency"
Cohesion: 0.11
Nodes (24): ClientInfoCard(), formatDate(), NegotiationSummaryCard(), formatDate(), PaymentSummaryCard(), formatDate(), ProposalSummaryCard(), ReadyForConversionTable() (+16 more)

### Community 23 - "react-router-dom"
Cohesion: 0.21
Nodes (23): react-router-dom, Avatar, AvatarFallback, src_components_ui_dropdown_menu_dropdownmenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator (+15 more)

### Community 24 - "boqDataUtils.js"
Cohesion: 0.11
Nodes (33): applySavedLinesToSelections(), fetchProjectQasSurveySeed(), hydrateQasSurveySeed(), unwrap(), BrowseWorkItemRow(), WorkItemRow(), buildBoqLines(), computeBoqTotals() (+25 more)

### Community 25 - "SiteVisitSchedulePage.jsx"
Cohesion: 0.12
Nodes (24): leaflet, react-leaflet, googleMapsShareUrl(), isMapsShareUrl(), resolveLocationQuery(), unwrap(), addDays(), addressFromNominatimResult() (+16 more)

### Community 26 - "dialog.jsx"
Cohesion: 0.10
Nodes (28): src_components_ui_dialog_dialog, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, ConversionSuccessModal() (+20 more)

### Community 27 - "Component map"
Cohesion: 0.20
Nodes (12): Adding a new chart, Chart color mapping, Component map, Constraints, Example pattern (line chart), Super Admin Analytics Dashboard — Agent Prompt, DashboardAnalytics(), RevenueAnalyticsChart() (+4 more)

### Community 28 - "ProjectDocumentsPage.jsx"
Cohesion: 0.21
Nodes (22): createProjectDocument(), deleteDocument(), deleteProjectDocument, fetchClientDocuments(), fetchDocumentVersions(), fetchProjectDocuments(), fetchScDocuments(), publishDocumentToClient() (+14 more)

### Community 29 - "tooltip.jsx"
Cohesion: 0.08
Nodes (35): DensityToggle(), readStoredSidebarWidth(), SidebarInset(), SidebarProvider(), src_components_ui_tooltip_tooltip, TooltipContent, src_components_ui_tooltip_tooltipprovider, src_components_ui_tooltip_tooltiptrigger (+27 more)

### Community 30 - "ResourcePlanPage.jsx"
Cohesion: 0.15
Nodes (34): createCrewAssignment(), createLabourCrew(), createResourceAssignment(), createResourceType(), deleteCrewAssignment(), deleteLabourCrew(), deleteResourceAssignment(), deleteResourceType() (+26 more)

### Community 31 - "package.json"
Cohesion: 0.06
Nodes (31): name, private, version, autoprefixer, clsx, @craco/craco, @dnd-kit/utilities, postcss (+23 more)

### Community 32 - "ProjectSnagsPage.jsx"
Cohesion: 0.14
Nodes (29): fetchProjectRooms(), fetchProjectSchedule(), approveClientSnag(), createClientSnag(), createSnag(), deleteSnag(), fetchClientSnags(), fetchProjectSnags() (+21 more)

### Community 33 - "BoqInvoiceTemplate.jsx"
Cohesion: 0.12
Nodes (27): src_modules_admin_pages_boq_boqdatautils_buildroomdetailrows, src_modules_admin_pages_boq_boqdatautils_calcwallsqmtr, src_modules_admin_pages_boq_boqdatautils_getwallsforroom, src_modules_admin_pages_boq_boqdatautils_unitlabel, BoqDocumentFooter(), BoqDocumentHeader(), BoqMetaBar(), BoqInvoiceTemplate() (+19 more)

### Community 34 - "cn"
Cohesion: 0.05
Nodes (48): class-variance-authority, @dnd-kit/core, @dnd-kit/sortable, ProjectPageFrame(), ErrorState(), PageSkeleton(), AvatarImage, DropdownMenuRadioItem (+40 more)

### Community 35 - "SubcontractorPackageDetailPage.jsx"
Cohesion: 0.12
Nodes (23): acceptScPackage(), createScSiteReport(), fetchMyScAwardPack(), fetchMyScBoqLines(), fetchMyScPackages(), fetchMyScProject(), fetchMyScSiteReports(), fetchPackageInspections() (+15 more)

### Community 36 - "ProjectCompletionPage.jsx"
Cohesion: 0.14
Nodes (24): archiveProject(), CLOSEOUT_ITEM_KEYS, commerciallyCloseProject(), confirmCloseoutAccounting(), confirmCloseoutFinalInvoice(), fetchCloseoutChecklist(), fetchFinalAccount(), saveCloseoutCarriedSnags() (+16 more)

### Community 37 - "ScheduleApplyWizard.jsx"
Cohesion: 0.12
Nodes (23): fetchBoqsByProject(), applyProgramme(), applySchedule(), fetchScheduleTemplate(), fetchScheduleTemplates(), fetchWorkCalendars(), previewProgramme(), previewSchedule() (+15 more)

### Community 38 - "ProjectDetailPage.jsx"
Cohesion: 0.13
Nodes (26): PageBackLink(), Breadcrumbs(), ProjectPathLine(), SECTION_LABELS, sectionLabelFromPath(), updateProject(), fetchProgressReport(), unwrap() (+18 more)

### Community 39 - "buildAdminDashboardAnalytics.js"
Cohesion: 0.11
Nodes (28): CHART_PALETTE, CHART_PALETTE_DARKER, CHART_PALETTE_LIGHTER, chartPair(), assigneeIdOf(), assigneeNameOf(), buildAdminDashboardAnalytics(), endOfDay() (+20 more)

### Community 40 - "SubcontractAgreementLetter.jsx"
Cohesion: 0.13
Nodes (22): src_assets_jct_logo, CoverLetterTemplate, styles, formatEstimateDate(), JCT_COVER_LETTER, AWARD_BODY, boqLinesTotal(), formatQty() (+14 more)

### Community 41 - "BoqEngine.jsx"
Cohesion: 0.13
Nodes (36): createBoqRevision(), saveBoqFromSurvey(), submitBoq(), updateBoq(), apiBoqToDocument(), boqDocumentToApiPayload(), mapParentToCategory(), parseWorkItemIdFromLineKey() (+28 more)

### Community 42 - "SiteVisitReportPage.jsx"
Cohesion: 0.13
Nodes (28): fetchSiteVisitEstimate(), issueSiteVisitEstimate(), sendSiteVisitEstimateEmail(), fetchSiteVisitReport(), isVideoMediaUrl(), normalizeUploadedAttachment(), resolveSiteVisitFileUrl(), submitSiteVisitReport() (+20 more)

### Community 43 - "Step01ProjectSelection.jsx"
Cohesion: 0.10
Nodes (27): ACTION_COLORS, ACTION_ICONS, BoqApprovalTimeline(), formatDateTime(), getQasStats(), isBoqEditable(), QAS_STATUS, QAS_STEPS (+19 more)

### Community 44 - "DesignApprovalsPage.jsx"
Cohesion: 0.07
Nodes (45): CardFooter, fetchProjectRoomTasks(), useAdminDesignApprovals(), useAdminDesignOptions(), useAdminDesignRequests(), adminTaskDetailRoute(), fetchAdminDesignApprovals(), fetchAdminDesignOptions() (+37 more)

### Community 45 - "ProjectSchedulePage.jsx"
Cohesion: 0.19
Nodes (29): fetchMaterialPlan(), addScheduleDependency(), createScheduleActivity(), createScheduleActivityFromRoomTask(), createScheduleBaseline(), deleteScheduleActivity(), deleteScheduleDependency(), fetchActivityMaterialSummary() (+21 more)

### Community 46 - "useDirectorDashboard.js"
Cohesion: 0.12
Nodes (29): fetchCompanySummary(), fetchCompanyBoqPortfolio(), fetchStockBalances(), fetchStockMovements(), StockDashboardPage(), asList(), mapPortfolioBoqs(), useDirectorDashboard() (+21 more)

### Community 47 - "LeadDetailPage.jsx"
Cohesion: 0.18
Nodes (15): assignLead(), convertLeadToClient(), createLead(), createLeadAccount(), fetchLeadById(), normalizeLead(), SOURCE_DISPLAY, STATUS_TO_LABEL (+7 more)

### Community 48 - "VisitDraftBoqEditor.jsx"
Cohesion: 0.13
Nodes (30): fetchRoomTypeById(), applyAllScopeToSelections(), applyScopePreselection(), attachScopeMetadataToRooms(), buildCustomWorkSelections(), buildScopedChecklistSelections(), computeLineAmount(), computeSubtotal() (+22 more)

### Community 49 - "EmployeeCalendarPage.jsx"
Cohesion: 0.19
Nodes (17): fetchEmployeeSiteVisits(), buildGrid(), DAYS, ds(), EmployeeCalendarPage(), fmtDate(), MONTHS, PILL_COLOR (+9 more)

### Community 50 - "ProjectBillingPage.jsx"
Cohesion: 0.13
Nodes (32): approvePaymentRequest(), clientAcceptPaymentRequest(), clientRejectPaymentRequest(), createBillingMilestone(), deleteBillingMilestone(), fetchBillingMilestoneInbox(), fetchBillingMilestones(), getCompanySummary (+24 more)

### Community 51 - "BoqViewPage.jsx"
Cohesion: 0.21
Nodes (21): approveBoq(), fetchBoq(), fetchBoqApprovalHistory(), fetchBoqInbox(), rejectBoq(), BoqApprovalInboxPage(), formatDate(), BOQ_PIPELINE_STEPS (+13 more)

### Community 52 - "renovationChecklist.js"
Cohesion: 0.12
Nodes (27): emptyFloor(), emptyRoom(), findFloorIndex(), findRoomIndex(), RoomChecklistScopeBuilder(), mergeSuggestions(), WorkItemSuggestInput(), buildScopeRef() (+19 more)

### Community 53 - "projectStore.js"
Cohesion: 0.12
Nodes (16): MANAGERS, READY_FOR_CONVERSION, RECENT_CONVERSIONS, src_modules_admin_data_leads_sales_reps, useClientConversion(), ClientConversionPage(), formatDate(), convertClient() (+8 more)

### Community 54 - "ReportsAnalytics.jsx"
Cohesion: 0.14
Nodes (21): AnalyticsToolbar(), KPI_ICONS, MonthlyTrendsSection(), RevenueAnalyticsSection(), SiteVisitAnalyticsSection(), SubscriptionRevenueSection(), TenantGrowthSection(), CRM_PERFORMANCE_CONFIG (+13 more)

### Community 55 - "scPortalRoutes.jsx"
Cohesion: 0.15
Nodes (21): @testing-library/react, App(), formatDate(), SubcontractorDocumentsPage(), gate(), placeholderElement(), SC_PLACEHOLDER_ROUTES, SC_ROUTE_ROLES (+13 more)

### Community 56 - "PostCompletionPanel.jsx"
Cohesion: 0.11
Nodes (25): CommercialLifecycleBadge(), COMMERCIAL_LIFECYCLE, COMMERCIAL_LIFECYCLE_COLORS, COMMERCIAL_LIFECYCLE_LABELS, COMMERCIAL_LIFECYCLE_LIST, PAYMENT_STATUS, PAYMENT_STATUS_LIST, PAYMENT_STATUS_VARIANTS (+17 more)

### Community 57 - "SiteVisitsPage.jsx"
Cohesion: 0.20
Nodes (18): fetchAllLeads(), unwrapLeadPage(), fetchAllSiteVisits(), CompletedVisitsPage(), LeadSourcesPage(), SiteVisitsPage(), VisitCard(), visitStatusLabel() (+10 more)

### Community 58 - "ScheduleReadinessStrip.jsx"
Cohesion: 0.23
Nodes (15): fetchPlanningAudit(), fetchPlanningGates(), fetchPlanningStatus(), unwrap(), updatePlanningGates(), updatePlanningStatus(), PlanAreaReadyActions(), STATUS_BADGE (+7 more)

### Community 59 - "super-admin/index.js"
Cohesion: 0.11
Nodes (13): SuperAdminShell(), SuperAdminLayout(), PermissionsPage(), PlansPage(), ReportsPage(), SettingsPage(), SuperAdminPlaceholder(), formatDate() (+5 more)

### Community 60 - "subcontractor/pages/dashboard.js"
Cohesion: 0.09
Nodes (27): addScTeamMemberManually(), fetchScPortalContext(), fetchScTeamMembers(), inviteScTeamMember(), updateScTeamMember(), ScPortalGate(), mapPortalContext(), restrictiveContext (+19 more)

### Community 61 - "ClientEmailPage.jsx"
Cohesion: 0.18
Nodes (12): CLIENT_STATUSES, INITIAL_CALLS, INITIAL_CLIENTS, INITIAL_EMAIL_THREADS, AVATAR_HEX, avatarHex(), avatarUrl(), ClientEmailPage() (+4 more)

### Community 62 - "ProjectClientCommsPanel.jsx"
Cohesion: 0.19
Nodes (19): sockjs-client, @stomp/stompjs, createCommunicationChannel(), emailItemToMessage(), ensureProjectClientChannel(), fetchChannelMessages(), fetchCommunicationsInbox(), markChannelRead() (+11 more)

### Community 63 - "ClientProjectRoomsSection.jsx"
Cohesion: 0.16
Nodes (20): jspdf, fetchClientInvoices(), fetchFinalReport(), fetchPendingClientTasks(), fetchRoomTasks(), syncRoomsFromBoq(), fetchPublishedProjectSchedule(), FinalProjectPdfButton() (+12 more)

### Community 64 - "checkbox.jsx"
Cohesion: 0.30
Nodes (9): @radix-ui/react-checkbox, Checkbox, createAppendixMaster(), deleteAppendixMaster(), fetchAppendixMasters(), normalizeAppendix(), updateAppendixMaster(), AppendixPicker() (+1 more)

### Community 65 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+11 more)

### Community 66 - "VariationsInboxPage.jsx"
Cohesion: 0.23
Nodes (17): approveCommercialTask(), createCreditNote(), exportCommercialApprovalsCsv(), fetchCommercialApprovalInbox(), fetchCommercialApprovalRun(), fetchCommercialMatrices(), fetchCreditNotes(), rejectCommercialTask() (+9 more)

### Community 67 - "admin/pages/dashboard.js"
Cohesion: 0.05
Nodes (57): Bar(), Grid(), Legend(), Tooltip(), useBarChart(), XAxis(), YAxis(), BackgroundProps (+49 more)

### Community 68 - "site-visits.api.js"
Cohesion: 0.26
Nodes (14): addLocationDetails(), createSiteVisit(), fetchSiteVisitByUuid(), fetchSiteVisitRecordings(), normalizeRecording(), normalizeSiteVisit(), STATUS_TO_STAGE, updateSiteVisitChecklistScope() (+6 more)

### Community 69 - "ProjectSubcontractorPage.jsx"
Cohesion: 0.26
Nodes (13): certifyScClaim(), createScPackage(), fetchProjectScCertificates(), fetchProjectScClaims(), fetchScPackageBoqLines(), fetchScPackages(), fetchScTradePackages(), markScCertificatePayable() (+5 more)

### Community 70 - "Step03RoomCreation.jsx"
Cohesion: 0.18
Nodes (16): ALL_SCOPE_ITEMS, buildRoomDetailRows(), calcWallSqMtr(), getScopeItemById(), migrateWallData(), normalizeWorkUnit(), PHASE, ROOM_SUB_TYPES (+8 more)

### Community 71 - "DrawingMeasureCanvas.jsx"
Cohesion: 0.20
Nodes (15): dxf-viewer, react-pdf, three, createDxfWorker(), DrawingMeasureCanvas(), DXF_LOAD_PHASE_LABELS, MEASURE_TOOLS, safeDxfSubscribe() (+7 more)

### Community 72 - "ClientApprovalPage.jsx"
Cohesion: 0.24
Nodes (8): CLIENT_APPROVALS, ApprovalCard(), formatDate(), STATUS_ICONS, STATUS_VARIANT, TIMELINE_DOT, TIMELINE_TEXT, TimelineItem()

### Community 73 - "ContractSection.jsx"
Cohesion: 0.24
Nodes (16): resolveFileUrl(), adminSignPackageContract(), fetchPackageContract(), fetchScAwardPack(), fetchSubcontractorSignature(), isScAwardPackMissingError(), mapAwardPackToContract(), scApiError() (+8 more)

### Community 74 - "ProjectTeamAssignmentSection.jsx"
Cohesion: 0.17
Nodes (18): fetchAllEmployees(), ASSIGNABLE_TEAM_ROLES, fetchProjectTeamAssignments(), normalizeTeamAssignment(), PROJECT_TEAM_ROLES, syncProjectTeamAssignments(), unwrap(), fetchAllSubcontractors() (+10 more)

### Community 75 - "PlanningHubLayout.jsx"
Cohesion: 0.36
Nodes (8): PageHeader(), NAV, PlanningHubLayout(), projectDetailPath(), projectPlanningBackPath(), projectPlanningPath(), projectRoutesForPath(), projectSchedulePath()

### Community 76 - "ChannelChatPanel.jsx"
Cohesion: 0.58
Nodes (7): sendChannelMessage(), ChannelChatPanel(), CollabChatPanel(), fileHref(), fileLabel(), formatChatTime(), hasFileAttachment()

### Community 77 - "components.json"
Cohesion: 0.12
Nodes (15): aliases, components, hooks, lib, ui, utils, rsc, $schema (+7 more)

### Community 78 - "Learn More"
Cohesion: 0.12
Nodes (15): Advanced Configuration, Analyzing the Bundle Size, Available Scripts, Code Splitting, Deployment, fit-outs-frontend-, fit-outs-frontend-, Getting Started with Create React App (+7 more)

### Community 79 - "CoverLetterStep.jsx"
Cohesion: 0.22
Nodes (17): deleteCoverLetterSignature(), deleteCoverLetterStamp(), fetchCoverLetterBranding(), normalizeCoverLetterBranding(), uploadCoverLetterSignature(), uploadCoverLetterStamp(), clearVisitCoverSignature(), clearVisitCoverStamp() (+9 more)

### Community 80 - "CpmGantt.jsx"
Cohesion: 0.16
Nodes (11): react-dom, ApplyCascadeOverlay(), CpmGantt(), DAY_INITIALS, daysBetween(), DEFAULT_NON_WORKING, formatDate(), MONTH_DAY_BG (+3 more)

### Community 81 - "ScTenderPanel.jsx"
Cohesion: 0.24
Nodes (15): addScTenderBidders(), answerScTenderClarification(), awardScPackage(), fetchScEligibleBidders(), fetchScTenderBidders(), fetchScTenderClarifications(), fetchScTenderComparison(), issueScRfq() (+7 more)

### Community 82 - "SubcontractorClaimsPage"
Cohesion: 0.25
Nodes (9): createScClaim(), fetchPackageClaims(), fetchScClaimTracker(), submitScClaim(), demoQtyForLine(), emptyForm(), formatMoney(), priorClaimedForLine() (+1 more)

### Community 83 - "src/index.js"
Cohesion: 0.21
Nodes (10): sonner, web-vitals, Toaster(), root, reportWebVitals(), applyThemeClass(), readStoredTheme(), ThemeContext (+2 more)

### Community 84 - "PackageDrawingsSection.jsx"
Cohesion: 0.15
Nodes (17): generateBoqFromQto(), deleteProjectDrawing(), DRAWING_CATEGORIES, fetchDrawingPreviewBlob(), fetchDrawingRevisions(), fetchProjectDrawings(), reconvertProjectDrawing(), uploadProjectDrawing() (+9 more)

### Community 85 - "communication-logs.api.js"
Cohesion: 0.44
Nodes (8): ClientCommunicationsHubPage(), fmtDateTime(), createCommunicationLog(), fetchClientPortalCommunicationLogs(), fetchMyCommunicationLogs(), fetchProjectCommunicationLogs(), normalizeCommLog(), unwrap()

### Community 86 - "TenantDetailPage.jsx"
Cohesion: 0.13
Nodes (22): src_components_ui_tabs_tabs, TabsContent, TabsList, TabsTrigger, TenantManagementPanels(), buildTenantRows(), formatAdminEmails(), normalizeCompanyAdmins() (+14 more)

### Community 87 - "VendorReviewDialog.jsx"
Cohesion: 0.18
Nodes (17): AttachmentList(), PdfAttachmentPreview(), attachmentApiPath(), attachmentHref(), attachmentLabel(), clonePdfFile(), fetchAttachmentArrayBuffer(), isImagePath() (+9 more)

### Community 88 - "axiosInstance.js"
Cohesion: 0.14
Nodes (19): axiosInstance, fetchAllChecklists(), fetchChecklistByUuid(), normalizeChecklistItem(), normalizeChecklistTemplate(), activateRoomType(), createRoomMaster(), createRoomType() (+11 more)

### Community 89 - "client-conversion.constants.js"
Cohesion: 0.29
Nodes (6): CONVERSION_STATUS, NEGOTIATION_STATUS, PAYMENT_METHODS, PRIORITIES, PROPOSAL_STATUS, VISIT_STATUS

### Community 90 - "clients.api.js"
Cohesion: 0.17
Nodes (13): createClient(), fetchAllClients(), fetchClientById(), normalizeClient(), updateClient(), AddClientPage(), pwStrength(), avatarUrl() (+5 more)

### Community 91 - "roles.js"
Cohesion: 0.10
Nodes (22): createEmployee(), fetchEmployeeById(), normalizeEmployee(), updateEmployee(), defaultFeaturesForRole(), FINANCIAL_FEATURES, INITIAL_EMPLOYEES, MATRIX_FEATURES (+14 more)

### Community 92 - "formDemoData.js"
Cohesion: 0.22
Nodes (13): WorkerForm(), buildDemoClientSnagForm(), buildDemoDocumentUpload(), buildDemoDocumentVersionFile(), buildDemoSnagForm(), daysFromNow(), demoQuoteLineRates(), demoWorkerDocuments() (+5 more)

### Community 93 - "SiteEngineerSiteVisitsPage.jsx"
Cohesion: 0.27
Nodes (12): buildMonthCells(), fmtDate(), isCompleted(), isUpcoming(), monthLabel(), SiteEngineerSiteVisitsPage(), STATUS_BADGE, TAB (+4 more)

### Community 94 - "ScheduleHubPage.jsx"
Cohesion: 0.48
Nodes (5): loadMeta(), mapPool(), ScheduleHubPage(), statusChip(), weightedPercent()

### Community 95 - "DurationExtensionInboxPage"
Cohesion: 0.33
Nodes (6): approveDurationExtension(), fetchDurationExtensionInbox(), rejectDurationExtension(), DurationExtensionInboxPage(), formatDate(), reasonLabel()

### Community 96 - "SuperAdminDashboard.jsx"
Cohesion: 0.11
Nodes (27): fetchProjectById(), fetchIssuedEstimatesForClient(), DirectorDashboard(), ClientProjectDetailPage(), downloadBlob(), exportCompanyPnl(), exportProjectPnl(), fetchCompanyPnl() (+19 more)

### Community 97 - "site-engineer-tasks.api.js"
Cohesion: 0.27
Nodes (13): isSiteEngineerRole(), SiteEngineerTaskAssignSection(), cancelSiteEngineerTask(), createSiteEngineerTask(), fetchMySiteEngineerTasks(), fetchProjectSiteEngineerTasks(), normalizeSiteEngineerTask(), unwrap() (+5 more)

### Community 99 - "EmployeesPage"
Cohesion: 0.50
Nodes (4): resendEmployeeInvite(), avatarPalette(), EmployeesPage(), initials()

### Community 100 - "CalendarPage.jsx"
Cohesion: 0.11
Nodes (23): buildVisits(), CALENDAR_EMPLOYEES, CALENDAR_PROJECTS, CALENDAR_SITES, CALENDAR_VISITS, dateStr(), today(), VISIT_STATUSES (+15 more)

### Community 101 - "subcontractorOnboardingMock.js"
Cohesion: 0.36
Nodes (10): JctAdminSubcontractorApplicationDetailPage(), JctAdminSubcontractorApplicationsPage(), formatHistoryDate(), getApplicationById(), getStoredApplications(), readStore(), SEED_APPLICATIONS, updateApplicationStatus() (+2 more)

### Community 102 - "browserslist"
Cohesion: 0.67
Nodes (3): browserslist, development, production

### Community 103 - "ClientDocumentsPage"
Cohesion: 0.67
Nodes (3): ClientDocumentsPage(), formatDate(), groupByCategory()

### Community 105 - "BillingApprovalPipeline.jsx"
Cohesion: 0.31
Nodes (8): BILLING_DONE_STATUSES, BILLING_PENDING_INDEX, BILLING_PIPELINE_STEPS, billingApprovalHistory(), BillingApprovalTimeline(), billingPipelineStepState(), fallbackLog(), pipelineStepState()

### Community 106 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, @craco/craco, postcss, tailwindcss, tailwindcss-animate, @types/react, @types/react-dom (+1 more)

### Community 108 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 109 - "billingMilestonePresets.js"
Cohesion: 0.29
Nodes (6): buildMilestonesFromPreset(), CLIENT_PAYMENT_SCHEDULE_PRESETS, FAST_TRACK_ACCELERATION_PREMIUM, findScheduleActivity(), PERFORMANCE_SCORECARD_WEIGHTS, SUBCONTRACTOR_RETENTION_BY_HEADING

### Community 110 - "fetchMyScProjects"
Cohesion: 0.47
Nodes (6): fetchMyScProjects(), SubcontractorLocationsPage(), isActiveStatus(), isCompletedStatus(), normalizeStatus(), SubcontractorProjectsPage()

### Community 111 - "routes.js"
Cohesion: 0.10
Nodes (31): AccessPhaseGate(), ROLE_HOME, BRAND_NAME, initialsFromName(), JCT_LOGO_URL, JctLogoTile(), SessionBootLoader(), STATUS_LINES (+23 more)

### Community 115 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, eject, start, test

### Community 117 - "EmployeeDetailPage"
Cohesion: 0.67
Nodes (3): avatarColor(), EmployeeDetailPage(), initials()

### Community 120 - "extends"
Cohesion: 0.50
Nodes (4): eslintConfig, extends, react-app, react-app/jest

### Community 121 - "BaselineVarianceTable.jsx"
Cohesion: 0.83
Nodes (3): BaselineVarianceTable(), daysBetween(), parseDate()

## Knowledge Gaps
- **597 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+592 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 899 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `room-collab.api.js`, `ApprovalsConfigurationPage.jsx`, `subcontractor.api.js`, `useAuth`, `App.js`, `card.jsx`, `MaterialPlanPage.jsx`, `ProjectApprovalsPage.jsx`, `button.jsx`, `sidebar.tsx`, `admin/api/projects.api.js`, `table.jsx`, `radial-chart.tsx`, `lucide-react`, `area-chart.tsx`, `bar-chart.tsx`, `formatScStatus`, `line-chart.tsx`, `ValidationInboxPage.jsx`, `react-router-dom`, `SiteVisitSchedulePage.jsx`, `dialog.jsx`, `ProjectDocumentsPage.jsx`, `tooltip.jsx`, `ResourcePlanPage.jsx`, `package.json`, `ProjectSnagsPage.jsx`, `BoqInvoiceTemplate.jsx`, `cn`, `SubcontractorPackageDetailPage.jsx`, `ProjectCompletionPage.jsx`, `ScheduleApplyWizard.jsx`, `ProjectDetailPage.jsx`, `SubcontractAgreementLetter.jsx`, `BoqEngine.jsx`, `SiteVisitReportPage.jsx`, `Step01ProjectSelection.jsx`, `DesignApprovalsPage.jsx`, `ProjectSchedulePage.jsx`, `useDirectorDashboard.js`, `LeadDetailPage.jsx`, `VisitDraftBoqEditor.jsx`, `EmployeeCalendarPage.jsx`, `ProjectBillingPage.jsx`, `BoqViewPage.jsx`, `renovationChecklist.js`, `projectStore.js`, `ReportsAnalytics.jsx`, `PostCompletionPanel.jsx`, `SiteVisitsPage.jsx`, `ScheduleReadinessStrip.jsx`, `subcontractor/pages/dashboard.js`, `ClientEmailPage.jsx`, `ProjectClientCommsPanel.jsx`, `ClientProjectRoomsSection.jsx`, `checkbox.jsx`, `VariationsInboxPage.jsx`, `admin/pages/dashboard.js`, `ProjectSubcontractorPage.jsx`, `Step03RoomCreation.jsx`, `DrawingMeasureCanvas.jsx`, `ClientApprovalPage.jsx`, `ContractSection.jsx`, `ProjectTeamAssignmentSection.jsx`, `PlanningHubLayout.jsx`, `ChannelChatPanel.jsx`, `CoverLetterStep.jsx`, `CpmGantt.jsx`, `ScTenderPanel.jsx`, `src/index.js`, `PackageDrawingsSection.jsx`, `TenantDetailPage.jsx`, `VendorReviewDialog.jsx`, `SiteEngineerSiteVisitsPage.jsx`, `ScheduleHubPage.jsx`, `SuperAdminDashboard.jsx`, `CalendarPage.jsx`, `routes.js`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `room-collab.api.js`, `ApprovalsConfigurationPage.jsx`, `subcontractor.api.js`, `useAuth`, `card.jsx`, `MaterialPlanPage.jsx`, `ProjectApprovalsPage.jsx`, `button.jsx`, `sidebar.tsx`, `admin/api/projects.api.js`, `table.jsx`, `react`, `formatScStatus`, `ValidationInboxPage.jsx`, `formatCurrency`, `react-router-dom`, `SiteVisitSchedulePage.jsx`, `dialog.jsx`, `ProjectDocumentsPage.jsx`, `tooltip.jsx`, `ResourcePlanPage.jsx`, `package.json`, `ProjectSnagsPage.jsx`, `cn`, `SubcontractorPackageDetailPage.jsx`, `ProjectCompletionPage.jsx`, `ScheduleApplyWizard.jsx`, `ProjectDetailPage.jsx`, `SiteVisitReportPage.jsx`, `Step01ProjectSelection.jsx`, `DesignApprovalsPage.jsx`, `ProjectSchedulePage.jsx`, `LeadDetailPage.jsx`, `VisitDraftBoqEditor.jsx`, `EmployeeCalendarPage.jsx`, `ProjectBillingPage.jsx`, `BoqViewPage.jsx`, `renovationChecklist.js`, `ReportsAnalytics.jsx`, `PostCompletionPanel.jsx`, `SiteVisitsPage.jsx`, `ScheduleReadinessStrip.jsx`, `subcontractor/pages/dashboard.js`, `ClientEmailPage.jsx`, `ProjectClientCommsPanel.jsx`, `ClientProjectRoomsSection.jsx`, `checkbox.jsx`, `admin/pages/dashboard.js`, `ProjectSubcontractorPage.jsx`, `Step03RoomCreation.jsx`, `DrawingMeasureCanvas.jsx`, `ClientApprovalPage.jsx`, `ContractSection.jsx`, `ProjectTeamAssignmentSection.jsx`, `PlanningHubLayout.jsx`, `ChannelChatPanel.jsx`, `CoverLetterStep.jsx`, `CpmGantt.jsx`, `ScTenderPanel.jsx`, `src/index.js`, `PackageDrawingsSection.jsx`, `TenantDetailPage.jsx`, `VendorReviewDialog.jsx`, `SiteEngineerSiteVisitsPage.jsx`, `ScheduleHubPage.jsx`, `SuperAdminDashboard.jsx`, `CalendarPage.jsx`, `routes.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _597 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `room-collab.api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1495798319327731 - nodes in this community are weakly interconnected._
- **Should `ApprovalsConfigurationPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0576592082616179 - nodes in this community are weakly interconnected._
- **Should `subcontractor.api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04981684981684982 - nodes in this community are weakly interconnected._