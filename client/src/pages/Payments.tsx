import { FormEvent, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Booking, Payment, PaymentMethod } from "../types";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookingId: "",
    amount: 0,
    method: "CARD" as PaymentMethod,
    transactionRef: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [{ data: pData }, { data: bData }] = await Promise.all([
        api.get("/payments"),
        api.get("/bookings"),
      ]);
      setPayments(pData.payments);
      setBookings(bData.bookings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    const b = bookings[0];
    setForm({ bookingId: b?.id ?? "", amount: b?.totalAmount ?? 0, method: "CARD", transactionRef: "" });
    setError(null);
    setShowForm(true);
  }

  function onBookingChange(bookingId: string) {
    const b = bookings.find((x) => x.id === bookingId);
    setForm((f) => ({ ...f, bookingId, amount: b?.totalAmount ?? f.amount }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/payments", { ...form, status: "PAID" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not record payment"));
    } finally {
      setSaving(false);
    }
  }

  async function refund(payment: Payment) {
    if (!confirm("Mark this payment as refunded?")) return;
    try {
      await api.patch(`/payments/${payment.id}`, { status: "REFUNDED" });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Could not update payment"));
    }
  }

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">
            Total collected: <span className="font-semibold text-slate-800">${totalPaid.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Record Payment
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
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.booking?.bookingNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{p.booking?.customer?.name}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">${p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.method.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "PAID" && (
                      <button
                        onClick={() => refund(p)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Record Payment" onClose={() => setShowForm(false)}>
          {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Booking</span>
              <select
                required
                value={form.bookingId}
                onChange={(e) => onBookingChange(e.target.value)}
                className="input"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingNumber} — {b.customer?.name} (${b.totalAmount.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Amount ($)</span>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="input"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Method</span>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
                className="input"
              >
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Transaction reference (optional)</span>
              <input
                value={form.transactionRef}
                onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                className="input"
              />
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
                disabled={saving || !form.bookingId}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Record payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
