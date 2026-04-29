import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { roomClient } from "@/api/roomClient";
import { reservationClient } from "@/api/reservationClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Calendar, Users, Loader2, CheckCircle, BedDouble } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useLocation } from "react-router-dom";

export default function ConfirmBooking() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const roomId = urlParams.get("roomId");
  const checkIn = urlParams.get("checkIn");
  const checkOut = urlParams.get("checkOut");
  const guestCount = parseInt(urlParams.get("guests")) || 1;
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    special_requests: ""
  });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [newReservationId, setNewReservationId] = useState(null);

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const rooms = await roomClient.list(); // fetch all rooms
      return rooms.find(r => r.id.toString() === roomId) || null;
    }
  });

  const nights = checkIn && checkOut
    ? differenceInDays(new Date(checkOut), new Date(checkIn))
    : 0;
  const totalAmount = room ? room.price_per_night * nights : 0;

  const createReservationMutation = useMutation({
    mutationFn: (data) => reservationClient.create(data)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create reservation
    const reservation = await createReservationMutation.mutateAsync({
      guest_id: user._id,
      guest_name: user.full_name,
      room_id: roomId,
      room_number: room.room_number,
      check_in_date: checkIn,
      check_out_date: checkOut,
      num_guests: guestCount,
      status: "confirmed",
      total_amount: totalAmount,
      amount_paid: 0,
      payment_status: "pending",
      special_requests: formData.special_requests
    });

    setNewReservationId(reservation.id);
    setBookingComplete(true);
  };

  const isLoading = createReservationMutation.isPending;

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg text-center p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-6">
            Your reservation has been successfully made. We've sent a confirmation to {formData.email}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Room</span>
              <span className="font-medium">{room?.room_number}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Check-in</span>
              <span className="font-medium">{format(new Date(checkIn), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Check-out</span>
              <span className="font-medium">{format(new Date(checkOut), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-900">${totalAmount}</span>
            </div>
          </div>
          <div className="space-y-3">
            <Link to={createPageUrl("MyReservations")} className="block">
              <Button className="w-full bg-slate-900 hover:bg-slate-800">
                View My Reservations
              </Button>
            </Link>
            <Link to={createPageUrl("Home")} className="block">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (roomLoading || !room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to={createPageUrl("BookRoom")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to rooms</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-light text-slate-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Guest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Smith"
                      required
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        required
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Special Requests (optional)</Label>
                    <Textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      placeholder="Early check-in, extra pillows, etc."
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Confirm Booking • $${totalAmount}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="border-0 shadow-sm sticky top-24">
              <div className="h-40 relative">
                {room.image_url ? (
                  <img
                    src={room.image_url}
                    alt={`Room ${room.room_number}`}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-xl flex items-center justify-center">
                    <BedDouble className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-900 mb-1">Room {room.room_number}</h3>
                <p className="text-sm text-slate-500 capitalize mb-4">{room.room_type} Room</p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Check-in</p>
                      <p className="font-medium">{format(new Date(checkIn), "EEE, MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Check-out</p>
                      <p className="font-medium">{format(new Date(checkOut), "EEE, MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Guests</p>
                      <p className="font-medium">{guestCount} guest(s)</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">${room.price_per_night} × {nights} nights</span>
                    <span>${totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}