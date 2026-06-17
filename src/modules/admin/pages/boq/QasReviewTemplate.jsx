import { Fragment } from "react";
import BoqDocumentHeader, { BoqMetaBar, BoqDocumentFooter } from "./BoqDocumentHeader";
import { BOQ_THEME, BOQ_PRINT_COLOR, resolveSurface } from "./boqTheme";
import {
  buildRoomDetailRows,
  calcWallSqMtr,
  getWallsForRoom,
  unitLabel,
} from "./boqDataUtils";

function SurfaceBadge({ label }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-medium text-gray-600"
      style={{ backgroundColor: BOQ_THEME.surfaceBadge }}
    >
      {label}
    </span>
  );
}

export default function QasReviewTemplate({ session, floors, rooms, measurements, stats }) {
  const project = session?.project || {};
  const projectName = project.projectName || project.name || "Project";
  const clientName = project.clientName || project.client || "N/A";

  const metaItems = [
    { label: "Project", value: projectName },
    { label: "Client", value: clientName },
    { label: "QAS Reference", value: session?.ref || "—", highlight: true },
    { label: "Floors", value: String(stats.floors) },
    { label: "Work Items", value: String(stats.workItems), highlight: true },
  ];

  return (
    <div
      id="qas-review-print"
      data-title={session?.ref || "QAS-Review"}
      className="boq-document overflow-hidden bg-white"
      style={{
        ...BOQ_PRINT_COLOR,
        border: `1px solid ${BOQ_THEME.metaBorder}`,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <BoqDocumentHeader
        variant="review"
        refCode={session?.ref || "QAS-DRAFT"}
        generatedAt={session?.completedAt || session?.startedAt}
      />

      <BoqMetaBar items={metaItems} />

      <div
        className="px-5 py-2.5 border-x text-[10px] font-bold uppercase tracking-widest text-gray-500"
        style={{ borderColor: BOQ_THEME.metaBorder, backgroundColor: "#fafafa" }}
      >
        Quantity Assessment — Floor, Room, Wall &amp; Work Item Breakdown
      </div>

      <div className="border-x overflow-x-auto" style={{ borderColor: BOQ_THEME.metaBorder }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ backgroundColor: BOQ_THEME.tableHeader }}>
              {["Wall", "Surface", "Length", "Height", "Area", "Unit", "Parent", "Work Item", "Qty", "Dims"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white whitespace-nowrap ${
                      i === 0 ? "text-left" : "text-left"
                    }`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {floors.map((floor) => {
              const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
              if (!floorRooms.length) return null;

              const floorWallCount = floorRooms.reduce((n, r) => n + getWallsForRoom(r.id).length, 0);
              const floorWorkCount = floorRooms.reduce((n, r) => {
                const walls = getWallsForRoom(r.id);
                return n + walls.reduce((w, wall) => w + (wall.workScopeEntries?.length || 0), 0);
              }, 0);

              return (
                <Fragment key={`floor-block-${floor.id}`}>
                  <tr
                    key={`floor-${floor.id}`}
                    style={{
                      background: `linear-gradient(90deg, ${BOQ_THEME.orangeGradientFrom}, ${BOQ_THEME.orangeGradientTo})`,
                    }}
                  >
                    <td colSpan={8} className="px-4 py-2.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/80 shrink-0" />
                        {floor.name}
                      </div>
                    </td>
                    <td colSpan={2} className="px-4 py-2.5 text-right text-white text-xs">
                      {floorWallCount} walls · {floorWorkCount} items
                    </td>
                  </tr>

                  {floorRooms.map((room) => {
                    const walls = getWallsForRoom(room.id);
                    const dims = measurements[room.id] || {};
                    const rows = buildRoomDetailRows(walls);
                    const workCount = walls.reduce((n, w) => n + (w.workScopeEntries?.length || 0), 0);

                    return (
                      <Fragment key={`room-block-${room.id}`}>
                        <tr key={`room-${room.id}`} style={{ backgroundColor: BOQ_THEME.cream }}>
                          <td colSpan={8} className="px-4 py-2">
                            <div className="flex items-center gap-2 font-bold text-sm text-gray-800">
                              <span className="text-[10px] shrink-0" style={{ color: BOQ_THEME.orange }}>▾</span>
                              {room.name}
                              <span className="text-[10px] font-normal text-gray-500">({room.roomCategory})</span>
                              {dims.length && dims.width && (
                                <span className="text-[10px] font-normal text-gray-500 ml-1">
                                  · {dims.length}m × {dims.width}m
                                  {dims.height ? ` · H ${Number(dims.height).toFixed(2)}m` : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          <td colSpan={2} className="px-4 py-2 text-right text-xs text-gray-600">
                            {walls.length} walls · {workCount} items
                          </td>
                        </tr>

                        {rows.map(({ key, wall, entry }) => (
                          <tr key={key} className="border-b bg-white" style={{ borderColor: "#f0f0f0" }}>
                            <td className="px-3 py-2 text-xs font-semibold text-gray-800 align-middle">{wall.name}</td>
                            <td className="px-3 py-2 align-middle">
                              <SurfaceBadge label={resolveSurface(wall.name, entry?.categoryLabel)} />
                            </td>
                            <td className="px-3 py-2 text-xs align-middle">{wall.length ? `${wall.length} m` : "—"}</td>
                            <td className="px-3 py-2 text-xs align-middle">{wall.height ? `${wall.height} m` : "—"}</td>
                            <td className="px-3 py-2 text-xs font-bold align-middle" style={{ color: BOQ_THEME.orange }}>
                              {calcWallSqMtr(wall.length, wall.height) ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-xs align-middle">{unitLabel(wall.areaUnit || "SQM")}</td>
                            <td className="px-3 py-2 text-xs align-middle text-gray-600">{entry?.categoryLabel || "—"}</td>
                            <td className="px-3 py-2 text-xs font-medium align-middle">{entry?.itemName || "—"}</td>
                            <td className="px-3 py-2 text-xs font-bold align-middle" style={{ color: BOQ_THEME.orange }}>
                              {entry?.qty || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500 align-middle whitespace-nowrap">
                              {entry?.dims?.width && entry?.dims?.height
                                ? `${entry.dims.width}m × ${entry.dims.height}m`
                                : "—"}
                            </td>
                          </tr>
                        ))}

                        {rows.length === 0 && (
                          <tr key={`empty-${room.id}`}>
                            <td colSpan={10} className="px-4 py-3 text-xs text-gray-400 italic text-center">
                              No wall or work item data for this room
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assessment summary bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-x"
        style={{ backgroundColor: BOQ_THEME.grandTotalBg, borderColor: BOQ_THEME.metaBorder }}
      >
        <span className="text-white font-bold text-sm uppercase tracking-wider">Assessment Complete</span>
        <div className="flex gap-6 text-right">
          {[
            { label: "Floors", value: stats.floors },
            { label: "Rooms", value: stats.rooms },
            { label: "Walls", value: stats.walls },
            { label: "Work Items", value: stats.workItems },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] text-white/50 uppercase">{label}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: BOQ_THEME.orangeLight }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BoqDocumentFooter />
    </div>
  );
}
