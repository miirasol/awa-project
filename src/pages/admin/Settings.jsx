import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedSampleData } from "@/lib/seed";
import { toDateString as toDateStr } from "@/lib/dates";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Settings() {
  const [form, setForm] = useState({
    clinicName: "", address: "", phone: "", email: "",
    openDays: [], openTime: "09:00", closeTime: "17:00",
    breakStart: "", breakEnd: "", closedDates: [], slotMinutes: 30,
  });
  const [newClosed, setNewClosed] = useState("");
  const [newClosedEnd, setNewClosedEnd] = useState("");

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "settings", "clinic"));
      if (snap.exists()) setForm((prev) => ({ ...prev, ...snap.data(), slotMinutes: snap.data().slotMinutes ?? prev.slotMinutes }));
    })();
  }, []);

  const saveSchedule = async () => {
    try {
      await setDoc(doc(db, "settings", "clinic"), form, { merge: true });
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };

  const saveInfo = async () => {
    try {
      await setDoc(doc(db, "settings", "clinic"), {
        clinicName: form.clinicName, address: form.address, phone: form.phone, email: form.email,
      }, { merge: true });
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };

  const addClosed = async () => {
    if (!newClosed) return;
    if (newClosedEnd && newClosedEnd < newClosed) {
      toast.error("End date must be after start date");
      return;
    }
    const start = new Date(newClosed);
    const end = newClosedEnd ? new Date(newClosedEnd) : start;
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(toDateStr(d));
    }
    const updated = [...new Set([...(form.closedDates || []), ...dates])];
    setForm((f) => ({ ...f, closedDates: updated }));
    setNewClosed("");
    setNewClosedEnd("");
    try {
      await setDoc(doc(db, "settings", "clinic"), { closedDates: updated }, { merge: true });
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };
  const removeClosed = async (d) => {
    const updated = (form.closedDates || []).filter((x) => x !== d);
    setForm((f) => ({ ...f, closedDates: updated }));
    try {
      await setDoc(doc(db, "settings", "clinic"), { closedDates: updated }, { merge: true });
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
  };

  const toggleDay = (i) => {
    setForm((f) => ({
      ...f,
      openDays: f.openDays.includes(i) ? f.openDays.filter((x) => x !== i) : [...f.openDays, i],
    }));
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d, i) => (
              <label key={d} className="flex items-center gap-1">
                <Checkbox checked={form.openDays.includes(i)} onCheckedChange={() => toggleDay(i)} />
                {d}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Open time</Label><Input type="time" className="w-full" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} /></div>
            <div><Label>Close time</Label><Input type="time" className="w-full" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} /></div>
            <div><Label>Break start</Label><Input type="time" className="w-full" value={form.breakStart || ""} onChange={(e) => setForm({ ...form, breakStart: e.target.value })} /></div>
            <div><Label>Break end</Label><Input type="time" className="w-full" value={form.breakEnd || ""} onChange={(e) => setForm({ ...form, breakEnd: e.target.value })} /></div>
          </div>
          <p className="text-sm text-muted-foreground">Slot length: 30 min (fixed)</p>
          <Button onClick={saveSchedule}>Save schedule</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Closed dates</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="w-full"><Label>From</Label><Input type="date" className="w-full" value={newClosed} onChange={(e) => setNewClosed(e.target.value)} /></div>
            <div className="w-full"><Label>To</Label><Input type="date" className="w-full" value={newClosedEnd} onChange={(e) => setNewClosedEnd(e.target.value)} /></div>
            <Button onClick={addClosed}>Add</Button>
          </div>
          <p className="text-xs text-[#737373]">Leave end date empty for a single day.</p>
          <ul className="space-y-1">
            {(form.closedDates || []).map((d) => (
              <li key={d} className="flex justify-between">
                <span>{d}</span>
                <Button variant="ghost" size="sm" onClick={() => removeClosed(d)}>Remove</Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Clinic info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Clinic name</Label><Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <Button onClick={saveInfo}>Save info</Button>
        </CardContent>
      </Card>
      {import.meta.env.DEV && (
        <Card>
          <CardHeader><CardTitle>Dev only</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={async () => { try { await seedSampleData(); toast.success("Seeded"); } catch (e) { toast.error(e.message); } }}>
              Seed sample data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}