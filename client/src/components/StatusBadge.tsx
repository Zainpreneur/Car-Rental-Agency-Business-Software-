const STYLES: Record<string, string> = {
  // Vehicle status
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RENTED: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  RETIRED: "bg-slate-200 text-slate-600",
  // Booking status
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-200 text-slate-600",
  CANCELLED: "bg-rose-100 text-rose-700",
  // Payment status
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-slate-200 text-slate-600",
  FAILED: "bg-rose-100 text-rose-700",
  // Maintenance status
  SCHEDULED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-200 text-slate-600";
  return <span className={`badge ${style}`}>{status.replace(/_/g, " ")}</span>;
}
