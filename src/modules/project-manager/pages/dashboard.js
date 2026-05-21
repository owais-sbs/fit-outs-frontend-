import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";

export default function projectManagerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Project Manager Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Welcome to the Project Manager dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
