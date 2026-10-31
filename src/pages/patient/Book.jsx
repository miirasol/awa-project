import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { generateSlots, toDateString, slotId } from "@/lib/slots";
import { bookAppointment, countUpcomingConfirmed } from "@/lib/appointments";
import { uploadImage } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [taken, setTaken] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, "settings", "clinic"));
      if (s.exists()) setSettings(s.data());
      const sv = await getDocs(collection(db, "services"));
      const list = sv.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.isActive);
      setServices(list);
      const pre = searchParams.get("service");
      if (pre) {
        const found = list.find((x) => x.id === pre);
        if (found) { setSelectedService(found); setStep(2); }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!date || !settings) { setSlots([]); return; }
    const ds = toDateString(date);
    setSlots(generateSlots(settings, ds));
    const q = query(collection(db, "slots"), where("date", "==", ds));
    const unsub = onSnapshot(q, (snap) => {
      setTaken(new Set(snap.docs.map((d) => d.data().time)));
    });
    return unsub;
  }, [date, settings]);

  const cap = async () => {
    if (!user) return false;
    const n = await countUpcomingConfirmed(user.uid);
    if (n >= 2) {
      toast.error("You already have 2 upcoming appointments.");
      return true;
    }
    return false;
  };

  const disabledDay = (d) => {
    if (!settings) return true;
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (!settings.openDays.includes(d.getDay())) return true;
    if (settings.closedDates?.includes(toDateString(d))) return true;
    return false;
  };

  const doBook = async () => {
    if (await cap()) return;
    setBooking(true);
    try {
      let photoUrl = "";
      if (photoFile) photoUrl = await uploadImage(photoFile);
      const ds = toDateString(date);
      await bookAppointment({ uid: user.uid, service: selectedService, date: ds, time: selectedSlot, reason, photoUrl });
      setStep(4);
    } catch (e) {
      if (e.message === "SLOT_TAKEN" || e.code === "permission-denied") {
        toast.error("That time was just taken. Please pick another.");
        setSelectedSlot(null);
        setStep(2);
      } else {
        toast.error(e.message);
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Choose a service</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 space-y-2">
                {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-32 object-cover rounded" />}
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-[#737373]">{s.description}</p>
                <p className="text-sm">₱{s.priceRange}</p>
                <Button onClick={() => { setSelectedService(s); setStep(2); }}>Select</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const ds = date ? toDateString(date) : null;
    const morning = slots.filter((t) => t < "12:00");
    const afternoon = slots.filter((t) => t >= "12:00");
    const renderSlot = (t) => {
      const isTaken = taken.has(t);
      const isPast = ds === toDateString(new Date()) && t <= new Date().toTimeString().slice(0, 5);
      const disabled = isTaken || isPast;
      return (
        <Button
          key={t}
          variant={selectedSlot === t ? "default" : "outline"}
          disabled={disabled}
          onClick={() => setSelectedSlot(t)}
          className={disabled ? "line-through text-[#9a9a9a] bg-[#f3f3f3]" : ""}
        >
          {t}
        </Button>
      );
    };
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pick a date and time</h1>
          <Button variant="outline" onClick={() => setStep(1)}>Change service</Button>
        </div>
        <p className="text-sm text-[#737373]">Booking: {selectedService?.name}</p>
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <Calendar mode="single" selected={date} onSelect={setDate} disabled={disabledDay} />
              <p className="text-xs text-[#737373] mt-2">
                Closed days: {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].filter((_, i) => !settings.openDays.includes(i)).join(", ")}
              </p>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {date && (
              <>
                <div>
                  <p className="text-xs uppercase text-[#525252] mb-2">Morning</p>
                  <div className="grid grid-cols-3 gap-2">{morning.map(renderSlot)}</div>
                </div>
                <div>
                  <p className="text-xs uppercase text-[#525252] mb-2">Afternoon</p>
                  <div className="grid grid-cols-3 gap-2">{afternoon.map(renderSlot)}</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
          <Button disabled={!selectedSlot} onClick={() => setStep(3)}>Continue</Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Confirm</h1>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {toDateString(date)}</p>
            <p><strong>Time:</strong> {selectedSlot}</p>
            <p><strong>Location:</strong> {settings?.address}</p>
          </CardContent>
        </Card>
        <div>
          <Label>Reason for visit</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div>
          <Label>Photo (optional)</Label>
          <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
          <Button onClick={doBook} disabled={booking}>{booking ? "Booking..." : "Confirm booking"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-bold">Appointment booked</h1>
      <p>{selectedService?.name} · {toDateString(date)} · {selectedSlot}</p>
      <p className="text-sm text-[#737373]">You can review or cancel it from your dashboard.</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => navigate("/dashboard")}>View my appointments</Button>
        <Button variant="outline" onClick={() => { setStep(1); setSelectedService(null); setDate(null); setSelectedSlot(null); setReason(""); setPhotoFile(null); }}>Book another</Button>
      </div>
    </div>
  );
}