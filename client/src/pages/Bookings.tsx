import { FormEvent, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Booking, BookingStatus, User, Vehicle } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

const NEXT_ACTIONS: Record<BookingStatus, { label: string; next: BookingStatus; style: string }[]> = {
  PENDING: [
    { label: "Confirm", next: "CONFIRMED", style: "bg-blue-600 hover:bg-blue-700" },
    { label: "Cancel", next: "CANCELLED", style: "bg-rose-600 hover:bg-rose-700" },
  ],
  CONFIRMED: [
    { label: "Check-in (Start Rental)", next: "ACTIVE", style: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Cancel", next: "CANCELLED", style: "bg-rose-600 hover:bg-rose-700" },
  ],
  ACTIVE: [
    { label: "Check-out (Complete)", next: "COMPLETED", style: "bg-slate-700 hover:bg-slate-800" },
    { label: "Cancel", next: "CANCELLED", style: "bg-rose-600 hover:bg-rose-700" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function Bookings() {
  const { user } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [newForm, setNewForm] = useState({
    vehicleId: "",
    customerId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    pickupLocation: "Downtown Branch",
    dropoffLocation: "Downtown Branch",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/bookings", { params });
      setBookings(data.bookings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function openNew() {
    setFormError(null);
    const [{ data: vData }, { data: cData }] = await Promise.all([
      api.get("/vehicles", { params: { status: "AVAILABLE" } }),
      isStaff ? api.get("/customers", { params: { role: "CUSTOMER" } }) : Promise.resolve({ data: { customers: [] } }),
    ]);
    setVehicles(vData.vehicles);
    setCustomers(cData.customers);
    setNewForm((f) => ({ ...f, vehicleId: vData.vehicles[0]?.id ?? "", customerId: cData.customers[0]?.id ?? "" }));
    setShowNew(true);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = { ...newForm };
      if (!isStaff) delete payload.customerId;
      await api.post("/bookings", payload);
      setShowNew(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Could not create booking"));
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(booking: Booking, next: BookingStatus) {
    if (next === "CANCELLED" && !confirm(`Cancel booking ${booking.bookingNumber}?`)) return;
    setActingOn(booking.id);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: next });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Could not update booking"));
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">
            {isStaff ? "Manage every reservation across the fleet." : "Track your rental reservations."}
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New Booking
        </button>
      </div>

      <div className="flex gap-2">
        {["", "PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Vehicle</th>
                  {isStaff && <th className="px-4 py-3">Customer</th>}
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{b.bookingNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.vehicle?.make} {b.vehicle?.model}
                      <div className="text-xs text-slate-400">{b.vehicle?.licensePlate}</div>
                    </td>
                    {isStaff && (
                      <td className="px-4 py-3 text-slate-600">
                        {b.customer?.name}
                        <div className="text-xs text-slate-400">{b.customer?.email}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">${b.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(isStaff
                          ? NEXT_ACTIONS[b.status]
                          : NEXT_ACTIONS[b.status].filter((a) => a.next === "CANCELLED")
                        ).map((action) => (
                          <button
                            key={action.next}
                            disabled={actingOn === b.id}
                            onClick={() => updateStatus(b, action.next)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${action.style}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={isStaff ? 7 : 6} className="px-4 py-10 text-center text-slate-400">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && (
        <Modal title="New Booking" onClose={() => setShowNew(false)}>
          {formError && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</div>}
          <form onSubmit={onCreate} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
              <select
                required
                value={newForm.vehicleId}
                onChange={(e) => setNewForm({ ...newForm, vehicleId: e.target.value })}
                className="input"
              >
                {vehicles.length === 0 && <option value="">No available vehicles</option>}
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} — ${v.dailyRate}/day
                  </option>
                ))}
              </select>
            </label>
            {isStaff && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Customer</span>
                <select
                  required
                  value={newForm.customerId}
                  onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })}
                  className="input"
                >
                  {customers.length === 0 && <option value="">No customers found</option>}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Start date</span>
                <input
                  type="date"
                  required
                  value={newForm.startDate}
                  onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">End date</span>
                <input
                  type="date"
                  required
                  value={newForm.endDate}
                  onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })}
                  className="input"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Pickup location</span>
              <input
                required
                value={newForm.pickupLocation}
                onChange={(e) => setNewForm({ ...newForm, pickupLocation: e.target.value })}
                className="input"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Dropoff location</span>
              <input
                required
                value={newForm.dropoffLocation}
                onChange={(e) => setNewForm({ ...newForm, dropoffLocation: e.target.value })}
                className="input"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newForm.vehicleId}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create Booking"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
