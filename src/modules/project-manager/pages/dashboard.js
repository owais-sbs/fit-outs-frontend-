import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Inbox, Briefcase, MapPin, Mail } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";

export default function ProjectManagerDashboard() {
  const tiles = [
    {
      title: "BOQ Inbox",
      description: "Review and approve BOQs pending PM sign-off",
      href: ROUTES.PROJECT_MANAGER.BOQ_INBOX,
      icon: Inbox,
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
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.href}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {tile.title}
                </CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link to={tile.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
