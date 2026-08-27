import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";

export default function designerDashboard() {
  return (
    <PageShell>
      <PageTitle
        title="Designer Dashboard"
        subtitle="Design workspace overview — drawings, finishes, and coordination."
      />
      <Surface className="p-5 md:p-6">
        <p className="text-sm text-muted-foreground">Welcome to the Designer dashboard</p>
      </Surface>
    </PageShell>
  );
}
