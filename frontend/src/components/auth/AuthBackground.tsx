/**
 * Purely decorative full-viewport background for auth pages (login,
 * change-password, etc.), analogous to `AppBackground` but with brighter/
 * more saturated aurora blobs suited to the auth "hero" look. No props,
 * no interactivity — `pointer-events-none` and `-z-10`.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--background)_0%,var(--background)_100%)]" />

      <div className="motion-safe:animate-aurora-1 absolute -left-40 top-[-10%] size-[32rem] rounded-full bg-primary/30 blur-[120px] dark:bg-primary/25" />
      <div className="motion-safe:animate-aurora-2 absolute right-[-10%] top-1/4 size-[28rem] rounded-full bg-success/30 blur-[120px] dark:bg-success/20" />
      <div className="motion-safe:animate-aurora-3 absolute bottom-[-15%] left-1/3 size-[36rem] rounded-full bg-chart-3/25 blur-[130px] dark:bg-chart-3/15" />

      {/* Subtle grid for texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}
