import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelAppointment, requestCancellation } from "@/lib/appointments";
import { canCancelDirectly, canRequestCancel } from "@/lib/dates";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";
import { statusLabel } from "@/lib/format";
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);
  const [records, setRecords] = useState([]);
  const [confirmAppt, setConfirmAppt] = useState(null);
  const [action, setAction] = useState(null);
  const [detailsAppt, setDetailsAppt] = useState(null);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "appointments"), where("patientId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const rq = query(collection(db, "visitRecords"), where("patientId", "==", user.uid));
    const unsub2 = onSnapshot(rq, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub(); unsub2(); };
  }, [user]);

  const now = new Date();
  const upcoming = appts
    .filter((a) => a.startAt.toDate() > now && (a.status === "confirmed" || a.status === "cancel_requested"))
    .sort((a, b) => a.startAt.toDate() - b.startAt.toDate());
  const past = appts
    .filter((a) => a.startAt.toDate() <= now)
    .sort((a, b) => b.startAt.toDate() - a.startAt.toDate());

  const fmt = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const historyItems = (() => {
    const completed = past.filter((a) => a.status === "completed");
    const items = completed.map((a) => ({ kind: "appt", appt: a, record: records.find((r) => r.appointmentId === a.id) || null }));
    const orphanRecords = records.filter((r) => !completed.some((a) => a.id === r.appointmentId));
    orphanRecords.forEach((r) => items.push({ kind: "record", record: r, appt: null }));
    items.sort((x, y) => {
      const parseDate = (s) => { const [yy, mm, dd] = String(s).split("-").map(Number); return new Date(yy, mm - 1, dd); };
      const dx = x.appt ? x.appt.startAt.toDate() : parseDate(x.record.date);
      const dy = y.appt ? y.appt.startAt.toDate() : parseDate(y.record.date);
      return dy - dx;
    });
    return items;
  })();

  const doCancel = async () => {
    try {
      if (action === "cancel") await cancelAppointment(confirmAppt);
      else await requestCancellation(confirmAppt);
      toast.success("Done");
    } catch (e) { toast.error(e.message); }
    setConfirmAppt(null); setAction(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#6b6b6b]">Patient dashboard</p>
        <h1 className="text-4xl font-medium">Welcome back</h1>
        <p className="text-[#6b6b6b]">{upcoming.length} upcoming appointments · {historyItems.length} past visits</p>
      </div>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">Visit history ({historyItems.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 && (
            <Card><CardContent className="p-6 text-center">
              <p>No upcoming appointments</p>
              <Button className="mt-3" onClick={() => navigate("/book")}>Book an appointment</Button>
            </CardContent></Card>
          )}
          {upcoming.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{a.serviceName}</p>
                  <p className="text-sm text-[#6b6b6b]">{a.date} {a.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDetailsAppt(a)}>Details</Button>
                  <Badge variant="outline">{statusLabel(a.status)}</Badge>                  {a.status === "confirmed" && canCancelDirectly(a) && (
                    <Button variant="outline" size="sm" onClick={() => { setConfirmAppt(a); setAction("cancel"); }}>Cancel</Button>
                  )}
                  {a.status === "confirmed" && !canCancelDirectly(a) && canRequestCancel(a) && (
                    <Button variant="outline" size="sm" onClick={() => { setConfirmAppt(a); setAction("request"); }}>Request cancellation</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {historyItems.length === 0 && (
            <Card><CardContent className="p-6 text-center">
              <p>No past visits</p>
              <Button className="mt-3" onClick={() => navigate("/book")}>Book an appointment</Button>
            </CardContent></Card>
          )}
          {historyItems.map((item) => {
            const a = item.appt;
            const r = item.record;
            const label = a ? a.serviceName : (r?.procedure || "Visit");
            const dateStr = a ? fmt(a.startAt.toDate()) : (r?.date || "");
            return (
            <Card key={item.kind === "appt" ? a.id : r.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{label}</p>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <p className="text-sm text-[#6b6b6b]">{dateStr}</p>
                {r?.procedure && <p className="text-sm mt-1">{r.procedure}</p>}
                {r?.notes && <p className="text-sm mt-1">{r.notes}</p>}
                {r?.nextVisitSuggestion && <p className="text-sm text-[#6b6b6b]">Next: {r.nextVisitSuggestion}</p>}
                {r?.attachmentUrls?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.attachmentUrls.map((u, i) => <img key={i} src={u} alt={`Attachment ${i + 1}`} className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => window.open(u, "_blank")} />)}
                  </div>
                )}
                {a && <Button className="mt-2" variant="outline" size="sm" onClick={() => setDetailsAppt(a)}>Details</Button>}
              </CardContent>
            </Card>
            );
          })}        </TabsContent>
      </Tabs>
      <AppointmentDetailsDialog open={!!detailsAppt} onOpenChange={() => setDetailsAppt(null)} appointment={detailsAppt} record={detailsAppt ? records.find((r) => r.appointmentId === detailsAppt.id) : null} />
      <Dialog open={!!confirmAppt} onOpenChange={() => setConfirmAppt(null)}>        <DialogContent>
          <DialogHeader><DialogTitle>Confirm</DialogTitle></DialogHeader>
          <p>Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAppt(null)}>No</Button>
            <Button onClick={doCancel}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}