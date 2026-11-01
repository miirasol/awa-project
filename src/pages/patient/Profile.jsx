import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LIMITS, tooLong } from "@/lib/limits";

export default function Profile() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", birthdate: "", address: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm({ fullName: d.fullName || "", phone: d.phone || "", birthdate: d.birthdate || "", address: d.address || "" });
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!form.fullName?.trim()) { toast.error("Full name is required"); return; }
    if (tooLong(form.fullName, LIMITS.personName)) { toast.error(`Name must be ${LIMITS.personName} characters or fewer`); return; }
    if (tooLong(form.address, LIMITS.address)) { toast.error(`Address must be ${LIMITS.address} characters or fewer`); return; }
    if (form.phone && !/^[0-9+\-()\s]{6,}$/.test(form.phone)) { toast.error("Invalid phone number"); return; }
    setSaving(true);
    try {
      const data = { ...form, fullName: form.fullName.trim(), address: form.address.trim(), phone: form.phone.trim() };
      if (avatarFile) data.avatarUrl = await uploadImage(avatarFile);
      await updateDoc(doc(db, "users", user.uid), data);
      toast.success("Saved");
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Profile settings</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Avatar</Label>
              <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
              {profile?.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full mt-2" />}
            </div>
            <div><Label>Full name</Label><Input value={form.fullName} maxLength={LIMITS.personName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} maxLength={LIMITS.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Birthdate</Label><Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address} maxLength={LIMITS.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={profile?.email || ""} readOnly className="truncate" title={profile?.email || ""} /></div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}