import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/format";
import { LIMITS, tooLong } from "@/lib/limits";

export default function Services() {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", priceStart: "", priceMax: "", imageUrl: "", isActive: true });
  const [file, setFile] = useState(null);
const [loading, setLoading] = useState(true);
const [confirmDelete, setConfirmDelete] = useState(false);
const [deleteWarning, setDeleteWarning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "services"));
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const as = await getDocs(collection(db, "appointments"));
      setAppointments(as.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load services on mount
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", priceStart: "", priceMax: "", imageUrl: "", isActive: true });
    setFile(null);
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    const parts = String(s.priceRange || "").split("-").map((p) => p.trim()).filter(Boolean);
    setForm({ name: s.name, description: s.description, priceStart: parts[0] || "", priceMax: parts[1] || parts[0] || "", imageUrl: s.imageUrl || "", isActive: s.isActive });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (tooLong(form.name, LIMITS.serviceName)) { toast.error(`Name must be ${LIMITS.serviceName} characters or fewer`); return; }
    if (!form.priceStart || !form.priceMax) { toast.error("Start and max price are required"); return; }
    if (Number(form.priceStart) > Number(form.priceMax)) { toast.error("Max price must be at least start price"); return; }
    try {
      let imageUrl = form.imageUrl;
      if (file) imageUrl = await uploadImage(file);
      const priceRange = `${form.priceStart}-${form.priceMax}`;
      const data = { name: form.name.trim(), description: form.description, priceRange, imageUrl, isActive: form.isActive };
      if (editing) {
        await updateDoc(doc(db, "services", editing.id), data);
      } else {
        await addDoc(collection(db, "services"), { ...data, createdAt: serverTimestamp() });
      }
      setOpen(false);
      load();
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };

  const toggleActive = async (s) => {
    await updateDoc(doc(db, "services", s.id), { isActive: !s.isActive });
    load();
  };

  const requestDelete = () => {
    if (!editing) return;
    const active = appointments.filter((a) => a.serviceId === editing.id && (a.status === "confirmed" || a.status === "cancel_requested"));
    if (active.length > 0) {
      setDeleteWarning(true);
    } else {
      setConfirmDelete(true);
    }
  };

  const deleteService = async () => {
    if (!editing) return;
    try {
      await deleteDoc(doc(db, "services", editing.id));
      setConfirmDelete(false);
      setOpen(false);
      load();
      toast.success("Deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">Services</h1>
        <Button onClick={openNew}>Add service</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="w-full h-32 rounded" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
        {!loading && services.length === 0 && <p className="text-[#6b6b6b]">No services yet.</p>}
        {!loading && services.map((s) => (
          <Card key={s.id} className="h-full">
            <CardContent className="p-4 flex flex-1 flex-col gap-2">
              {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-32 object-cover rounded" />}
              <h3 className="font-semibold break-words">{s.name}</h3>
              <p className="text-sm text-muted-foreground break-words">{s.description}</p>
              <p className="text-sm">{formatPrice(s.priceRange)}</p>
              <div className="mt-auto pt-2 flex flex-col gap-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(s)}>Edit</Button>
                <div className="flex items-center gap-2">
                  <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                  <span className="text-sm">{s.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} maxLength={LIMITS.serviceName} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start price</Label><Input type="number" value={form.priceStart} onChange={(e) => setForm({ ...form, priceStart: e.target.value })} /></div>
              <div><Label>Max price</Label><Input type="number" value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })} /></div>
            </div>
            <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            {editing && (
              <Button variant="destructive" onClick={requestDelete}>Delete service</Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this service?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6b6b6b]">This will remove it from the list. Existing appointments keep the service name.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteService}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteWarning} onOpenChange={setDeleteWarning}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete service with active appointments?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6b6b6b]">
            This service has active appointments. It won't be bookable anymore, but it won't affect existing listings.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWarning(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDeleteWarning(false); deleteService(); }}>Delete anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}