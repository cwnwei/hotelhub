import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelClient } from "@/api/hotelClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Hotel, MapPin, Phone, Mail, Star, Loader2 } from "lucide-react";

function HotelForm({ hotel, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: hotel?.name || "",
    address: hotel?.address || "",
    city: hotel?.city || "",
    country: hotel?.country || "",
    phone: hotel?.phone || "",
    email: hotel?.email || "",
    star_rating: hotel?.star_rating || 4,
    image_url: hotel?.image_url || "",
    description: hotel?.description || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, star_rating: Number(formData.star_rating) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{hotel ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Hotel Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Grand Palace Hotel" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="New York" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="USA" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-2">
              <Label>Star Rating</Label>
              <Input type="number" min="1" max="5" value={formData.star_rating} onChange={(e) => setFormData({ ...formData, star_rating: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@hotel.com" />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief hotel description..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {hotel ? "Save Changes" : "Add Hotel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Hotels() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const queryClient = useQueryClient();

  const { data: hotelsData, isLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: () => hotelClient.list(),
    retry: false,
  });

  const hotels = hotelsData?.length > 0 ? hotelsData : [];

  const saveMutation = useMutation({
    mutationFn: (data) => editingHotel
  ? hotelClient.update(editingHotel.id, data)
  : hotelClient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      setFormOpen(false);
      setEditingHotel(null);
    }
  });

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingHotel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">Hotels</h1>
            <p className="text-slate-500 mt-1">Manage your hotel chain</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Hotel
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20">
            <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No hotels yet</p>
            <p className="text-slate-400 text-sm">Add your first hotel to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {hotel.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                  </div>
                )}
                {!hotel.image_url && (
                  <div className="h-40 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <Hotel className="w-12 h-12 text-amber-400" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{hotel.name}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(hotel)}>
                      <Pencil className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                  {hotel.star_rating && (
                    <div className="flex gap-0.5">
                      {[...Array(hotel.star_rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm text-slate-500">
                  {(hotel.city || hotel.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{[hotel.city, hotel.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {hotel.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{hotel.phone}</span>
                    </div>
                  )}
                  {hotel.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{hotel.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <HotelForm
          hotel={editingHotel}
          open={formOpen}
          onClose={handleClose}
          onSave={(data) => saveMutation.mutate(data)}
          isLoading={saveMutation.isPending}
        />
      </div>
    </div>
  );
}