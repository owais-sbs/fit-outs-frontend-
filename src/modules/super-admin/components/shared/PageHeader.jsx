/**
 * Super-admin / shared page header — delegates to PageShell PageHeader.
 * Props: title, description (→ subtitle), actions, backTo, backState, backOnClick, backTitle.
 */
import { PageHeader as ShellPageHeader } from "@/components/layout/PageShell";

export default function PageHeader({
  title,
  description,
  actions,
  backTo,
  backState,
  backOnClick,
  backTitle = "Back",
}) {
  return (
    <ShellPageHeader
      title={title}
      subtitle={description}
      actions={actions}
      backTo={backTo}
      backState={backState}
      backOnClick={backOnClick}
      backTitle={backTitle}
    />
  );
}
