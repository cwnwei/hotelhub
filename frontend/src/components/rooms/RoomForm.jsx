import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const AMENITIES = ["WiFi", "TV", "AC", "Minibar", "Safe", "Balcony", "Sea View", "Coffee Machine"];

export default function RoomForm({ room, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "standard",
    floor: "",
    price_per_night: "",
    status: "available",
    max_guests: 2,
    amenities: [],
    image_url: ""
  });

  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number || "",
        room_type: room.room_type || "standard",
        floor: room.floor || "",
        price_per_night: room.price_per_night || "",
        status: room.status || "available",
        max_guests: room.max_guests || 2,
        amenities: room.amenities || [],
        image_url: room.image_url || ""
      });
    } else {
      setFormData({
        room_number: "",
        room_type: "standard",
        floor: "",
        price_per_night: "",
        status: "available",
        max_guests: 2,
        amenities: [],
        image_url: ""
      });
    }
  }, [room, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      floor: formData.floor ? Number(formData.floor) : null,
      price_per_night: Number(formData.price_per_night),
      max_guests: Number(formData.max_guests)
    });
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {room ? "Edit Room" : "Add New Room"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={formData.room_type} onValueChange={(v) => setFormData({ ...formData, room_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Price/Night</Label>
              <Input
                type="number"
                value={formData.price_per_night}
                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                placeholder="150"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Max Guests</Label>
              <Input
                type="number"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                min="1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-4 gap-3">
              {AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label htmlFor={amenity} className="text-sm text-slate-600 cursor-pointer">
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {room ? "Save Changes" : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}