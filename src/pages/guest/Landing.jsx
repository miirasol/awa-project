import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/dental clinic.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, to12Hour } from "@/lib/format";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, "settings", "clinic"));
      if (s.exists()) setSettings(s.data());
      const sv = await getDocs(collection(db, "services"));
      setServices(sv.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.isActive));
    })();
  }, []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const specialties = [
    { title: "General Dentistry", desc: "check-ups, cleanings, and fillings" },
    { title: "Orthodontics", desc: "braces and teeth alignment" },
    { title: "Esthetic Dentistry", desc: "whitening and smile improvement" },
    { title: "Oral Surgery", desc: "extractions and minor surgical procedures" },
    { title: "Prosthodontics", desc: "crowns, bridges, and dentures" },
  ];

  const container = "mx-auto w-full max-w-[1140px] px-6";

  return (
    <div className="space-y-12">
      <section id="hero" className={container}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm text-[#6b6b6b]">Care starts with you</p>
            <h1 className="text-5xl font-semibold tracking-tight mt-2">Book a dental visit with confidence</h1>
            <p className="text-[#6b6b6b] mt-3">Schedule your appointment in minutes.</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => navigate("/book")}>Book an appointment</Button>
              <Button variant="outline" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>View services</Button>
            </div>
          </div>
          <img src={heroImg} alt="Clinic" className="rounded-xl object-cover hidden md:block w-full max-w-[580px]" style={{ aspectRatio: "16/10" }} />
        </div>
      </section>
      <section id="services" className={container}>
        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className="rounded-xl border">
              <CardContent className="p-3">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-52 object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full h-52 rounded-lg border border-dashed bg-[#fafafa] mb-2" />
                )}
                <h3 className="font-medium">{s.name}</h3>
                <p className="text-sm text-[#6b6b6b]">{s.description}</p>
                <div className="border-t border-[#e5e5e5] my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{formatPrice(s.priceRange)}</span>
                  <Button variant="outline" size="sm" render={<Link to={`/book?service=${s.id}`} />}>
                    Book now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section id="about" className={container}>
        <h2 className="text-2xl font-semibold mb-4">About Us</h2>
        <p className="text-sm text-[#6b6b6b] mb-4">
          {settings?.aboutText || "Quality dental care, from check-ups to specialized treatments."}
        </p>
        <h3 className="text-lg font-semibold mb-3">Our specialties</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {specialties.map((sp) => (
            <Card key={sp.title} className="rounded-xl border">
              <CardContent className="p-4">
                <h4 className="font-medium">{sp.title}</h4>
                <p className="text-sm text-[#6b6b6b] mt-1">{sp.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {settings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl border">
              <CardContent className="p-4">
                <p className="text-xs text-[#6b6b6b]">Open days</p>
                <p className="font-semibold">{(settings.openDays || []).map((d) => days[d]).join(", ")}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border">
              <CardContent className="p-4">
                <p className="text-xs text-[#6b6b6b]">Hours</p>
                <p className="font-semibold">{to12Hour(settings.openTime)} – {to12Hour(settings.closeTime)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border">
              <CardContent className="p-4">
                <p className="text-xs text-[#6b6b6b]">Break</p>
                <p className="font-semibold">{to12Hour(settings.breakStart)} – {to12Hour(settings.breakEnd)}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
      <footer id="contact" className="w-full bg-[#f9f9f9] border-t border-[#e5e5e5]">
        <div className={container + " py-8"}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-semibold">Clinic Appointment System</p>
              <p className="text-sm text-[#6b6b6b] mt-2">{settings?.clinicName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Contact</p>
              <p className="text-sm text-[#6b6b6b]">{settings?.address}</p>
              <p className="text-sm text-[#6b6b6b]">{settings?.phone}</p>
              <p className="text-sm text-[#6b6b6b]">{settings?.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Clinic hours</p>
              <p className="text-sm text-[#6b6b6b]">{(settings?.openDays || []).map((d) => days[d]).join(", ")}</p>
              <p className="text-sm text-[#6b6b6b]">{to12Hour(settings?.openTime)} – {to12Hour(settings?.closeTime)}</p>
              <p className="text-sm text-[#6b6b6b]">Break: {to12Hour(settings?.breakStart)} – {to12Hour(settings?.breakEnd)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Account</p>
              <Link to="/login" className="block text-sm text-[#6b6b6b]">Log in</Link>
              <Link to="/register" className="block text-sm text-[#6b6b6b]">Register</Link>
            </div>
          </div>
          <p className="text-xs text-[#6b6b6b] mt-6">© 2026 Clinic Appointment System</p>
        </div>
      </footer>
    </div>
  );
}