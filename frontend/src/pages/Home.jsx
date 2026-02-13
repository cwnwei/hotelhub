import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Calendar, Users, Star, MapPin, Wifi, Coffee, Car, Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const handleLogout = () => {
    logout(false); // Don't use window.location, let useNavigate handle it
    navigate("/");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests.toString());
    window.location.href = createPageUrl("BookRoom") + "?" + params.toString();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[85vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600"
          alt="Hotel"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 pointer-events-none" />
        
        {/* Nav */}
        <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6">
          <h1 className="text-2xl font-light text-white tracking-wide">HotelHub</h1>
          <div className="flex items-center gap-6">
            <Link to={createPageUrl("BookRoom")} className="text-white/90 hover:text-white text-sm">
              Rooms
            </Link>
            <Link to={createPageUrl("MyReservations")} className="text-white/90 hover:text-white text-sm">
              My Reservations
            </Link>
            {isAuthenticated ? (
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-slate-900 border-white/50 hover:bg-white/10 hover:text-white"
              >
                Logout
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/login")}
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                Login
              </Button>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full -mt-20 px-6">
          <h2 className="text-4xl md:text-6xl font-light text-white text-center tracking-tight">
            Experience Luxury<br />Like Never Before
          </h2>
          <p className="text-white/80 mt-4 text-center max-w-md">
            Discover the perfect blend of comfort, elegance, and world-class hospitality
          </p>

          {/* Search Box */}
          <div className="mt-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Check-in
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Check-out
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Guests
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="border-slate-200"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-slate-900 hover:bg-slate-800 h-10"
                >
                  Search Rooms
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-slate-900">Why Choose Us</h3>
            <p className="text-slate-500 mt-2">Everything you need for a perfect stay</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Wifi, label: "Free WiFi", desc: "High-speed internet" },
              { icon: Coffee, label: "Breakfast", desc: "Complimentary" },
              { icon: Car, label: "Parking", desc: "Free valet service" },
              { icon: Dumbbell, label: "Fitness", desc: "24/7 gym access" }
            ].map((feature) => (
              <div key={feature.label} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h4 className="font-medium text-slate-800">{feature.label}</h4>
                <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Types Preview */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-slate-900">Our Rooms</h3>
            <p className="text-slate-500 mt-2">Find your perfect accommodation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: "Deluxe Room", price: 180, img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500" },
              { type: "Suite", price: 320, img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500" },
              { type: "Penthouse", price: 650, img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500" }
            ].map((room) => (
              <div key={room.type} className="group cursor-pointer" onClick={() => window.location.href = createPageUrl("BookRoom")}>
                <div className="relative h-64 rounded-2xl overflow-hidden mb-4">
                  <img src={room.img} alt={room.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-white font-medium text-lg">{room.type}</h4>
                    <p className="text-white/80 text-sm">From ${room.price}/night</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to={createPageUrl("BookRoom")}>
              <Button variant="outline" className="border-slate-300">
                View All Rooms
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-xl font-light">HotelHub</h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 123 Luxury Avenue, Paradise City
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <span className="text-sm text-slate-400 ml-2">5-Star Hotel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}