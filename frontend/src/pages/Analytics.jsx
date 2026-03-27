import { useState, useEffect } from "react";
import { DateFilter } from "@/components/analytics/DateFilter";
import { ReportCard } from "@/components/analytics/ReportCard";
import { ExportButtons } from "@/components/analytics/ExportButtons";
import { BookingTrendsChart } from "@/components/analytics/BookingTrendsChart";
import { analyticsClient } from "@/api/analyticsClient";
import { DollarSign, Users, Home, TrendingUp } from "lucide-react";

export const Analytics = () => {
    const [filters, setFilters] = useState({});
    const [revenueData, setRevenueData] = useState(null);
    const [occupancyData, setOccupancyData] = useState(null);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    const [isLoadingOccupancy, setIsLoadingOccupancy] = useState(false);

    // Fetch revenue report
    useEffect(() => {
        const fetchRevenue = async () => {
            setIsLoadingRevenue(true);
            try {
                const data = await analyticsClient.getRevenueReport(filters);
                setRevenueData(data);
            } catch (error) {
                console.error("Failed to fetch revenue:", error);
            } finally {
                setIsLoadingRevenue(false);
            }
        };

        fetchRevenue();
    }, [filters]);

    // Fetch occupancy report
    useEffect(() => {
        const fetchOccupancy = async () => {
            setIsLoadingOccupancy(true);
            try {
                const data = await analyticsClient.getOccupancyReport(filters);
                setOccupancyData(data);
            } catch (error) {
                console.error("Failed to fetch occupancy:", error);
            } finally {
                setIsLoadingOccupancy(false);
            }
        };

        fetchOccupancy();
    }, [filters]);

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                            Analytics & Reports
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Business intelligence and performance metrics
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <ExportButtons filters={filters} />
                    </div>
                </div>

                {/* Filter and Export Section */}
                <div className="space-y-4">
                    <DateFilter onFilter={handleFilter} />
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ReportCard
                        title="Total Revenue"
                        value={`$${revenueData?.totalRevenue?.toFixed(2) || "0.00"}`}
                        subtitle={`${revenueData?.count || 0} bookings`}
                        isLoading={isLoadingRevenue}
                        icon={DollarSign}
                    />
                    <ReportCard
                        title="Occupancy Rate"
                        value={`${occupancyData?.occupancyRate || "0"}%`}
                        subtitle={`${occupancyData?.occupiedRooms || 0} of ${occupancyData?.totalRooms || 0} rooms`}
                        isLoading={isLoadingOccupancy}
                        icon={Home}
                    />
                    <ReportCard
                        title="Total Bookings"
                        value={revenueData?.count || "0"}
                        subtitle="For selected period"
                        isLoading={isLoadingRevenue}
                        icon={Users}
                    />
                    <ReportCard
                        title="Avg Revenue/Booking"
                        value={`$${revenueData && revenueData.count > 0 ? (revenueData.totalRevenue / revenueData.count).toFixed(2) : "0.00"}`}
                        subtitle="Average per booking"
                        isLoading={isLoadingRevenue}
                        icon={TrendingUp}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                    <BookingTrendsChart filters={filters} />
                </div>

            </div>
        </div>
    );
};

export default Analytics;