import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, Search, BedDouble } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";

const statusStyles = {
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", label: "Confirmed" },
  checked_in: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Checked In" },
  checked_out: { bg: "bg-slate-100", text: "text-slate-600", label: "Completed" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", label: "Cancelled" }
};

export default function MyReservations() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: guests = [] } = useQuery({
    queryKey: ["guestByEmail", searchEmail],
    queryFn: async () => {
      // base44 removed — returning empty guest list for now
      return [];
    },
    enabled: !!searchEmail
  });

  const guestIds = guests.map(g => g.id);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["myReservations", guestIds],
    queryFn: async () => {
      // base44 removed — return empty reservations for now
      if (guestIds.length === 0) return [];
      return [];
    },
    enabled: guestIds.length > 0
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchEmail(email);
    setHasSearched(true);
  };

  const upcomingReservations = reservations.filter(r => 
    r.status !== "cancelled" && r.status !== "checked_out" && 
    (isFuture(new Date(r.check_in_date)) || isToday(new Date(r.check_in_date)))
  );
  
  const pastReservations = reservations.filter(r => 
    r.status === "checked_out" || r.status === "cancelled" ||
    isPast(new Date(r.check_out_date))
  );

  const ReservationCard = ({ reservation }) => {
    const status = statusStyles[reservation.status] || statusStyles.confirmed;
    const checkInDate = new Date(reservation.check_in_date);
    const checkOutDate = new Date(reservation.check_out_date);
    
    return (
      <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-48 h-32 md:h-auto bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <BedDouble className="w-10 h-10 text-slate-300" />
            </div>
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Room {reservation.room_number}</h3>
                  <p className="text-sm text-slate-500">{reservation.num_guests} guest(s)</p>
                </div>
                <Badge className={`${status.bg} ${status.text} border-0`} variant="outline">
                  {status.label}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Check-in: </span>
                    <span className="font-medium">{format(checkInDate, "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Check-out: </span>
                    <span className="font-medium">{format(checkOutDate, "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 text-sm">Total: </span>
                  <span className="font-semibold text-slate-900">${reservation.total_amount}</span>
                </div>
                <Badge variant="outline" className="capitalize border-slate-200">
                  {reservation.payment_status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-light text-xl text-slate-900">HotelHub</span>
          </Link>
          <Link to={createPageUrl("BookRoom")}>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
              Book a Room
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-light text-slate-900 mb-2">My Reservations</h1>
        <p className="text-slate-500 mb-8">Enter your email to view your bookings</p>

        {/* Search Form */}
        <Card className="border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-10 border-slate-200"
                  required
                />
              </div>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                Find Reservations
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <Card className="border-0 shadow-sm p-12 text-center">
                <p className="text-slate-500 mb-4">No reservations found for {searchEmail}</p>
                <Link to={createPageUrl("BookRoom")}>
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Book Your First Stay
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-8">
                {upcomingReservations.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-4">Upcoming Stays</h2>
                    <div className="space-y-4">
                      {upcomingReservations.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </div>
                  </div>
                )}

                {pastReservations.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-4">Past Stays</h2>
                    <div className="space-y-4">
                      {pastReservations.map((res) => (
                        <ReservationCard key={res.id} reservation={res} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}