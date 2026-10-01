# Graph Report - planning  (2026-10-01)

## Corpus Check
- 6 files · ~7,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 131 nodes · 217 edges · 7 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ade66aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MaterialPlanPage.jsx
- ProjectPlanningSection.jsx
- ResourcePlanPage.jsx
- LabourPlanPage.jsx
- MaterialPlanPage
- PurchaseOrderTemplate.jsx
- crewDateSpan

## God Nodes (most connected - your core abstractions)
1. `MaterialPlanPage()` - 11 edges
2. `workItemLabels()` - 5 edges
3. `buildDisplaySections()` - 5 edges
4. `materialLineShortage()` - 4 edges
5. `crewDateSpan()` - 3 edges
6. `LabourPlanPage()` - 3 edges
7. `toQty()` - 3 edges
8. `groupMaterialLines()` - 3 edges
9. `resolveLineIndex()` - 3 edges
10. `PurchaseOrderTemplate()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `MaterialPlanPage()` --calls--> `buildPoNumber()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/planning/MaterialPlanPage.jsx → fit-outs-frontend-/src/modules/admin/pages/planning/materialPoPdf.js
- `MaterialPlanPage()` --calls--> `dominantSupplier()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/planning/MaterialPlanPage.jsx → fit-outs-frontend-/src/modules/admin/pages/planning/materialPoPdf.js
- `MaterialPlanPage()` --calls--> `downloadMaterialPoPdf()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/planning/MaterialPlanPage.jsx → fit-outs-frontend-/src/modules/admin/pages/planning/materialPoPdf.js
- `MaterialPlanPage()` --calls--> `enrichPoLines()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/planning/MaterialPlanPage.jsx → fit-outs-frontend-/src/modules/admin/pages/planning/materialPoPdf.js
- `MaterialPlanPage()` --calls--> `previewMaterialPoPdf()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/planning/MaterialPlanPage.jsx → fit-outs-frontend-/src/modules/admin/pages/planning/materialPoPdf.js

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "MaterialPlanPage.jsx"
Cohesion: 0.06
Nodes (35): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_shared_loadingmessages_loadingmessages, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_accordion_accordion, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_accordion_accordioncontent, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_accordion_accordionitem, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_accordion_accordiontrigger, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_checkbox_checkbox, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_dialog_dialog, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_dialog_dialogcontent (+27 more)

### Community 1 - "ProjectPlanningSection.jsx"
Cohesion: 0.10
Nodes (20): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_badge_badge, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_button_button, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_card, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardcontent, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_label_label, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_switch_switch, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_api_planning_api_fetchplanningstatus, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_api_planning_api_updateplanningstatus (+12 more)

### Community 2 - "ResourcePlanPage.jsx"
Cohesion: 0.10
Nodes (20): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_layout_pageshell_pagetitle, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_layout_pageshell_stattile, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardheader, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardtitle, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_input_input, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_lib_notify_notify, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_api_resource_api_createresourceassignment, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_api_resource_api_createresourcetype (+12 more)

### Community 3 - "LabourPlanPage.jsx"
Cohesion: 0.11
Nodes (18): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_layout_pageshell_pageshell, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_table, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablebody, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablecell, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablehead, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tableheader, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablerow, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_api_resource_api_createcrewassignment (+10 more)

### Community 4 - "MaterialPlanPage"
Cohesion: 0.16
Nodes (17): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqpdfexport_downloadboqpdf, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqpdfexport_exportboqpdfblob, ext_boq_boqpdfexport_js, buildDisplaySections(), groupMaterialLines(), materialLineShortage(), MaterialPlanLineRow(), MaterialPlanPage() (+9 more)

### Community 5 - "PurchaseOrderTemplate.jsx"
Cohesion: 0.18
Nodes (10): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqtheme_boq_print_color, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqtheme_boq_theme, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqtheme_company, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqtheme_formatboqamount, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_modules_admin_pages_boq_boqtheme_formatboqdate, ext_boq_boqtheme_js, formatQty(), PurchaseOrderTemplate() (+2 more)

### Community 6 - "crewDateSpan"
Cohesion: 0.50
Nodes (4): activityLabel(), crewDateSpan(), formatDate(), LabourPlanPage()

## Knowledge Gaps
- **4 isolated node(s):** `AREA_LABELS`, `TH_STYLE`, `TD_STYLE`, `PLANT_TOOL_KINDS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 74 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PurchaseOrderTemplate()` connect `PurchaseOrderTemplate.jsx` to `MaterialPlanPage.jsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `MaterialPlanPage()` connect `MaterialPlanPage` to `MaterialPlanPage.jsx`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `materialLineShortage()` connect `MaterialPlanPage` to `MaterialPlanPage.jsx`?**
  _High betweenness centrality (0.000) - this node is a cross-community bridge._
- **What connects `AREA_LABELS`, `TH_STYLE`, `TD_STYLE` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MaterialPlanPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `ProjectPlanningSection.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ResourcePlanPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._