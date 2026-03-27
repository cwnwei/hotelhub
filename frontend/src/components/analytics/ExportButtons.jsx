import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { analyticsClient } from "@/api/analyticsClient";

export const ExportButtons = ({ filters }) => {
    return (
        <div className="flex gap-3">
            <Button
                onClick={() => analyticsClient.exportToCSV(filters)}
                variant="outline"
                className="border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
                <Download className="h-4 w-4" />
                Export CSV
            </Button>
            <Button
                onClick={() => analyticsClient.exportToPDF(filters)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 font-medium"
            >
                <FileText className="h-4 w-4" />
                Export PDF
            </Button>
        </div>
    );
};