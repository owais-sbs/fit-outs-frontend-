# Graph Report - drawings  (2026-10-01)

## Corpus Check
- 4 files · ~4,797 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 89 nodes · 144 edges · 6 communities (5 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ade66aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProjectDrawingsPage.jsx
- QtoWorkspacePage.jsx
- DrawingMeasureCanvas.jsx
- DrawingMeasureCanvas
- drawingQtoUtils.js
- defaultUnitForType

## God Nodes (most connected - your core abstractions)
1. `DrawingMeasureCanvas()` - 9 edges
2. `polylineLength()` - 5 edges
3. `pixelDistance()` - 4 edges
4. `polygonArea()` - 4 edges
5. `sceneToCanvas()` - 3 edges
6. `quantityFromGeometry()` - 3 edges
7. `defaultUnitForType()` - 3 edges
8. `createDxfWorker()` - 2 edges
9. `safeDxfSubscribe()` - 2 edges
10. `safeDxfUnsubscribe()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `DrawingMeasureCanvas()` --calls--> `pixelDistance()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/drawings/DrawingMeasureCanvas.jsx → fit-outs-frontend-/src/modules/admin/pages/drawings/drawingQtoUtils.js
- `DrawingMeasureCanvas()` --calls--> `polygonArea()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/drawings/DrawingMeasureCanvas.jsx → fit-outs-frontend-/src/modules/admin/pages/drawings/drawingQtoUtils.js
- `DrawingMeasureCanvas()` --calls--> `polylineLength()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/drawings/DrawingMeasureCanvas.jsx → fit-outs-frontend-/src/modules/admin/pages/drawings/drawingQtoUtils.js
- `DrawingMeasureCanvas()` --calls--> `sceneToCanvas()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/drawings/DrawingMeasureCanvas.jsx → fit-outs-frontend-/src/modules/admin/pages/drawings/drawingQtoUtils.js
- `QtoWorkspacePage()` --calls--> `defaultUnitForType()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/drawings/QtoWorkspacePage.jsx → fit-outs-frontend-/src/modules/admin/pages/drawings/drawingQtoUtils.js

## Import Cycles
- None detected.

## Communities (6 total, 1 thin omitted)

### Community 0 - "ProjectDrawingsPage.jsx"
Cohesion: 0.06
Nodes (30): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_layout_pageshell_pageshell, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_layout_pageshell_pagetitle, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_badge_badge, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_card, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardcontent, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardheader, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_card_cardtitle, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_dialog_dialog (+22 more)

### Community 1 - "QtoWorkspacePage.jsx"
Cohesion: 0.07
Nodes (29): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_select_selectcontent, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_select_selectitem, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_select_selecttrigger, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_table, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablebody, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablecell, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tablehead, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_table_tableheader (+21 more)

### Community 2 - "DrawingMeasureCanvas.jsx"
Cohesion: 0.13
Nodes (14): c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_button_button, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_input_input, c_users_humai_desktop_repositories_onepath_full_stack_fitouts_jct_fit_outs_frontend_src_components_ui_label_label, DXF_LOAD_PHASE_LABELS, MEASURE_TOOLS, TOOLS, ext_button_jsx, ext_input_jsx (+6 more)

### Community 3 - "DrawingMeasureCanvas"
Cohesion: 0.40
Nodes (5): createDxfWorker(), DrawingMeasureCanvas(), safeDxfSubscribe(), safeDxfUnsubscribe(), sceneToCanvas()

### Community 4 - "drawingQtoUtils.js"
Cohesion: 0.70
Nodes (4): pixelDistance(), polygonArea(), polylineLength(), quantityFromGeometry()

## Knowledge Gaps
- **2 isolated node(s):** `DXF_LOAD_PHASE_LABELS`, `MEASURE_TOOLS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 43 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DrawingMeasureCanvas()` connect `DrawingMeasureCanvas` to `QtoWorkspacePage.jsx`, `DrawingMeasureCanvas.jsx`, `drawingQtoUtils.js`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `polylineLength()` connect `drawingQtoUtils.js` to `DrawingMeasureCanvas.jsx`, `DrawingMeasureCanvas`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `polygonArea()` connect `drawingQtoUtils.js` to `DrawingMeasureCanvas.jsx`, `DrawingMeasureCanvas`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `DXF_LOAD_PHASE_LABELS`, `MEASURE_TOOLS` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProjectDrawingsPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `QtoWorkspacePage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `DrawingMeasureCanvas.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._