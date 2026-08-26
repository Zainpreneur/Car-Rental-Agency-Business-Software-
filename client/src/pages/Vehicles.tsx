import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { FuelType, Transmission, Vehicle, VehicleCategory } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

const CATEGORIES: VehicleCategory[] = [
  "ECONOMY",
  "COMPACT",
  "SEDAN",
  "SUV",
  "LUXURY",
  "VAN",
  "TRUCK",
  "CONVERTIBLE",
];

const emptyForm = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  category: "ECONOMY" as VehicleCategory,
  licensePlate: "",
  color: "",
  seats: 5,
  transmission: "AUTOMATIC" as Transmission,
  fuelType: "PETROL" as FuelType,
  dailyRate: 0,
  mileage: 0,
  imageUrl: "",
  description: "",
  features: "",
};

export function Vehicles() {
  const { user } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (status) params.status = status;
      const { data } = await api.get("/vehicles", { params });
      setVehicles(data.vehicles);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  const filtered = useMemo(() => {
    if (!search) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.licensePlate.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      licensePlate: v.licensePlate,
      color: v.color ?? "",
      seats: v.seats,
      transmission: v.transmission,
      fuelType: v.fuelType,
      dailyRate: v.dailyRate,
      mileage: v.mileage,
      imageUrl: v.imageUrl ?? "",
      description: v.description ?? "",
      features: v.features ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, form);
      } else {
        await api.post("/vehicles", form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save vehicle"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(v: Vehicle) {
    if (!confirm(`Delete ${v.make} ${v.model} (${v.licensePlate})?`)) return;
    try {
      await api.delete(`/vehicles/${v.id}`);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Could not delete vehicle"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
          <p className="text-sm text-slate-500">Browse and manage the rental fleet.</p>
        </div>
        {isStaff && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search make, model, plate…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RENTED">Rented</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-40 w-full bg-slate-100">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🚗</div>
                )}
                <div className="absolute right-2 top-2">
                  <StatusBadge status={v.status} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {v.make} {v.model}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.year} · {v.category} · {v.licensePlate}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{v.seats} seats</span>
                  <span>·</span>
                  <span>{v.transmission}</span>
                  <span>·</span>
                  <span>{v.fuelType}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900">
                    ${v.dailyRate.toFixed(2)}
                    <span className="text-xs font-normal text-slate-500">/day</span>
                  </p>
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Details
                  </Link>
                </div>
                {isStaff && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(v)}
                      className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(v)}
                      className="flex-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-slate-400">No vehicles match your filters.</p>
          )}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Vehicle" : "Add Vehicle"} onClose={() => setShowForm(false)} wide>
          {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Make">
              <input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="input" />
            </Field>
            <Field label="Model">
              <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input" />
            </Field>
            <Field label="Year">
              <input
                type="number"
                required
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as VehicleCategory })}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="License Plate">
              <input
                required
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Color">
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input" />
            </Field>
            <Field label="Seats">
              <input
                type="number"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Transmission">
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value as "AUTOMATIC" | "MANUAL" })}
                className="input"
              >
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </Field>
            <Field label="Fuel Type">
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as typeof form.fuelType })}
                className="input"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </Field>
            <Field label="Daily Rate ($)">
              <input
                type="number"
                step="0.01"
                required
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Mileage">
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Image URL">
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input" />
            </Field>
            <Field label="Features (comma-separated)" full>
              <input
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Description" full>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={3}
              />
            </Field>
            <div className="col-span-full mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Add vehicle"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block text-sm ${full ? "col-span-full" : ""}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
