import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Search, Calendar, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const statusStyles = {
  confirmed: { bg: "bg-blue-50", text: "text-blue-700" },
  checked_in: { bg: "bg-emerald-50", text: "text-emerald-700" },
  checked_out: { bg: "bg-slate-100", text: "text-slate-600" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700" }
};

const paymentStyles = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  partial: { bg: "bg-orange-50", text: "text-orange-700" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700" }
};

export default function ReservationTable({ reservations, onEdit }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = reservations.filter(r => {
    const matchesSearch = 
      r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number?.includes(search);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by guest or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-slate-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-medium text-slate-600">Guest</TableHead>
              <TableHead className="font-medium text-slate-600">Room</TableHead>
              <TableHead className="font-medium text-slate-600">Dates</TableHead>
              <TableHead className="font-medium text-slate-600">Status</TableHead>
              <TableHead className="font-medium text-slate-600">Payment</TableHead>
              <TableHead className="font-medium text-slate-600 w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No reservations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((res) => {
                const status = statusStyles[res.status] || statusStyles.confirmed;
                const payment = paymentStyles[res.payment_status] || paymentStyles.pending;
                const nights = differenceInDays(new Date(res.check_out_date), new Date(res.check_in_date));
                
                return (
                  <TableRow key={res.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {res.guest_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{res.guest_name}</p>
                          <p className="text-xs text-slate-400">{res.num_guests} guest(s)</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">Room {res.room_number}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{format(new Date(res.check_in_date), "MMM d")} - {format(new Date(res.check_out_date), "MMM d")}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{nights} night(s)</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.bg} ${status.text} border-0 capitalize`}>
                        {res.status?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge className={`${payment.bg} ${payment.text} border-0 capitalize`}>
                          {res.payment_status}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <DollarSign className="w-3 h-3" />
                          <span>{res.amount_paid || 0} / {res.total_amount || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onEdit(res)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}