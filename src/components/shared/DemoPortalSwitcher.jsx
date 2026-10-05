import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/shared/context/auth-context";
import { portalHomeForRole } from "@/shared/constants/portal-home";
import {
  DEMO_PORTAL_GROUPS,
  isDemoPortalAccount,
  isDemoTenant,
} from "@/shared/constants/demo-portal-accounts";

/**
 * Demo-only control for hopping between Puma portal accounts so each role's
 * navigation, permissions, and data can be shown without re-entering passwords.
 */
export default function DemoPortalSwitcher() {
  const { user, switchDemoPortal } = useAuth();
  const navigate = useNavigate();
  const [pendingEmail, setPendingEmail] = useState(null);
  const [error, setError] = useState("");

  const currentEmail = String(user?.email || "").trim().toLowerCase();
  if (!isDemoPortalAccount(currentEmail) || !isDemoTenant(user?.companyName)) {
    return null;
  }

  const handleSelect = async (email) => {
    if (email === currentEmail || pendingEmail) return;
    setPendingEmail(email);
    setError("");
    try {
      const result = await switchDemoPortal(email);
      if (result?.singleRole) {
        navigate(portalHomeForRole(result.user, result.singleRole), { replace: true });
      } else if (result?.multipleRoles) {
        navigate("/roles", { replace: true });
      } else {
        setError("That account has no portal access.");
      }
    } catch (err) {
      setError(err.message || "Unable to switch portal.");
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Switch demo portal"
          title="Switch demo portal"
        >
          {pendingEmail ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      {/* Fixed height: the measured Radix available-height var trips a
          ResizeObserver loop once the list is taller than the viewport. */}
      <DropdownMenuContent
        align="end"
        className="w-72"
        collisionPadding={8}
        style={{ maxHeight: "min(70vh, 30rem)" }}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Demo only — switch portal user
        </DropdownMenuLabel>
        {error ? (
          <p className="px-2 pb-1 text-xs text-destructive">{error}</p>
        ) : null}

        {DEMO_PORTAL_GROUPS.map((group) => (
          <div key={group.label}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {group.label}
            </DropdownMenuLabel>
            {group.accounts.map((account) => {
              const isCurrent = account.email === currentEmail;
              return (
                <DropdownMenuItem
                  key={account.email}
                  disabled={isCurrent || !!pendingEmail}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleSelect(account.email);
                  }}
                  className="flex items-start gap-2"
                >
                  <span className="mt-0.5 w-4 shrink-0">
                    {isCurrent ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{account.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {account.role} · {account.email}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
