export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--background)_0%,var(--background)_100%)]" />

      <div className="motion-safe:animate-aurora-1 absolute -left-40 top-[-15%] size-[36rem] rounded-full bg-primary/10 blur-[140px] dark:bg-success/10" />
      <div className="motion-safe:animate-aurora-2 absolute right-[-15%] top-1/3 size-[32rem] rounded-full bg-success/10 blur-[140px] dark:bg-chart-3/10" />
      <div className="motion-safe:animate-aurora-3 absolute bottom-[-20%] left-1/4 size-[38rem] rounded-full bg-chart-3/8 blur-[150px] dark:bg-primary/8" />

      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
    </div>
  )
}
