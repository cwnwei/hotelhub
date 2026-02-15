import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UserCheck, LogOut, CalendarPlus, XCircle } from "lucide-react";

const activityIcons = {
  checked_in: { icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  checked_out: { icon: LogOut, color: "text-blue-600", bg: "bg-blue-50" },
  confirmed: { icon: CalendarPlus, color: "text-amber-600", bg: "bg-amber-50" },
  cancelled: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" }
};

export default function RecentActivity({ reservations }) {
  const recentReservations = reservations
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-slate-800">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentReservations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
        ) : (
          recentReservations.map((res) => {
            const activity = activityIcons[res.status] || activityIcons.confirmed;
            const Icon = activity.icon;
            return (
              <div key={res.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`p-2.5 rounded-xl ${activity.bg}`}>
                  <Icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {res.guest_name || "Guest"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Room {res.room_number} • {format(new Date(res.updated_date), "MMM d, h:mm a")}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600 border-0">
                  {res.status?.replace("_", " ")}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}