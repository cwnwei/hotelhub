import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomClient } from "@/api/roomClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import RoomCard from "@/components/rooms/RoomCard";
import RoomForm from "@/components/rooms/RoomForm";
import { useHotel } from "@/lib/HotelContext";

export default function Rooms() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryClient = useQueryClient();
  const { selectedHotel, selectedHotelId } = useHotel();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => selectedHotelId ? roomClient.list().filter({ hotel_id: selectedHotelId }) : [],
    enabled: !!selectedHotelId
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingRoom
        ? roomClient.update(editingRoom.id, data)
        : roomClient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", selectedHotelId] });
      setFormOpen(false);
      setEditingRoom(null);
    }
  });

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingRoom(null);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesType = typeFilter === "all" || room.room_type === typeFilter;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Rooms
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your hotel rooms
            </p>
            <p className="text-slate-500 mt-1">{selectedHotel ? `${selectedHotel.name} — Manage rooms` : "Select a hotel to manage rooms"}</p>
          </div>

          <Button
            onClick={() => setFormOpen(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 bg-white border-slate-200">
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="deluxe">Deluxe</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="penthouse">Penthouse</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No rooms found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} />
            ))}
          </div>
        )}

        <RoomForm
          room={editingRoom}
          open={formOpen}
          onClose={handleClose}
          onSave={(data) => saveMutation.mutate({ ...data, hotel_id: selectedHotelId, hotel_name: selectedHotel?.name })}
          isLoading={saveMutation.isPending}
        />
      </div>
    </div>
  );
}
