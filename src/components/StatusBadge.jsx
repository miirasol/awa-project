import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";

const STYLES = {
  confirmed: "border-sky-200 bg-sky-50 text-sky-700",
  cancel_requested: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  no_show: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-zinc-200 bg-zinc-100 text-zinc-500",
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={STYLES[status] || ""}>
      {statusLabel(status)}
    </Badge>
  );
}
