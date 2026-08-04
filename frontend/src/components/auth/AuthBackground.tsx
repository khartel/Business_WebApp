import { useTheme } from "@/context/ThemeContext"
import { SideRays } from "@/components/auth/SideRays"

/**
 * Purely decorative full-viewport background for auth pages (login,
 * change-password, etc.), analogous to `AppBackground` but with brighter/
 * more saturated aurora blobs suited to the auth "hero" look. No props,
 * no interactivity — `pointer-events-none` and `-z-10`.
 *
 * Layers a WebGL `SideRays` light-beam effect (from the top-right corner)
 * on top of the aurora blobs, recolored per light/dark theme to the same
 * brand green + sky-blue accents the blobs already use, so it reads as one
 * consistent "hero" look rather than a mismatched effect bolted on.
 */
export function AuthBackground() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--background)_0%,var(--background)_100%)]" />

      <div className="motion-safe:animate-aurora-1 absolute -left-40 top-[-10%] size-[32rem] rounded-full bg-primary/30 blur-[120px] dark:bg-primary/25" />
      <div className="motion-safe:animate-aurora-2 absolute right-[-10%] top-1/4 size-[28rem] rounded-full bg-success/30 blur-[120px] dark:bg-success/20" />
      <div className="motion-safe:animate-aurora-3 absolute bottom-[-15%] left-1/3 size-[36rem] rounded-full bg-chart-3/25 blur-[130px] dark:bg-chart-3/15" />

      {/* In light mode, `mix-blend-multiply` keeps the effect from reading as
          a flat haze over the pale background - white areas multiply to
          white (no visible change), so only the ray's own saturated color
          shows through, the same way the dark-mode "normal" blend already
          reads correctly against a near-black background. The shader itself
          fades out gradually rather than fully to zero, so a mask confines
          the visible glow to the top-right corner it emanates from instead
          of tinting the whole viewport. */}
      <div
        className={`absolute inset-0 ${isDark ? "" : "mix-blend-multiply"}`}
        style={{
          maskImage: "radial-gradient(circle at top right, black 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(circle at top right, black 0%, transparent 60%)",
        }}
      >
        <SideRays
          speed={1.2}
          rayColor1={isDark ? "#10B981" : "#059669"}
          rayColor2={isDark ? "#38BDF8" : "#0EA5E9"}
          intensity={isDark ? 1.3 : 1.6}
          spread={1.6}
          origin="top-right"
          saturation={1.2}
          blend={0.6}
          falloff={1.6}
          opacity={isDark ? 0.6 : 0.65}
        />
      </div>

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
