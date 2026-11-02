import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/authErrors";
import { LIMITS, tooLong } from "@/lib/limits";

export default function Register() {
  const { register, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (tooLong(fullName, LIMITS.personName)) {
      toast.error(`Name must be ${LIMITS.personName} characters or fewer.`);
      return;
    }
    if (tooLong(email, LIMITS.email)) {
      toast.error(`Email must be ${LIMITS.email} characters or fewer.`);
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const cred = await register(email.trim(), password, fullName.trim(), phone.trim());
      navigate(cred.user ? "/dashboard" : "/dashboard", { replace: true });
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                value={fullName}
                maxLength={LIMITS.personName}
                id="fullName"
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                value={email}
                maxLength={LIMITS.email}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                value={phone}
                maxLength={LIMITS.phone}
                id="phone"
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                value={password}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                type="password"
                value={confirm}
                id="confirm"
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              Create account
            </Button>
          </form>
          <div className="my-4 text-center text-sm text-muted-foreground">or</div>
          <Button variant="outline" onClick={google} disabled={loading} className="w-full">
            Continue with Google
          </Button>
          <p className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0a0a0a] underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
