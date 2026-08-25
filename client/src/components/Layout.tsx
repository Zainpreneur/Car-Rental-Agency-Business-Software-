import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ICONS: Record<string, string> = {
  Dashboard: "📊",
  Vehicles: "🚗",
  Bookings: "📅",
  Customers: "👥",
  Maintenance: "🔧",
  Payments: "💳",
  Profile: "👤",
};

export function Layout() {
  const { user, logout } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  const navItems = [
    ...(isStaff ? [{ to: "/", label: "Dashboard" }] : []),
    { to: "/vehicles", label: "Vehicles" },
    { to: "/bookings", label: "Bookings" },
    ...(isStaff ? [{ to: "/customers", label: "Customers" }] : []),
    ...(isStaff ? [{ to: "/maintenance", label: "Maintenance" }] : []),
    ...(isStaff ? [{ to: "/payments", label: "Payments" }] : []),
    { to: "/profile", label: "Profile" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="text-base font-bold leading-tight text-slate-900">FleetRent</p>
            <p className="text-xs text-slate-500">Car Rental Agency</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <span>{ICONS[item.label]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="font-bold">FleetRent</span>
          </div>
          <button onClick={logout} className="text-sm font-medium text-slate-600">
            Sign out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
