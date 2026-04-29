import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsClient } from "@/api/analyticsClient";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const OccupancyBreakdown = ({ filters }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchOccupancy = async () => {
            setIsLoading(true);
            try {
                const response = await analyticsClient.getOccupancyReport(filters);
                const formatted = (response.byRoomType || []).map(item => ({
                    name: item._id || 'Unknown',
                    value: item.count
                }));
                setData(formatted);
            } catch (error) {
                console.error("Failed to fetch occupancy:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOccupancy();
    }, [filters]);

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rooms by Type</h3>
            {isLoading ? (
                <div className="h-80 flex items-center justify-center">Loading...</div>
            ) : data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                    No room data available
                </div>
            )}
        </Card>
    );
};
