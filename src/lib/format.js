export function formatPrice(priceRange) {
  if (!priceRange) return "";
  const parts = String(priceRange).split("-").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const formatted = parts.map((p) => {
    const n = Number(p);
    if (Number.isNaN(n)) return "₱" + p;
    return "₱" + n.toLocaleString("en-PH");
  });
  return formatted.join(" – ");
}

export const STATUS_LABELS = {
  confirmed: "Confirmed",
  cancel_requested: "Cancel requested",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(time) {
  return to12Hour(time);
}

export function to12Hour(time) {
  if (!time) return "";
  const [h, m] = String(time).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}