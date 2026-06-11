import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, Calendar, Mail,
  MoreHorizontal, Phone, Shield, PhoneIncoming, PhoneOutgoing,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import {
  getClientById, CLIENT_STATUSES,
  INITIAL_CALLS, INITIAL_EMAIL_THREADS,
} from "../../data/clients";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Active: "success", Inactive: "secondary", Prospect: "warning", VIP: "default",
};

const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarUrl(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${AVATAR_HEX[idx]}&color=ffffff&size=128&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(() => getClientById(clientId));

  const calls   = INITIAL_CALLS.filter((c) => c.clientId === clientId);
  const threads = INITIAL_EMAIL_THREADS.filter((t) => t.clientId === clientId);

  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-border/60">
          <CardContent className="py-24 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">Client not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`${client.company} · ${client.location}`}
        actions={
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}>
            <ArrowLeft className="h-4 w-4" /> All Clients
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        {/* ── Left: profile card ─────────────────────────────────────── */}
        <Card className="border-border/60 shadow-sm self-start">
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="mx-auto h-20 w-20 ring-4 ring-border/40 ring-offset-2 ring-offset-background">
              <img src={avatarUrl(client.name)} alt={client.name} className="h-full w-full rounded-full object-cover" />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {initials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-base font-bold">{client.name}</h2>
              <p className="text-sm text-muted-foreground">{client.company}</p>
            </div>

            <Badge variant={STATUS_VARIANT[client.status]} className="capitalize">
              {client.status}
            </Badge>

            <Separator />

            {/* Contact */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-xs">{client.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{client.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Joined {fmtDate(client.joinedDate)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Managed by {client.assignee}</span>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={() =>
                  navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${client.name}`)
                }
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {CLIENT_STATUSES.filter((s) => s !== client.status).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setClient((c) => ({ ...c, status: s }))}>
                      Mark as {s}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: details ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Basic info */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <InfoRow label="Full Name"    value={client.name} />
              <InfoRow label="Company"      value={client.company} />
              <InfoRow label="Email"        value={client.email} />
              <InfoRow label="Phone"        value={client.phone} />
              <InfoRow label="Location"     value={client.location} />
              <InfoRow label="Status"       value={client.status} />
              <InfoRow label="Managed By"   value={client.assignee} />
              {client.notes && (
                <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent emails */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent Emails
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() =>
                  navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${client.name}`)
                }
              >
                <Mail className="h-3.5 w-3.5" />
                Compose
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No emails yet.</p>
              ) : (
                <div className="space-y-2">
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => navigate(ROUTES.ADMIN.CLIENT_EMAIL)}
                      className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!t.read ? "font-semibold" : "font-medium"}`}>
                          {t.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{t.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call history */}
          {calls.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{call.outcome}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.date} · {call.time}{call.duration ? ` · ${call.duration}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        call.direction === "inbound"
                          ? "bg-emerald-500/15 text-emerald-700 border-none text-[10px] shrink-0"
                          : "bg-primary/10 text-primary border-none text-[10px] shrink-0"
                      }
                    >
                      {call.direction}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
