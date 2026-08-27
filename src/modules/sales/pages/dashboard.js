import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";

export default function salesDashboard() {
  return (
    <PageShell>
      <PageTitle
        title="Sales Dashboard"
        subtitle="Pipeline and commercial activity at a glance."
      />
      <Surface className="p-5 md:p-6">
        <p className="text-sm text-muted-foreground">Welcome to the Sales dashboard</p>
      </Surface>
    </PageShell>
  );
}
