import { Building2, DoorOpen, ChevronRight, CheckCircle2, Ruler, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBoq, QAS_TOTAL_STEPS } from "../BoqEngine";

const UNIT_LABELS = {
  SQM: "Sq Mtr",
  SQFT: "Sq Ft",
  MTR: "Running Mtr",
  NOS: "Nos",
};

function calcWallSqMtr(length, breadth) {
  const l = parseFloat(length);
  const b = parseFloat(breadth);
  if (isNaN(l) || isNaN(b) || l <= 0 || b <= 0) return "—";
  return (l * b).toFixed(2);
}

function getWallsForRoom(roomId) {
  return window.__boq_walls?.[roomId] || [];
}

export default function Step04Review() {
  const { floors, rooms, measurements, photos, nextStep, prevStep, goToStep } = useBoq();

  const isRoomConfigured = (roomId) => {
    const walls = getWallsForRoom(roomId);
    if (!walls.length) return false;
    const wallsOk = walls.every((w) => w.length && w.height);
    const workOk = walls.some((w) => (w.workScopeEntries?.length || 0) > 0);
    return wallsOk && workOk;
  };

  const configuredRooms = rooms.filter((r) => isRoomConfigured(r.id));

  const canProceed = rooms.length > 0 && configuredRooms.length === rooms.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">4</span>
          Step 4 of {QAS_TOTAL_STEPS}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Review</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Floor-wise summary of all rooms, walls, dimensions, and work items captured in this QAS.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <span><strong>{floors.length}</strong> floors</span>
        <span className="text-muted-foreground">·</span>
        <span><strong>{rooms.length}</strong> rooms</span>
        <span className="text-muted-foreground">·</span>
        <span><strong>{configuredRooms.length}</strong> fully configured</span>
      </div>

      {!canProceed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some rooms are missing walls or work items. Go back to Step 3 to complete them before finishing.
        </div>
      )}

      <div className="space-y-6">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((r) => String(r.floorId) === String(floor.id));
          if (floorRooms.length === 0) return null;

          return (
            <Card key={floor.id} className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-border/40 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">{floor.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{floorRooms.length} rooms</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/40">
                {floorRooms.map((room) => {
                  const walls = getWallsForRoom(room.id);
                  const dims = measurements[room.id] || {};
                  const roomPhotos = photos[room.id] || [];
                  const workCount = walls.reduce((n, w) => n + (w.workScopeEntries?.length || 0), 0);

                  return (
                    <div key={room.id} className="p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <DoorOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-foreground">{room.name}</h3>
                            <p className="text-xs text-muted-foreground">{room.roomCategory}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dims.length && dims.width && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Ruler className="h-3 w-3" />
                              {dims.length}m × {dims.width}m
                              {dims.height ? ` · H ${Number(dims.height).toFixed(2)}m` : ""}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">{walls.length} walls</Badge>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Wrench className="h-3 w-3" />
                            {workCount} work items
                          </Badge>
                          {roomPhotos.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">{roomPhotos.length} photos</Badge>
                          )}
                        </div>
                      </div>

                      {walls.length > 0 && (
                        <div className="rounded-lg border border-border/60 overflow-hidden">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 bg-muted/30 border-b border-border/40">
                            Walls
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="text-xs">Wall</TableHead>
                                <TableHead className="text-xs">Length</TableHead>
                                <TableHead className="text-xs">Breadth</TableHead>
                                <TableHead className="text-xs">Area</TableHead>
                                <TableHead className="text-xs">Unit</TableHead>
                                <TableHead className="text-xs">Photo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {walls.map((wall) => (
                                <TableRow key={wall.id}>
                                  <TableCell className="text-xs font-semibold">{wall.name}</TableCell>
                                  <TableCell className="text-xs">{wall.length || "—"} m</TableCell>
                                  <TableCell className="text-xs">{wall.height || "—"} m</TableCell>
                                  <TableCell className="text-xs font-bold text-primary">
                                    {calcWallSqMtr(wall.length, wall.height)}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {UNIT_LABELS[wall.areaUnit] || UNIT_LABELS.SQM}
                                  </TableCell>
                                  <TableCell>
                                    {wall.photo ? (
                                      <img src={wall.photo} alt={wall.name} className="h-8 w-12 rounded border object-cover" />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {workCount > 0 && (
                        <div className="rounded-lg border border-border/60 overflow-hidden">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 bg-muted/30 border-b border-border/40">
                            Work Items
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="text-xs">Wall</TableHead>
                                <TableHead className="text-xs">Parent</TableHead>
                                <TableHead className="text-xs">Child Item</TableHead>
                                <TableHead className="text-xs">Unit</TableHead>
                                <TableHead className="text-xs">Qty</TableHead>
                                <TableHead className="text-xs">Dimensions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {walls.flatMap((wall) =>
                                (wall.workScopeEntries || []).map((entry) => (
                                  <TableRow key={entry.entryId}>
                                    <TableCell className="text-xs">{wall.name}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[9px]">{entry.categoryLabel}</Badge></TableCell>
                                    <TableCell className="text-xs font-semibold">{entry.itemName}</TableCell>
                                    <TableCell className="text-xs">{UNIT_LABELS[(entry.unit || "").toUpperCase()] || entry.unit}</TableCell>
                                    <TableCell className="text-xs font-bold text-primary">{entry.qty || "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {entry.dims?.width && entry.dims?.height
                                        ? `${entry.dims.width}m × ${entry.dims.height}m`
                                        : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {walls.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No wall data for this room.</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {rooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <DoorOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No rooms to review. Complete Step 3 first.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => goToStep(3)}>
              Go to Rooms
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Button variant="outline" onClick={prevStep}>Back</Button>
        <Button
          onClick={nextStep}
          disabled={!canProceed}
          className="gap-2 bg-primary text-white hover:bg-primary/90"
        >
          Next: Complete QAS
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
