import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines conditional class names (via `clsx`) and then resolves any
 * conflicting Tailwind utility classes (via `tailwind-merge`), so later
 * classes correctly override earlier ones instead of both being applied.
 * Standard helper used throughout the UI components for className props.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
