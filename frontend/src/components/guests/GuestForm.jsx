import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function GuestForm({ guest, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    id_type: "",
    id_number: "",
    nationality: "",
    address: "",
    notes: "",
    vip: false
  });

  useEffect(() => {
    if (guest) {
      setFormData({
        full_name: guest.full_name || "",
        email: guest.email || "",
        phone: guest.phone || "",
        id_type: guest.id_type || "",
        id_number: guest.id_number || "",
        nationality: guest.nationality || "",
        address: guest.address || "",
        notes: guest.notes || "",
        vip: guest.vip || false
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        id_type: "",
        id_number: "",
        nationality: "",
        address: "",
        notes: "",
        vip: false
      });
    }
  }, [guest, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {guest ? "Edit Guest" : "Add New Guest"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select value={formData.id_type} onValueChange={(v) => setFormData({ ...formData, id_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                placeholder="AB123456"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="United States"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special preferences or notes..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50">
            <div>
              <Label className="text-amber-900">VIP Guest</Label>
              <p className="text-xs text-amber-700">Mark as VIP for priority service</p>
            </div>
            <Switch
              checked={formData.vip}
              onCheckedChange={(checked) => setFormData({ ...formData, vip: checked })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {guest ? "Save Changes" : "Add Guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}