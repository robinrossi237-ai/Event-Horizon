import * as React from "react";
import { useState } from "react";
import LayoutShell from "@/components/layout-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  // If URL contains ?mode=signup, pre-select signup
  useState(() => {
    try {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const m = params.get("mode");
      if (m === "signup") setMode("signup");
    } catch (e) {
      // ignore
    }
  });
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
        if (!email || !password || !confirm) {
          setError("Please fill all required fields.");
          return;
        }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    if (mode === "signup") {
      fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.message || "Signup failed");
          return;
        }
        // on success we'll be logged in already via server session
        // fetch current user to determine redirect based on role
        const userResp = await fetch("/api/auth/user", { credentials: "include" });
        if (userResp.ok) {
          const u = await userResp.json();
          window.location.href = u?.isAdmin ? "/admin" : "/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }).catch(() => setError("Signup failed"));
      return;
    }

    // Local login flow
    if (mode === "login") {
      fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.message || "Login failed");
          return;
        }
        // determine redirect after login (admin -> /admin)
        const userResp = await fetch("/api/auth/user", { credentials: "include" });
        if (userResp.ok) {
          const u = await userResp.json();
          window.location.href = u?.isAdmin ? "/admin" : "/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }).catch(() => setError("Login failed"));
      return;
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <a href="/" className="inline-block">
          <div className="text-3xl font-bold">Ticket Master</div>
        </a>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{mode === "login" ? "Sign in to your account" : "Create your account"}</h1>
          <p className="text-sm text-gray-500 mt-2">{mode === "login" ? "Enter your credentials below." : "Fill the form to create an account."}</p>
        </div>
        <div className="ml-auto"></div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Full name</span>
            <Input id="fullname" name="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <Input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <Input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </label>

        {mode === "signup" && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Confirm password</span>
            <Input id="confirm" name="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
          </label>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {mode === "login" && (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="remember" className="h-5 w-5 text-indigo-600" />
              Remember me
            </label>
          )}

          <button type="button" onClick={() => window.location.href = "/api/login"} className="min-h-11 text-sm text-indigo-600 hover:underline">
            {mode === "login" ? "Forgot password?" : "Have an account? Sign in"}
          </button>
        </div>

        <div>
          <Button type="submit" className="w-full inline-flex justify-center items-center rounded-md py-2 px-4 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm hover:from-indigo-700 hover:to-violet-700 active:scale-95">
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </div>

        <div className="mt-2">
          <p className="text-center text-sm text-muted-foreground">Use your email and password to sign in.</p>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === "login" ? (
          <>
            Don’t have an account? <button className="text-indigo-600 hover:underline" onClick={() => setMode("signup")}>Sign up</button>
          </>
        ) : (
          <>
            Already have an account? <button className="text-indigo-600 hover:underline" onClick={() => setMode("login")}>Sign in</button>
          </>
        )}
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <LayoutShell>
      <AuthCard />
    </LayoutShell>
  );
}
