/**
 * Super-admin / shared page header — delegates to PageTitle for identical markup.
 * Props: title, description (→ subtitle), actions. Keep this export for existing imports.
 */
import { PageTitle } from "@/components/layout/PageShell";

export default function PageHeader({ title, description, actions }) {
  return <PageTitle title={title} subtitle={description} actions={actions} />;
}
