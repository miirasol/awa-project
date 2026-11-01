import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusLabel, formatDate, formatTime } from "@/lib/format";

export default function PatientDetail() {
  const { uid } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState([]);
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsAppt, setDetailsAppt] = useState(null);  const [editing, setEditing] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState("");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");
  const [nextVisit, setNextVisit] = useState("");
  const [files, setFiles] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);

  const load = async () => {
    setLoading(true);
    const p = await getDoc(doc(db, "users", uid));
    if (p.exists()) setPatient({ id: p.id, ...p.data() });
    const a = await getDocs(query(collection(db, "appointments"), where("patientId", "==", uid)));
    setAppts(a.docs.map((d) => ({ id: d.id, ...d.data() })));
    const r = await getDocs(query(collection(db, "visitRecords"), where("patientId", "==", uid)));
    setRecords(r.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [uid]);

  const completedWithoutRecord = appts.filter((a) => a.status === "completed" && !records.some((r) => r.appointmentId === a.id));

  const openNew = () => {
    if (completedWithoutRecord.length === 0) {
      toast.error("No completed appointments without a record yet");
      return;
    }
    setEditing(null);
    setSelectedAppt(completedWithoutRecord[0]?.id || "");
    setProcedure("");
    setNotes("");
    setNextVisit("");
    setFiles([]);
    setExistingUrls([]);
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setSelectedAppt(r.appointmentId);
    setProcedure(r.procedure);
    setNotes(r.notes);
    setNextVisit(r.nextVisitSuggestion || "");
    setFiles([]);
    setExistingUrls(r.attachmentUrls || []);
    setOpen(true);
  };

  const save = async () => {
    if (!procedure.trim()) { toast.error("Procedure is required"); return; }
    try {
      const urls = [...existingUrls];
      for (const f of files) urls.push(await uploadImage(f));
      const data = { appointmentId: selectedAppt, patientId: uid, procedure, notes, nextVisitSuggestion: nextVisit, attachmentUrls: urls };
      if (editing) {
        await updateDoc(doc(db, "visitRecords", editing.id), data);
      } else {
        const appt = appts.find((a) => a.id === selectedAppt);
        await addDoc(collection(db, "visitRecords"), { ...data, date: appt?.date || "", createdAt: serverTimestamp() });
      }
      setOpen(false);
      load();
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!patient) return <p className="text-[#6b6b6b]">Patient not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          {patient.avatarUrl && <img src={patient.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />}
          <div className="min-w-0 break-words">
            <h1 className="text-2xl font-semibold">{patient.fullName || "Unnamed patient"}</h1>
            <p className="text-sm text-[#6b6b6b] break-all">{patient.email} · {patient.phone}</p>
            <p className="text-sm text-[#6b6b6b]">{patient.birthdate} · {patient.address}</p>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="records">Visit records</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <div className="space-y-2">
            {appts.map((a) => (
              <Card key={a.id}><CardContent className="p-3 flex justify-between items-center">
                <span className="min-w-0 break-words">{formatDate(a.date)} {formatTime(a.time)} · {a.serviceName} · {statusLabel(a.status)}</span>
                <Button size="sm" variant="outline" onClick={() => setDetailsAppt(a)}>Details</Button>
              </CardContent></Card>
            ))}
          </div>        </TabsContent>
        <TabsContent value="records" className="space-y-3">
          <Button onClick={openNew}>Add visit record</Button>
          {records.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-1 break-words">
                <p className="font-semibold">{r.procedure}</p>
                <p className="text-sm text-[#6b6b6b]">{r.date}</p>
                {r.notes && <p className="text-sm">{r.notes}</p>}
                {r.nextVisitSuggestion && <p className="text-sm text-[#6b6b6b]">Next: {r.nextVisitSuggestion}</p>}
                {r.attachmentUrls?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.attachmentUrls.map((u, i) => <img key={i} src={u} alt={`Attachment ${i + 1}`} className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => window.open(u, "_blank")} />)}                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit visit record" : "Add visit record"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Appointment</Label>
                <select className="border rounded p-2 w-full" value={selectedAppt} onChange={(e) => setSelectedAppt(e.target.value)}>
                  {completedWithoutRecord.map((a) => (
                    <option key={a.id} value={a.id}>{formatDate(a.date)} {formatTime(a.time)} · {a.serviceName}</option>
                  ))}
                </select>
              </div>
            )}
            <div><Label>Procedure</Label><Input value={procedure} onChange={(e) => setProcedure(e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div><Label>Next visit suggestion</Label><Input value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} /></div>
            <div><Label>Images</Label><Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} /></div>
            {existingUrls.length > 0 && (
              <div className="flex gap-2">
                {existingUrls.map((u, i) => <img key={i} src={u} alt={`Attachment ${i + 1}`} className="w-12 h-12 object-cover rounded" />)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AppointmentDetailsDialog open={!!detailsAppt} onOpenChange={() => setDetailsAppt(null)} appointment={detailsAppt} />
    </div>
  );
}