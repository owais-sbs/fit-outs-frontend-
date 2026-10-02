import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import StandalonePortalBar from "@/components/shared/StandalonePortalBar";

export default function salesDashboard() {
  return (
    <>
      <StandalonePortalBar />
      <PageShell className="p-4 md:p-6">
        <PageTitle
          title="Sales Dashboard"
          subtitle="Pipeline and commercial activity at a glance."
        />
        <Surface className="p-5 md:p-6">
          <p className="text-sm text-muted-foreground">Welcome to the Sales dashboard</p>
        </Surface>
      </PageShell>
    </>
  );
}
