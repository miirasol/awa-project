import { doc, setDoc, collection, addDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const defaultSettings = {
  clinicName: "Your Dental Clinic",
  address: "",
  phone: "",
  email: "",
  openDays: [0, 3, 6],
  openTime: "09:00",
  closeTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  slotMinutes: 30,
  closedDates: [],
};

const sampleServices = [
  { name: "Consultation", description: "General dental consultation", priceRange: "300-500", isActive: true },
  { name: "Oral prophylaxis (cleaning)", description: "Teeth cleaning", priceRange: "500-800", isActive: true },
  { name: "Tooth filling", description: "Composite filling", priceRange: "800-1500", isActive: true },
  { name: "Tooth extraction", description: "Simple extraction", priceRange: "500-1000", isActive: true },
  { name: "Braces adjustment", description: "Orthodontic adjustment", priceRange: "1000-1500", isActive: true },
  { name: "Teeth whitening", description: "Whitening treatment", priceRange: "3000-5000", isActive: true },
];

export async function seedSampleData() {
  const settingsRef = doc(db, "settings", "clinic");
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) {
    await setDoc(settingsRef, defaultSettings);
  }
  const servicesCol = collection(db, "services");
  for (const s of sampleServices) {
    await addDoc(servicesCol, { ...s, createdAt: serverTimestamp() });
  }
}
