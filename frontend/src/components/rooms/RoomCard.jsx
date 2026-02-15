import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DoorOpen, Pencil, Wifi, Coffee, Tv, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  available: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Available" },
  occupied: { bg: "bg-slate-100", text: "text-slate-700", label: "Occupied" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", label: "Maintenance" },
  cleaning: { bg: "bg-violet-50", text: "text-violet-700", label: "Cleaning" }
};

const amenityIcons = {
  wifi: Wifi,
  coffee: Coffee,
  tv: Tv,
  ac: Wind
};

const roomTypeLabels = {
  standard: "Standard",
  deluxe: "Deluxe",
  suite: "Suite",
  penthouse: "Penthouse"
};

export default function RoomCard({ room, onEdit }) {
  const status = statusStyles[room.status] || statusStyles.available;

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {room.image_url ? (
          <img 
            src={room.image_url} 
            alt={`Room ${room.room_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DoorOpen className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <Badge className={cn(
          "absolute top-3 right-3 border-0 font-medium",
          status.bg, status.text
        )}>
          {status.label}
        </Badge>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Room {room.room_number}</h3>
            <p className="text-sm text-slate-500">{roomTypeLabels[room.room_type] || room.room_type}</p>
          </div>
          <p className="text-xl font-light text-slate-900">
            ${room.price_per_night}<span className="text-sm text-slate-400">/night</span>
          </p>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{room.max_guests || 2} guests</span>
          </div>
          {room.floor && (
            <div className="text-sm text-slate-500">
              Floor {room.floor}
            </div>
          )}
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {room.amenities.slice(0, 4).map((amenity, idx) => {
              const Icon = amenityIcons[amenity.toLowerCase()] || Wifi;
              return (
                <div key={idx} className="p-2 rounded-lg bg-slate-50" title={amenity}>
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
              );
            })}
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full border-slate-200 hover:bg-slate-50"
          onClick={() => onEdit(room)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Room
        </Button>
      </div>
    </Card>
  );
}