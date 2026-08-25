import { useEffect, useState } from "react";
import { api } from "../api/client";
import { User, Booking } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

export function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(User & { bookings?: Booking[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", { params: search ? { search } : {} });
      setCustomers(data.customers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}`);
      setSelected(data.customer);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500">All registered users and their rental history.</p>
      </div>

      <input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-sm"
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.role}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(c.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          {detailLoading ? (
            <Spinner />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-slate-800">{selected.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-slate-800">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="text-slate-800">{selected.address || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">License #</p>
                  <p className="text-slate-800">{selected.licenseNumber || "—"}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Booking history</p>
                <div className="space-y-2">
                  {(selected.bookings ?? []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">
                          {b.vehicle?.make} {b.vehicle?.model}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                  {(selected.bookings ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">No bookings yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
