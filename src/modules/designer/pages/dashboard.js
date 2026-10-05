import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import StandalonePortalBar from "@/components/shared/StandalonePortalBar";

export default function designerDashboard() {
  return (
    <>
      <StandalonePortalBar />
      <PageShell className="p-4 md:p-6">
        <PageTitle
          title="Designer Dashboard"
          subtitle="Design workspace overview — drawings, finishes, and coordination."
        />
        <Surface className="p-5 md:p-6">
          <p className="text-sm text-muted-foreground">Welcome to the Designer dashboard</p>
        </Surface>
      </PageShell>
    </>
  );
}
