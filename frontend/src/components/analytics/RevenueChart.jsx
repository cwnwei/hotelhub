import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsClient } from "@/api/analyticsClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const RevenueChart = ({ filters }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRevenue = async () => {
            setIsLoading(true);
            try {
                const response = await analyticsClient.getRevenueReport(filters);
                setData(response.byMonth || []);
            } catch (error) {
                console.error("Failed to fetch revenue:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevenue();
    }, [filters]);

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Month</h3>
            {isLoading ? (
                <div className="h-80 flex items-center justify-center">Loading...</div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
};
