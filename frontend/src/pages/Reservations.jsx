import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservationClient } from "@/api/reservationClient";
import { guestClient } from "@/api/guestClient";
import { roomClient } from "@/api/roomClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ReservationTable from "@/components/reservations/ReservationTable";
import ReservationForm from "@/components/reservations/ReservationForm";

export default function Reservations() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => reservationClient.list()
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests"],
    queryFn: () => guestClient.list()
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomClient.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingReservation) {
        return reservationClient.update(editingReservation.id, data);
      }

      const result = await reservationClient.create(data);

      // Update room status after check-in
      if (data.room_id && data.status === "checked_in") {
        await roomClient.update(data.room_id, { status: "occupied" });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });

      setFormOpen(false);
      setEditingReservation(null);
    }
  });

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingReservation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Reservations
            </h1>
            <p className="text-slate-500 mt-1">
              Manage bookings and check-ins
            </p>
          </div>

          <Button
            onClick={() => setFormOpen(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Reservation
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <ReservationTable
            reservations={reservations}
            onEdit={handleEdit}
          />
        )}

        <ReservationForm
          reservation={editingReservation}
          guests={guests}
          rooms={rooms}
          open={formOpen}
          onClose={handleClose}
          onSave={(data) => saveMutation.mutate(data)}
          isLoading={saveMutation.isPending}
        />
      </div>
    </div>
  );
}
