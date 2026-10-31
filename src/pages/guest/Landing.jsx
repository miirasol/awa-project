import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/dental clinic.jpg";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, "settings", "clinic"));
      if (s.exists()) setSettings(s.data());
      const sv = await getDocs(collection(db, "services"));
      setServices(sv.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.isActive));
    })();
  }, []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="space-y-12">
      <section id="hero" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#525252]">Care starts with you</p>
          <h1 className="text-4xl font-medium mt-2">Book a dental visit with confidence</h1>
          <p className="text-[#737373] mt-3">Schedule your appointment in minutes.</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => navigate("/book")}>Book an appointment</Button>
            <Button variant="link" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>View services</Button>
          </div>
        </div>
        <img src={heroImg} alt="Clinic" className="rounded-xl h-64 object-cover hidden md:block w-full" />
      </section>
      <section id="services">
        <h2 className="text-2xl font-medium mb-4">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-32 object-cover rounded mb-2" />}
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-[#737373]">{s.description}</p>
                <p className="text-sm mt-1">₱{s.priceRange.replace("-", " - ₱")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section id="about">
        <h2 className="text-2xl font-medium mb-4">Clinic hours</h2>
        {settings && (
          <div className="text-sm">
            <p>Open days: {(settings.openDays || []).map((d) => days[d]).join(", ")}</p>
            <p>{settings.openTime} - {settings.closeTime}</p>
            {settings.breakStart && <p>Break: {settings.breakStart} - {settings.breakEnd}</p>}
          </div>
        )}
      </section>
      <footer id="contact" className="border-t border-[#e5e5e5] pt-6 text-sm text-[#737373]">
        <p>{settings?.clinicName}</p>
        <p>{settings?.address}</p>
        <p>{settings?.phone} {settings?.email}</p>
      </footer>
    </div>
  );
}