import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { analyticsClient } from "@/api/analyticsClient";
import { DollarSign, CheckCircle, Clock } from "lucide-react";

export const PaymentStatusCard = ({ filters }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await analyticsClient.getRevenueReport(filters);
                setData(response.summary);
            } catch (error) {
                console.error("Failed to fetch payment data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [filters]);

    if (isLoading) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                <div className="h-40 flex items-center justify-center">Loading...</div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-green-900">Paid</p>
                            <p className="text-xs text-green-600">Completed payments</p>
                        </div>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                        ${(data?.totalPaid || 0).toFixed(2)}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                            <p className="text-sm font-medium text-amber-900">Pending</p>
                            <p className="text-xs text-amber-600">Outstanding balance</p>
                        </div>
                    </div>
                    <p className="text-lg font-semibold text-amber-900">
                        ${(data?.totalPending || 0).toFixed(2)}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-slate-600" />
                        <div>
                            <p className="text-sm font-medium text-slate-900">Total Revenue</p>
                            <p className="text-xs text-slate-600">All time</p>
                        </div>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                        ${(data?.totalRevenue || 0).toFixed(2)}
                    </p>
                </div>
            </div>
        </Card>
    );
};
