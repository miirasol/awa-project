import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/format";

export default function Services() {
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", priceStart: "", priceMax: "", imageUrl: "", isActive: true });
  const [file, setFile] = useState(null);

  const load = async () => {
    const snap = await getDocs(collection(db, "services"));
    setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">Services</h1>
        <Button onClick={openNew}>Add service</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 space-y-2">
              {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-32 object-cover rounded" />}
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <p className="text-sm">{formatPrice(s.priceRange)}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                  <span className="text-sm">{s.isActive ? "Active" : "Inactive"}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
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
          <DialogFooter>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}