import { useQuery } from "@tanstack/react-query";
import { roomClient } from "@/api/roomClient";
import { guestClient } from "@/api/guestClient";
import { reservationClient } from "@/api/reservationClient";
import { BedDouble, Users, CalendarCheck, DollarSign } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import OccupancyChart from "@/components/dashboard/OccupancyChart";
import { useHotel } from "@/lib/HotelContext";

export default function Dashboard() {
  const { selectedHotel, selectedHotelId, hotels } = useHotel();
  
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", selectedHotelId],
    queryFn: () => selectedHotelId ? roomClient.list().filter({ hotel_id: selectedHotelId }) : [],
    enabled: !!selectedHotelId
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests"],
    queryFn: () => guestClient.list()
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", selectedHotelId],
    queryFn: () => selectedHotelId ? reservationClient.list().filter({ hotel_id: selectedHotelId }, "-created_date") : [],
    enabled: !!selectedHotelId
  });

  // Sort reservations by newest first (if backend doesn't sort)
  const sortedReservations = [...reservations].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const occupiedRooms = rooms.filter(
    r => r.status === "occupied"
  ).length;

  const today = new Date().toISOString().split("T")[0];

  const todayCheckins = reservations.filter(
    r => r.check_in_date === today && r.status === "confirmed"
  ).length;

  const totalRevenue = reservations
    .filter(r => r.status !== "cancelled")
    .reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your hotel operations
          </p>
          <p className="text-slate-500 mt-1">{selectedHotel ? `${selectedHotel.name} — Operations overview` : hotels.length === 0 ? "Add your first hotel to get started" : "Select a hotel from the sidebar"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Rooms"
            value={rooms.length}
            subtitle={`${occupiedRooms} occupied`}
            icon={BedDouble}
          />
          <StatsCard
            title="Total Guests"
            value={guests.length}
            subtitle="Registered guests"
            icon={Users}
          />
          <StatsCard
            title="Today's Check-ins"
            value={todayCheckins}
            subtitle="Arrivals today"
            icon={CalendarCheck}
          />
          <StatsCard
            title="Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            subtitle="Total collected"
            icon={DollarSign}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity reservations={sortedReservations} />
          </div>
          <div>
            <OccupancyChart rooms={rooms} />
          </div>
        </div>

      </div>
    </div>
  );
}
