import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const VALID_EMAIL = "admin@opbs.com";
  const VALID_PASSWORD = "123456";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      setError("Invalid credentials. Please check your email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/roles");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    navigate("/roles?demo=true");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative premium background light flares (OKLCH based) */}
      <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/15 blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-md transition-all duration-300 hover:scale-[1.01]">
        <Card className="border border-border bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle colored top bar for premium feel */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary/80" />
          
          <CardHeader className="space-y-1 text-center pt-8">
            <div className="flex justify-center mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">OnePath Fitouts</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage commercial fit-out projects
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@onepath.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-muted-foreground font-semibold">Password</Label>
                  <span className="text-xs text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or simulate system</span>
              </div>
            </div>

            {/* Premium Simulation Mode CTA */}
            <div 
              onClick={handleDemoMode}
              className="group cursor-pointer rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-4 transition-all duration-300 hover:border-primary/40 relative overflow-hidden"
            >
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 group-hover:scale-110 transition-transform duration-300 text-primary">
                <Sparkles className="h-24 w-24" />
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary mt-0.5 group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    Demo / Training Portal
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-250" />
                  </h4>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Explore all 10 roles & portals immediately from a unified training dashboard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pb-8 justify-center">
            <p className="text-xs text-muted-foreground">
              Authorized personnel only. OnePath Fitouts © 2026.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
