import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { analyticsClient } from "@/api/analyticsClient";

export const ExportButtons = ({ filters }) => {
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const handleExportCSV = async () => {
        setIsExportingCSV(true);
        try {
            await analyticsClient.exportToCSV(filters);
        } catch (error) {
            console.error("Failed to export CSV:", error);
            alert("Failed to export CSV. Please try again.");
        } finally {
            setIsExportingCSV(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            await analyticsClient.exportToPDF(filters);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    return (
        <div className="flex gap-3">
            <Button
                onClick={handleExportCSV}
                variant="outline"
                disabled={isExportingCSV}
                className="border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
                {isExportingCSV ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                Export CSV
            </Button>
            <Button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 font-medium"
            >
                {isExportingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileText className="h-4 w-4" />
                )}
                Export PDF
            </Button>
        </div>
    );
};