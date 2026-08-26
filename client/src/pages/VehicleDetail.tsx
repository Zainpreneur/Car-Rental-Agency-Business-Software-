import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Vehicle } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [pickupLocation, setPickupLocation] = useState("Downtown Branch");
  const [dropoffLocation, setDropoffLocation] = useState("Downtown Branch");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/vehicles/${id}`)
      .then(({ data }) => setVehicle(data.vehicle))
      .finally(() => setLoading(false));
  }, [id]);

  const days = Math.max(
    1,
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  const estimatedTotal = vehicle ? (days * vehicle.dailyRate).toFixed(2) : "0.00";

  async function onBook(e: FormEvent) {
    e.preventDefault();
    if (!vehicle) return;
    setError(null);
    setSuccess(null);
    setBooking(true);
    try {
      await api.post("/bookings", {
        vehicleId: vehicle.id,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        notes: notes || undefined,
      });
      setSuccess("Booking created! Redirecting to your bookings…");
      setTimeout(() => navigate("/bookings"), 1200);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create booking"));
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!vehicle) {
    return <p className="text-slate-500">Vehicle not found.</p>;
  }

  const bookable = vehicle.status === "AVAILABLE" || vehicle.status === "RENTED";
  const features = vehicle.features?.split(",").map((f) => f.trim()).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <Link to="/vehicles" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to fleet
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 w-full bg-slate-100">
            {vehicle.imageUrl ? (
              <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🚗</div>
            )}
            <div className="absolute right-3 top-3">
              <StatusBadge status={vehicle.status} />
            </div>
          </div>
          <div className="p-5">
            <h1 className="text-2xl font-bold text-slate-900">
              {vehicle.make} {vehicle.model} <span className="font-normal text-slate-400">{vehicle.year}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {vehicle.category} · {vehicle.licensePlate}
            </p>
            {vehicle.description && <p className="mt-3 text-sm text-slate-600">{vehicle.description}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Detail label="Seats" value={vehicle.seats} />
              <Detail label="Transmission" value={vehicle.transmission} />
              <Detail label="Fuel" value={vehicle.fuelType} />
              <Detail label="Mileage" value={`${vehicle.mileage.toLocaleString()} mi`} />
              {vehicle.color && <Detail label="Color" value={vehicle.color} />}
            </div>

            {features.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">Features</p>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-5 text-3xl font-bold text-slate-900">
              ${vehicle.dailyRate.toFixed(2)} <span className="text-sm font-normal text-slate-500">/ day</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Book this vehicle</h2>
          {!bookable && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              This vehicle is currently {vehicle.status.toLowerCase()} and not available for booking.
            </p>
          )}
          {error && <div className="mt-3 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}
          {success && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{success}</div>
          )}

          <form onSubmit={onBook} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Pickup date</span>
                <input
                  type="date"
                  required
                  min={todayISO()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Return date</span>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Pickup location</span>
              <input required value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="input" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Dropoff location</span>
              <input required value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} className="input" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
            </label>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>
                  {days} day{days > 1 ? "s" : ""} × ${vehicle.dailyRate.toFixed(2)}
                </span>
                <span className="font-semibold text-slate-900">${estimatedTotal}</span>
              </div>
            </div>

            {!user && <p className="text-sm text-slate-500">You'll need to sign in to complete a booking.</p>}

            <button
              type="submit"
              disabled={booking || !bookable}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {booking ? "Booking…" : "Reserve Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
