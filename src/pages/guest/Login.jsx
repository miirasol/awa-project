import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/authErrors";

export default function Login() {
  const { login, googleSignIn, resetPassword, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done && user && profile) {
      const target = from || (profile.role === "admin" ? "/admin/appointments" : "/dashboard");
      navigate(target, { replace: true });
    }
  }, [done, user, profile, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, remember);
      setDone(true);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      setDone(true);
    } catch (err) {
      toast.error(authErrorMessage(err));
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
      toast.error(authErrorMessage(err));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={setRemember} />
              <span className="text-sm">Remember me</span>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              Log In
            </Button>
            <button type="button" onClick={forgot} className="text-sm text-[#0a0a0a] underline">
              Forgot password?
            </button>
          </form>
          <div className="my-4 text-center text-sm text-muted-foreground">or</div>
          <Button variant="outline" onClick={google} disabled={loading} className="w-full">
            Continue with Google
          </Button>
          <p className="mt-4 text-sm text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
