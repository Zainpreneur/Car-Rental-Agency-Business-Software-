import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { DashboardStats } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">Unable to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Fleet overview and rental activity at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Fleet Size" value={stats.fleet.total} icon="🚗" accent="bg-brand-50" />
        <StatCard label="Available Now" value={stats.fleet.available} icon="✅" accent="bg-emerald-50" />
        <StatCard label="Active Rentals" value={stats.bookings.active} icon="📅" accent="bg-blue-50" />
        <StatCard
          label="Monthly Revenue"
          value={`$${stats.revenue.monthly.toLocaleString()}`}
          icon="💰"
          accent="bg-amber-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Fleet Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Available</span>
              <span className="font-semibold text-slate-900">{stats.fleet.available}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Rented</span>
              <span className="font-semibold text-slate-900">{stats.fleet.rented}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">In Maintenance</span>
              <span className="font-semibold text-slate-900">{stats.fleet.maintenance}</span>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Fleet Utilization</span>
                <span>{stats.fleet.utilization}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${stats.fleet.utilization}%` }}
                />
              </div>
            </div>
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">By Category</h3>
          <div className="space-y-1.5">
            {stats.fleet.byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{c.category}</span>
                <span className="font-medium text-slate-800">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Booking</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Vehicle</th>
                  <th className="pb-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.bookings.recent.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{b.bookingNumber}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{b.customer?.name}</td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
                {stats.bookings.recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {stats.bookings.upcomingReturns.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Upcoming Returns</h3>
              <ul className="space-y-2">
                {stats.bookings.upcomingReturns.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {b.vehicle?.make} {b.vehicle?.model} — {b.customer?.name}
                    </span>
                    <span className="font-medium text-slate-900">
                      {new Date(b.endDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
