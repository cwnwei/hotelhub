import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Search, Star, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

export default function GuestTable({ guests, onEdit }) {
  const [search, setSearch] = useState("");

  const filteredGuests = guests.filter(g => 
    g.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-slate-200"
        />
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-medium text-slate-600">Guest</TableHead>
              <TableHead className="font-medium text-slate-600">Contact</TableHead>
              <TableHead className="font-medium text-slate-600">ID</TableHead>
              <TableHead className="font-medium text-slate-600">Registered</TableHead>
              <TableHead className="font-medium text-slate-600 w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No guests found
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests.map((guest) => (
                <TableRow key={guest.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {guest.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{guest.full_name}</span>
                          {guest.vip && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {guest.nationality && (
                          <span className="text-xs text-slate-400">{guest.nationality}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {guest.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {guest.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {guest.id_type && guest.id_number && (
                      <div>
                        <Badge variant="outline" className="capitalize text-xs border-slate-200">
                          {guest.id_type?.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">{guest.id_number}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(guest.created_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onEdit(guest)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}