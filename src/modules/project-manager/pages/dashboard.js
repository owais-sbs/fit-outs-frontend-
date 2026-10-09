import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Inbox, Briefcase, MapPin, Mail, Stamp, ArrowRight } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";

export default function ProjectManagerDashboard() {
  const tiles = [
    {
      title: "Awaiting your approval",
      description: "Variations, CRs, BOQs, and billing milestones waiting on you",
      href: ROUTES.PROJECT_MANAGER.AWAITING_APPROVALS,
      icon: Stamp,
    },
    {
      title: "BOQ Inbox",
      description: "Review and approve BOQs pending PM sign-off",
      href: ROUTES.PROJECT_MANAGER.BOQ_INBOX,
      icon: Inbox,
    },
    {
      title: "Billing milestone approval",
      description: "Approve billing milestones sent by Finance",
      href: ROUTES.PROJECT_MANAGER.BILLING_MILESTONE_INBOX,
      icon: Stamp,
    },
    {
      title: "Projects",
      description: "Company projects and room collaboration",
      href: ROUTES.PROJECT_MANAGER.PROJECTS,
      icon: Briefcase,
    },
    {
      title: "Site Visits",
      description: "Schedule and track site visits",
      href: ROUTES.PROJECT_MANAGER.SITE_VISITS,
      icon: MapPin,
    },
    {
      title: "Communications",
      description: "Team and project messaging",
      href: ROUTES.PROJECT_MANAGER.COMMUNICATIONS,
      icon: Mail,
    },
  ];

  return (
    <PageShell>
      <PageTitle
        title="Project Manager"
        subtitle="Approvals, projects, site visits, and communications in one place."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.href}
              className="border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A96E]/15 text-[#8a6d3b]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  {tile.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {tile.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={tile.href}>
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
