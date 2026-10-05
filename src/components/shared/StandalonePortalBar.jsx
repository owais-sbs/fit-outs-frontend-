import ThemeToggle from "@/shared/theme/ThemeToggle";
import DemoPortalSwitcher from "@/components/shared/DemoPortalSwitcher";

/** Header controls for portals that render a page without a sidebar navbar. */
export default function StandalonePortalBar() {
  return (
    <div className="flex items-center justify-end gap-1 border-b border-border/40 px-4 py-2 md:px-6">
      <ThemeToggle />
      <DemoPortalSwitcher />
    </div>
  );
}
