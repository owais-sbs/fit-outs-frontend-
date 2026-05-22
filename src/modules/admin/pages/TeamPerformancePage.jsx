import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function TeamPerformancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="$page" description="CRM module component." />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
