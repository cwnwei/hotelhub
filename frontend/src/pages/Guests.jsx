import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guestClient } from "@/api/guestClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import GuestTable from "@/components/guests/GuestTable";
import GuestForm from "@/components/guests/GuestForm";

export default function Guests() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["guests"],
    queryFn: () => guestClient.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingGuest 
      ? guestClient.update(editingGuest.id, data)
      : guestClient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setFormOpen(false);
      setEditingGuest(null);
    }
  });

  const handleEdit = (guest) => {
    setEditingGuest(guest);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingGuest(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">Guests</h1>
            <p className="text-slate-500 mt-1">Manage guest information</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <GuestTable guests={guests} onEdit={handleEdit} />
        )}

        <GuestForm
          guest={editingGuest}
          open={formOpen}
          onClose={handleClose}
          onSave={(data) => saveMutation.mutate(data)}
          isLoading={saveMutation.isPending}
        />
      </div>
    </div>
  );
}