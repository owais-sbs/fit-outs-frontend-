import { useState } from "react";
import { ArrowRight, ArrowLeft, Plus, Trash2, Edit2, Grid, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ROOM_TYPES = ["Master Bedroom", "Living Room", "Kitchen", "Bathroom"];
const FLOORS = ["Ground Floor", "First Floor", "Second Floor"];

export default function RoomConfigStep({ nextStep, prevStep, updateData }) {
  const [selectedFloor, setSelectedFloor] = useState(FLOORS[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roomType, setRoomType] = useState("");
  const [roomName, setRoomName] = useState("");
  
  const [rooms, setRooms] = useState([
    { id: 1, type: "Master Bedroom", name: "Master Bedroom 1", floor: "First Floor", status: "Pending" },
    { id: 2, type: "Kitchen", name: "Main Kitchen", floor: "Ground Floor", status: "Pending" },
  ]);

  const handleAddRoom = () => {
    if (!roomType || !roomName) return;
    setRooms([...rooms, { id: Date.now(), type: roomType, name: roomName, floor: selectedFloor, status: "Pending" }]);
    setIsAddModalOpen(false);
    setRoomType(""); setRoomName("");
  };

  const handleRoomSelect = (room) => {
    updateData({ selectedFloor: room.floor, selectedRoom: room });
    nextStep();
  };

  const filteredRooms = rooms.filter(r => r.floor === selectedFloor);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold">3. Room Configuration</h2>
          <p className="text-muted-foreground">Select a floor and configure its rooms.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 flex gap-4 items-center">
          <Layers className="text-muted-foreground w-5 h-5" />
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-[250px] bg-muted/30">
              <SelectValue placeholder="Select Floor" />
            </SelectTrigger>
            <SelectContent>
              {FLOORS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRooms.map(room => (
          <Card key={room.id} className="border-border/60 shadow-sm hover:border-slate-300 transition-colors cursor-pointer" onClick={() => handleRoomSelect(room)}>
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                  <Grid className="w-3 h-3 mr-1" /> {room.type}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {room.status}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{room.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Click to measure →</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room - {selectedFloor}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={roomType} onValueChange={(val) => { setRoomType(val); if (!roomName) setRoomName(`${val} 1`); }}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Master Bedroom 1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleAddRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
