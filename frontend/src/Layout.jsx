import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useState } from "react";
import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  CalendarDays,
  Menu,
  X,
  Hotel
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Rooms", page: "Rooms", icon: BedDouble },
  { name: "Guests", page: "Guests", icon: Users },
  { name: "Reservations", page: "Reservations", icon: CalendarDays }
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800">HotelHub</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/25">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-lg">HotelHub</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 lg:py-0 mt-16 lg:mt-0">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-amber-400" : "")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="px-4 py-3">
            <button
              onClick={() => { logout(); setSidebarOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Log out
            </button>
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
              <p className="text-sm font-medium text-amber-900">Need help?</p>
              <p className="text-xs text-amber-700 mt-1">Contact support for assistance</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}