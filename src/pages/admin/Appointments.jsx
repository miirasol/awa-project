import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { approveCancellation, rejectCancellation, markCompleted, markNoShow, cancelAppointment } from "@/lib/appointments";
import { slotId } from "@/lib/dates";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [users, setUsers] = useState({});
  const [tab, setTab] = useState("cancellations");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "appointments"), (snap) => {
      setAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setUsers(map);
    })();
    return unsub;
  }, []);

  const nameOf = (uid) => users[uid]?.fullName || uid;
  const phoneOf = (uid) => users[uid]?.phone || "";

  const now = new Date();
  const todayStr = new Date().toISOString().slice(0, 10);
  const cancellationRequests = appts.filter((a) => a.status === "cancel_requested").sort((a, b) => a.startAt.toDate() - b.startAt.toDate());
  const todayAppts = appts.filter((a) => a.date === todayStr && a.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time));
  const upcomingConfirmed = appts.filter((a) => a.status === "confirmed" && a.startAt.toDate() > now).length;

  const filteredAll = appts.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    if (search && !nameOf(a.patientId).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.startAt.toDate() - b.startAt.toDate());

  const doAction = async (fn, appt) => {
    try { await fn(appt); toast.success("Done"); } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-[#737373] break-words">Cancellation requests</p><p className="text-2xl font-bold">{cancellationRequests.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#737373] break-words">Today's appointments</p><p className="text-2xl font-bold">{todayAppts.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#737373] break-words">Upcoming confirmed</p><p className="text-2xl font-bold">{upcomingConfirmed}</p></CardContent></Card>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cancellations">Cancellations</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="cancellations" className="space-y-3">
          {cancellationRequests.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{nameOf(a.patientId)} · {phoneOf(a.patientId)}</p>
                  <p className="text-sm text-[#737373]">{a.date} {a.time} · {a.serviceName}</p>
                  {a.reason && <p className="text-sm">Reason: {a.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setConfirm({ fn: approveCancellation, appt: a })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(rejectCancellation, a)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {cancellationRequests.length === 0 && <p className="text-[#737373]">No cancellation requests.</p>}
        </TabsContent>
        <TabsContent value="today" className="space-y-3">
          {todayAppts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{a.time} · {nameOf(a.patientId)}</p>
                  <p className="text-sm text-[#737373]">{a.serviceName}</p>
                </div>
                <Badge>{a.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search patient" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancel_requested">Cancel requested</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No show</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAll.map((a) => {
                const past = a.startAt.toDate() < now;
                return (
                  <TableRow key={a.id}>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>{nameOf(a.patientId)}</TableCell>
                    <TableCell>{a.serviceName}</TableCell>
                    <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      {a.status === "confirmed" && past && (
                        <>
                          <Button size="sm" onClick={() => doAction(markCompleted, a)}>Complete</Button>
                          <Button size="sm" variant="outline" onClick={() => doAction(markNoShow, a)}>No-show</Button>
                        </>
                      )}
                      {a.status === "confirmed" && !past && (
                        <Button size="sm" variant="outline" onClick={() => setConfirm({ fn: cancelAppointment, appt: a })}>Cancel</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm action</DialogTitle></DialogHeader>
          <p>Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>No</Button>
            <Button onClick={() => doAction(confirm.fn, confirm.appt)}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}