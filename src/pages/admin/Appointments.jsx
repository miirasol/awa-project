import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { approveCancellation, rejectCancellation, markCompleted, markNoShow, cancelAppointment } from "@/lib/appointments";
import { slotId, toDateString } from "@/lib/dates";
import { statusLabel, formatDate, formatTime } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";
export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [users, setUsers] = useState({});
  const [tab, setTab] = useState("cancellations");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [detailsAppt, setDetailsAppt] = useState(null);
  useEffect(() => {
    const unsubAppts = onSnapshot(collection(db, "appointments"), (snap) => {
      setAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setUsers(map);
    });
    return () => { unsubAppts(); unsubUsers(); };
  }, []);

  const nameOf = (uid) => users[uid]?.fullName?.trim() || users[uid]?.email || "Unnamed patient";
  const phoneOf = (uid) => users[uid]?.phone || "";

  const now = new Date();
  const todayStr = toDateString(new Date());
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
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-[#6b6b6b] break-words">Cancellation requests</p><p className="text-2xl font-semibold">{cancellationRequests.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#6b6b6b] break-words">Today's appointments</p><p className="text-2xl font-semibold">{todayAppts.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[#6b6b6b] break-words">Upcoming confirmed</p><p className="text-2xl font-semibold">{upcomingConfirmed}</p></CardContent></Card>
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
              <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
                <div className="min-w-0 break-words">
                  <p className="font-semibold"><Link to={`/admin/patients/${a.patientId}`}>{nameOf(a.patientId)}</Link> · {phoneOf(a.patientId)}</p>
                  <p className="text-sm text-[#6b6b6b]">{formatDate(a.date)} {formatTime(a.time)} · {a.serviceName}</p>
                  {a.reason && <p className="text-sm">Reason: {a.reason}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => setConfirm({ fn: approveCancellation, appt: a })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(rejectCancellation, a)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {cancellationRequests.length === 0 && <p className="text-[#6b6b6b]">No cancellation requests.</p>}
        </TabsContent>
        <TabsContent value="today" className="space-y-3">
          {todayAppts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex justify-between items-center gap-3">
                <div className="min-w-0 break-words">
                  <p className="font-semibold">{formatTime(a.time)} · <Link to={`/admin/patients/${a.patientId}`}>{nameOf(a.patientId)}</Link></p>
                  <p className="text-sm text-[#6b6b6b]">{a.serviceName}</p>
                </div>
                <Badge>{statusLabel(a.status)}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#6b6b6b]">Search</label>
              <Input placeholder="Search patient" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#6b6b6b]">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue>{statusFilter === "all" ? "All statuses" : statusLabel(statusFilter)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancel_requested">Cancel requested</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#6b6b6b]">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-44" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#6b6b6b]">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-44" />
            </div>
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
              {filteredAll.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-[#6b6b6b]">No appointments found.</TableCell></TableRow>
              )}
              {filteredAll.map((a) => {
                const past = a.startAt.toDate() < now;
                return (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>{formatTime(a.time)}</TableCell>
                    <TableCell><Link to={`/admin/patients/${a.patientId}`}>{nameOf(a.patientId)}</Link></TableCell>
                    <TableCell>{a.serviceName}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabel(a.status)}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setDetailsAppt(a)}>Details</Button>                      {a.status === "confirmed" && past && (
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
      <AppointmentDetailsDialog open={!!detailsAppt} onOpenChange={() => setDetailsAppt(null)} appointment={detailsAppt} patientName={detailsAppt ? nameOf(detailsAppt.patientId) : ""} />
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>        <DialogContent>
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