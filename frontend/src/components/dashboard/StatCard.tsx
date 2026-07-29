import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: "primary" | "success"
}

/**
 * Small dashboard metric tile: an icon badge next to a label and a large
 * value (e.g. "Total sales" / "₦1,200,000"). `accent` picks the icon
 * badge's color scheme ("primary" or "success"); the badge also gets a
 * glow effect on hover via `group-hover`.
 */
export function StatCard({ label, value, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <Card className="group">
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-shadow duration-200",
            accent === "success"
              ? "bg-success/10 text-success shadow-[0_0_0px_var(--glow-primary)] group-hover:shadow-[0_0_18px_var(--glow-primary)]"
              : "bg-primary/10 text-primary shadow-[0_0_0px_var(--glow-secondary)] group-hover:shadow-[0_0_18px_var(--glow-secondary)]"
          )}
        >
          <Icon className="size-5.5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
