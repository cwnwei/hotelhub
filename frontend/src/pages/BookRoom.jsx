import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Wifi, Tv, Wind, Coffee, ChevronLeft } from "lucide-react";
import { differenceInDays } from "date-fns";

const amenityIcons = {
  wifi: Wifi,
  tv: Tv,
  ac: Wind,
  coffee: Coffee
};

const roomTypeLabels = {
  standard: "Standard Room",
  deluxe: "Deluxe Room",
  suite: "Suite",
  penthouse: "Penthouse"
};

export default function BookRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const [checkIn, setCheckIn] = useState(urlParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(urlParams.get("checkOut") || "");
  const [guests, setGuests] = useState(parseInt(urlParams.get("guests")) || 2);
  const [roomType, setRoomType] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["availableRooms"],
    queryFn: async () => {
      // base44 removed — return empty room list for now
      return [];
    }
  });

  const filteredRooms = rooms.filter(room => {
    const matchesType = roomType === "all" || room.room_type === roomType;
    const matchesGuests = room.max_guests >= guests;
    return matchesType && matchesGuests;
  });

  const nights = checkIn && checkOut 
    ? differenceInDays(new Date(checkOut), new Date(checkIn)) 
    : 0;

  const handleBookNow = (room) => {

  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-light text-xl text-slate-900">HotelHub</span>
          </Link>
          <Link to={createPageUrl("MyReservations")} className="text-sm text-slate-600 hover:text-slate-900">
            My Reservations
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Filters */}
        <Card className="p-6 mb-8 border-0 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Check-in</label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Check-out</label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Guests</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Room Type</label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {nights > 0 && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{nights}</span> night(s)
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-2xl font-light text-slate-900">
            Available Rooms
            <span className="text-sm text-slate-500 ml-2">({filteredRooms.length} found)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm">
            <p className="text-slate-500">No rooms available matching your criteria</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 h-48 md:h-auto relative">
                    {room.image_url ? (
                      <img 
                        src={room.image_url} 
                        alt={`Room ${room.room_number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {roomTypeLabels[room.room_type] || room.room_type}
                        </h3>
                        <p className="text-sm text-slate-500">Room {room.room_number} • Floor {room.floor}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-0">Available</Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Up to {room.max_guests} guests</span>
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {room.amenities.map((amenity, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-2xl font-light text-slate-900">
                          ${room.price_per_night}
                          <span className="text-sm text-slate-500">/night</span>
                        </p>
                        {nights > 0 && (
                          <p className="text-sm text-amber-600 font-medium">
                            ${room.price_per_night * nights} total
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleBookNow(room)}
                        disabled={!checkIn || !checkOut}
                        className="bg-slate-900 hover:bg-slate-800"
                      >
                        {checkIn && checkOut ? "Book Now" : "Select Dates"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}