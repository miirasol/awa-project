import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LIMITS, tooLong } from "@/lib/limits";

export default function Profile() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", birthdate: "", address: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

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
    if (e) e.preventDefault();
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

  const initials = (() => {
    const parts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  })();

  const avatarSrc = avatarPreview || profile?.avatarUrl;
  const role = profile?.role;
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-26 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="size-26 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold">{initials}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold">{form.fullName || "Your name"}</span>
          {roleLabel && (
            <span className="rounded-full bg-muted text-[11px] px-2 py-0.5">{roleLabel}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
      </div>

      <Card className="rounded-xl border bg-card">
        <CardHeader className="p-5">
          <CardTitle className="text-[15px] font-semibold">Profile settings</CardTitle>
          <CardDescription className="text-[13px] text-muted-foreground">Update your personal information.</CardDescription>
        </CardHeader>
        <form id="profile-form" onSubmit={save}>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Avatar</Label>
              <Input
                type="file"
                accept="image/*"
                className="h-8 text-[13px] rounded-md"
                onChange={(e) => setAvatarFile(e.target.files[0])}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full name</Label>
                <Input
                  value={form.fullName}
                  maxLength={LIMITS.personName}
                  className="h-8 text-[13px] rounded-md"
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input
                  value={form.phone}
                  maxLength={LIMITS.phone}
                  className="h-8 text-[13px] rounded-md"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Birthdate</Label>
                <Input
                  type="date"
                  value={form.birthdate}
                  className="h-8 text-[13px] rounded-md"
                  onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  value={profile?.email || ""}
                  readOnly
                  className="h-8 text-[13px] rounded-md truncate"
                  title={profile?.email || ""}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">Address</Label>
                <Input
                  value={form.address}
                  maxLength={LIMITS.address}
                  className="h-8 text-[13px] rounded-md"
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/40 px-5 py-3 flex justify-end rounded-b-xl">
            <Button
              type="submit"
              form="profile-form"
              disabled={saving}
              className="h-8 text-[13px] rounded-md bg-black text-white hover:bg-black/90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}