# Graph Report - roomcollab  (2026-09-25)

## Corpus Check
- 6 files · ~3,696 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 79 nodes · 121 edges · 5 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `874ceb88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProjectRoomsSection.jsx
- RoomTaskDetailPage.jsx
- CollabChatPanel.jsx
- RoomChatPage.jsx
- finalReportPdf.js

## God Nodes (most connected - your core abstractions)
1. `CollabChatPanel()` - 7 edges
2. `downloadFinalApprovedPdf()` - 6 edges
3. `formatChatTime()` - 2 edges
4. `fileHref()` - 2 edges
5. `fileLabel()` - 2 edges
6. `hasFileAttachment()` - 2 edges
7. `ProjectRoomsSection()` - 2 edges
8. `TaskChatPanel()` - 2 edges
9. `formatMoney()` - 2 edges
10. `weightedConstructionPercent()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `ProjectRoomsSection()` --calls--> `downloadFinalApprovedPdf()`  [EXTRACTED]
  fit-outs-frontend-/src/modules/admin/pages/roomcollab/ProjectRoomsSection.jsx → fit-outs-frontend-/src/modules/admin/pages/roomcollab/finalReportPdf.js

## Import Cycles
- None detected.

## Communities (5 total, 0 thin omitted)

### Community 0 - "ProjectRoomsSection.jsx"
Cohesion: 0.07
Nodes (29): d_onepath_jct_fit_outs_frontend_src_components_ui_dialog_dialog, d_onepath_jct_fit_outs_frontend_src_components_ui_dialog_dialogcontent, d_onepath_jct_fit_outs_frontend_src_components_ui_dialog_dialogfooter, d_onepath_jct_fit_outs_frontend_src_components_ui_dialog_dialogheader, d_onepath_jct_fit_outs_frontend_src_components_ui_dialog_dialogtitle, d_onepath_jct_fit_outs_frontend_src_components_ui_input_input, d_onepath_jct_fit_outs_frontend_src_components_ui_label_label, d_onepath_jct_fit_outs_frontend_src_components_ui_select_select (+21 more)

### Community 1 - "RoomTaskDetailPage.jsx"
Cohesion: 0.13
Nodes (12): d_onepath_jct_fit_outs_frontend_src_components_ui_badge_badge, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_closeroomtask, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_fetchroomtask, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_fetchtaskmessages, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_fetchtasktimeline, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_posttaskmessage, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_submittasktoclient, d_onepath_jct_fit_outs_frontend_src_shared_hooks_usecollabchatsocket_usecollabchatsocket (+4 more)

### Community 2 - "CollabChatPanel.jsx"
Cohesion: 0.21
Nodes (12): CollabChatPanel(), fileHref(), fileLabel(), formatChatTime(), hasFileAttachment(), d_onepath_jct_fit_outs_frontend_src_components_ui_button_button, d_onepath_jct_fit_outs_frontend_src_shared_context_auth_context_useauth, ext_auth_context_js (+4 more)

### Community 3 - "RoomChatPage.jsx"
Cohesion: 0.17
Nodes (10): d_onepath_jct_fit_outs_frontend_src_components_ui_card_card, d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardcontent, d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardheader, d_onepath_jct_fit_outs_frontend_src_components_ui_card_cardtitle, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_fetchroommessages, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_fetchroomtasks, d_onepath_jct_fit_outs_frontend_src_modules_admin_api_room_collab_api_postroommessage, d_onepath_jct_fit_outs_frontend_src_shared_constants_routes_routes (+2 more)

### Community 4 - "finalReportPdf.js"
Cohesion: 0.43
Nodes (6): downloadFinalApprovedPdf(), formatMoney(), normalizePaymentRows(), weightedConstructionPercent(), ProjectRoomsSection(), ref_jspdf

## Knowledge Gaps
- **1 isolated node(s):** `STATUS_VARIANT`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 44 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `downloadFinalApprovedPdf()` connect `finalReportPdf.js` to `ProjectRoomsSection.jsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `CollabChatPanel()` connect `CollabChatPanel.jsx` to `RoomTaskDetailPage.jsx`, `RoomChatPage.jsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `STATUS_VARIANT` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProjectRoomsSection.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `RoomTaskDetailPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._