import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";

export default function financeDashboard() {
  return (
    <PageShell>
      <PageTitle
        title="Finance Dashboard"
        subtitle="Billing, milestones, and commercial health."
      />
      <Surface className="p-5 md:p-6">
        <p className="text-sm text-muted-foreground">Welcome to the Finance dashboard</p>
      </Surface>
    </PageShell>
  );
}
