"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function signInWithGoogle() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) toast.error(error.message);
    });
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !password) return;

    startTransition(async () => {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: addr,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        // If "Confirm email" is ON in Supabase, no session yet — user must
        // verify. If OFF, a session is returned and we can go straight in.
        if (!data.session) {
          toast.success("Account created — check your email to confirm.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: addr,
          password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
      }

      // Full navigation so the server reads the fresh session cookie.
      window.location.assign("/");
    });
  }

  function sendMagicLink() {
    const addr = email.trim();
    if (!addr) return toast.error("Enter your email first");
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) toast.error(error.message);
      else setSent(true);
    });
  }

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center px-6 py-10">
      {/* Aurora glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(263_70%_62%/0.18),transparent)]"
      />
      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="mb-1 size-8 text-primary" />
          <CardTitle className="text-xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to your task manager. Nothing slips."
              : "Set an email and password to get started."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sent ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <Mail className="size-6 text-primary" />
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs text-muted-foreground">
                We sent a magic link to {email}.
              </p>
            </div>
          ) : (
            <>
              {/* Email + password */}
              <form onSubmit={submitPassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={pending}
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    disabled={pending}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Keep me signed in
                  </Label>
                </div>

                <Button type="submit" disabled={pending} className="w-full">
                  {pending && <Loader2 className="animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-medium text-primary hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              {/* Google + magic link */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={pending}
                  variant="outline"
                  className="w-full"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={pending}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  <Mail />
                  Email me a magic link instead
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
