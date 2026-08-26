import { FormEvent, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType, Vehicle } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

const TYPES: MaintenanceType[] = ["SERVICE", "REPAIR", "INSPECTION", "CLEANING", "TIRE_CHANGE", "OTHER"];
const STATUSES: MaintenanceStatus[] = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleId: "",
    type: "SERVICE" as MaintenanceType,
    description: "",
    cost: 0,
    startDate: new Date().toISOString().slice(0, 10),
    status: "SCHEDULED" as MaintenanceStatus,
  });

  async function load() {
    setLoading(true);
    try {
      const [{ data: mData }, { data: vData }] = await Promise.all([
        api.get("/maintenance"),
        api.get("/vehicles"),
      ]);
      setRecords(mData.maintenance);
      setVehicles(vData.vehicles);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({
      vehicleId: vehicles[0]?.id ?? "",
      type: "SERVICE",
      description: "",
      cost: 0,
      startDate: new Date().toISOString().slice(0, 10),
      status: "SCHEDULED",
    });
    setError(null);
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/maintenance", form);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save maintenance record"));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(record: MaintenanceRecord, status: MaintenanceStatus) {
    try {
      await api.put(`/maintenance/${record.id}`, { status });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Could not update record"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-500">Track servicing, repairs, and vehicle downtime.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Log Maintenance
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.vehicle?.make} {r.vehicle?.model}
                    <div className="text-xs text-slate-400">{r.vehicle?.licensePlate}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600">{r.description}</td>
                  <td className="px-4 py-3 text-slate-600">${r.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {(r.status === "SCHEDULED" || r.status === "IN_PROGRESS") && (
                      <div className="flex gap-1.5">
                        {r.status === "SCHEDULED" && (
                          <button
                            onClick={() => updateStatus(r, "IN_PROGRESS")}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(r, "COMPLETED")}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(r, "CANCELLED")}
                          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No maintenance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Maintenance" onClose={() => setShowForm(false)}>
          {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
              <select
                required
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="input"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
                className="input"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Description</span>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={2}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Cost ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Start date</span>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
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
                {saving ? "Saving…" : "Save record"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
