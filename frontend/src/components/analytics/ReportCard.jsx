import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ReportCard = ({ title, value, subtitle, isLoading = false, icon: Icon }) => {
    return (
        <Card className={cn(
            "p-6 border-0 rounded-xl shadow-sm",
            "bg-white hover:shadow-md transition-shadow duration-200",
            "flex flex-col"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    {isLoading ? (
                        <div className="mt-3 flex items-center justify-center h-10">
                            <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <p className="text-3xl font-light text-slate-900 mt-2 tracking-tight">{value}</p>
                            {subtitle && (
                                <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
                            )}
                        </>
                    )}
                </div>
                {Icon && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
                        <Icon className="h-5 w-5 text-amber-600" />
                    </div>
                )}
            </div>
        </Card>
    );
};