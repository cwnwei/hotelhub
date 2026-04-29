import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export const DateFilter = ({ onFilter }) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleFilter = () => {
        onFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined
        });
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        onFilter({});
    };

    const hasFilters = startDate || endDate;

    return (
        <Card className="p-6 border-0 rounded-xl shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                    <Label htmlFor="start-date" className="text-sm font-medium text-slate-700">
                        Start Date
                    </Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-2 border-slate-200 rounded-lg"
                    />
                </div>
                <div className="flex-1">
                    <Label htmlFor="end-date" className="text-sm font-medium text-slate-700">
                        End Date
                    </Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-2 border-slate-200 rounded-lg"
                    />
                </div>
                <Button 
                    onClick={handleFilter} 
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
                >
                    Apply Filter
                </Button>
                {hasFilters && (
                    <Button 
                        onClick={handleReset} 
                        variant="outline"
                        className="border-slate-200 rounded-lg"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                )}
            </div>
        </Card>
    );
};