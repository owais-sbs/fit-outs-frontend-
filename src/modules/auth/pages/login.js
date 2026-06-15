import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle, Loader2 } from "lucide-react";

const ROLE_ROUTES = {
  [ROLES.SUPER_ADMIN]: ROUTES.SUPER_ADMIN.DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [ROLES.CLIENT]: ROUTES.CLIENT.DASHBOARD,
  [ROLES.EMPLOYEE]: ROUTES.EMPLOYEE.DASHBOARD,
};

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (role) {
        const route = ROLE_ROUTES[role];
        if (route) {
          navigate(route, { replace: true });
        }
      } else {
        navigate("/roles", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-sm text-muted-foreground animate-pulse font-medium">Checking session...</span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login({ email, password });

      if (result?.noValidRole) {
        setError("Your account does not have access to any available portal.");
        return;
      }

      if (result?.singleRole) {
        const route = ROLE_ROUTES[result.singleRole];
        if (route) {
          navigate(route);
        } else {
          setError("Invalid role assigned to your account.");
        }
        return;
      }

      if (result?.multipleRoles) {
        navigate("/roles");
        return;
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/15 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md transition-all duration-300 hover:scale-[1.01]">
        <Card className="border border-border bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary/80" />

          <CardHeader className="space-y-1 text-center pt-8">
            <div className="flex justify-center mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight"> Fitouts</CardTitle>
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
          </CardContent>

          <CardFooter className="pb-8 justify-center">
            <p className="text-xs text-muted-foreground">
              Authorized personnel only.  Fitouts © 2026.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
