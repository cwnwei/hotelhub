import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export default function ReservationForm({ reservation, guests, rooms, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_out_date: "",
    num_guests: 1,
    status: "confirmed",
    amount_paid: 0,
    payment_status: "pending",
    special_requests: ""
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        guest_id: reservation.guest_id || "",
        room_id: reservation.room_id || "",
        check_in_date: reservation.check_in_date || "",
        check_out_date: reservation.check_out_date || "",
        num_guests: reservation.num_guests || 1,
        status: reservation.status || "confirmed",
        amount_paid: reservation.amount_paid || 0,
        payment_status: reservation.payment_status || "pending",
        special_requests: reservation.special_requests || ""
      });
    } else {
      setFormData({
        guest_id: "",
        room_id: "",
        check_in_date: "",
        check_out_date: "",
        num_guests: 1,
        status: "confirmed",
        amount_paid: 0,
        payment_status: "pending",
        special_requests: ""
      });
    }
  }, [reservation, open]);

  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const selectedGuest = guests.find(g => g.id === formData.guest_id);
  
  const nights = formData.check_in_date && formData.check_out_date 
    ? differenceInDays(new Date(formData.check_out_date), new Date(formData.check_in_date))
    : 0;
  
  const totalAmount = selectedRoom && nights > 0 
    ? selectedRoom.price_per_night * nights 
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      guest_name: selectedGuest?.full_name || "",
      room_number: selectedRoom?.room_number || "",
      num_guests: Number(formData.num_guests),
      total_amount: totalAmount,
      amount_paid: Number(formData.amount_paid)
    });
  };

  const availableRooms = rooms.filter(r => 
    r.status === "available" || r.id === reservation?.room_id
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {reservation ? "Edit Reservation" : "New Reservation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Guest</Label>
            <Select value={formData.guest_id} onValueChange={(v) => setFormData({ ...formData, guest_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select guest" />
              </SelectTrigger>
              <SelectContent>
                {guests.map((guest) => (
                  <SelectItem key={guest.id} value={guest.id}>
                    {guest.full_name} ({guest.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={formData.room_id} onValueChange={(v) => setFormData({ ...formData, room_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Input
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Input
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                min={formData.check_in_date}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Guests</Label>
              <Input
                type="number"
                value={formData.num_guests}
                onChange={(e) => setFormData({ ...formData, num_guests: e.target.value })}
                min="1"
                max={selectedRoom?.max_guests || 10}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {totalAmount > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{nights} night(s) × ${selectedRoom?.price_per_night}</span>
                <span className="font-medium text-slate-800">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-2">
                  <Label className="text-xs">Amount Paid</Label>
                  <Input
                    type="number"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    min="0"
                    max={totalAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Payment Status</Label>
                  <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Special Requests</Label>
            <Textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Any special requests..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reservation ? "Save Changes" : "Create Reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}