import { Rows3, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDensity } from "@/lib/density"

/** Navbar control: toggles table density (comfortable ↔ compact). */
export default function DensityToggle() {
  const { density, toggleDensity } = useDensity()
  const isCompact = density === "compact"
  const label = isCompact ? "Comfortable density" : "Compact density"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={toggleDensity}
          aria-label={label}
          aria-pressed={isCompact}
        >
          {isCompact ? (
            <AlignJustify className="h-4 w-4" />
          ) : (
            <Rows3 className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
