import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login, googleSignIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const afterLogin = (profile) => {
    const target = from || (profile?.role === "admin" ? "/admin/appointments" : "/dashboard");
    navigate(target, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await login(email, password, remember);
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      afterLogin(snap.exists() ? snap.data() : null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const cred = await googleSignIn();
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      afterLogin(snap.exists() ? snap.data() : null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader><CardTitle>Log in</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={setRemember} />
              <span className="text-sm">Remember me</span>
            </div>
            <Button type="submit" disabled={loading} className="w-full">Log In</Button>
            <button type="button" onClick={forgot} className="text-sm text-blue-600">Forgot password?</button>
          </form>
          <div className="my-4 text-center text-sm text-muted-foreground">or</div>
          <Button variant="outline" onClick={google} disabled={loading} className="w-full">Continue with Google</Button>
          <p className="mt-4 text-sm text-center">
            Don't have an account? <Link to="/register" className="text-blue-600">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}