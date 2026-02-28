import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">
              {title}
            </p>
            <h3 className="text-3xl font-light text-slate-900 tracking-tight">
              {value}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
              <Icon className="w-5 h-5 text-amber-600" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className={cn(
              "text-sm font-medium",
              trend.positive ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend.positive ? "+" : ""}{trend.value}
            </span>
            <span className="text-sm text-slate-400 ml-2">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
}