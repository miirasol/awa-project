import {
  runTransaction,
  writeBatch,
  updateDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slotId, toStartAt } from "@/lib/dates";

export async function bookAppointment({ uid, service, date, time, reason, photoUrl }) {
  const apptRef = doc(collection(db, "appointments"));
  const slotRef = doc(db, "slots", slotId(date, time));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(slotRef);
    if (snap.exists()) throw new Error("SLOT_TAKEN");
    tx.set(slotRef, { appointmentId: apptRef.id, patientId: uid, date, time });
    tx.set(apptRef, {
      patientId: uid,
      serviceId: service.id,
      serviceName: service.name,
      date,
      time,
      startAt: toStartAt(date, time),
      status: "confirmed",
      reason: reason || "",
      photoUrl: photoUrl || "",
      createdAt: serverTimestamp(),
    });
  });
  return apptRef.id;
}

export async function cancelAppointment(appt) {
  const batch = writeBatch(db);
  batch.update(doc(db, "appointments", appt.id), { status: "cancelled" });
  batch.delete(doc(db, "slots", slotId(appt.date, appt.time)));
  await batch.commit();
}

export const requestCancellation = (appt) =>
  updateDoc(doc(db, "appointments", appt.id), { status: "cancel_requested" });

export const approveCancellation = cancelAppointment;
export const rejectCancellation = (appt) => updateDoc(doc(db, "appointments", appt.id), { status: "confirmed" });
export const markCompleted = (appt) => updateDoc(doc(db, "appointments", appt.id), { status: "completed" });
export const markNoShow = (appt) => updateDoc(doc(db, "appointments", appt.id), { status: "no_show" });

export async function countUpcomingConfirmed(uid) {
  const q = query(collection(db, "appointments"), where("patientId", "==", uid));
  const snap = await getDocs(q);
  const now = new Date();
  return snap.docs.filter((d) => {
    const data = d.data();
    return data.status === "confirmed" && data.startAt.toDate() > now;
  }).length;
}
