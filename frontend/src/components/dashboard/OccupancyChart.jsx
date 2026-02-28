import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = {
  available: "#10B981",
  occupied: "#0F172A",
  maintenance: "#F59E0B",
  cleaning: "#6366F1"
};

const STATUS_LABELS = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  cleaning: "Cleaning"
};

export default function OccupancyChart({ rooms }) {
  const statusCounts = rooms.reduce((acc, room) => {
    const status = room.status || "available";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    status
  }));

  const occupancyRate = rooms.length > 0 
    ? Math.round((statusCounts.occupied || 0) / rooms.length * 100) 
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-slate-800">Room Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.status]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-light text-slate-900">{occupancyRate}%</span>
              <span className="text-xs text-slate-400">Occupied</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: COLORS[item.status] }}
              />
              <span className="text-sm text-slate-600">{item.name}</span>
              <span className="text-sm font-medium text-slate-800 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}