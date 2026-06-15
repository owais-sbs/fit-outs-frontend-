import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ConfigurationInfoCard({ title, description, icon: Icon, examples }) {
  return (
    <Card className="h-full bg-muted/30 border-dashed">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {examples && examples.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Examples</h4>
            <div className="space-y-4">
              {examples.map((example, idx) => (
                <div key={idx} className="bg-background border rounded-md p-3">
                  <div className="font-medium text-sm text-foreground">{example.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground/50">└─</span>
                    <span>{example.items.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
