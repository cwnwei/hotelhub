import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsClient } from "@/api/analyticsClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const BookingTrendsChart = ({ filters }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            try {
                const trends = await analyticsClient.getBookingTrends(filters);
                setData(trends);
            } catch (error) {
                console.error("Failed to fetch trends:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrends();
    }, [filters]);

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
            {isLoading ? (
                <div className="h-80 flex items-center justify-center">Loading...</div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Bookings" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
};