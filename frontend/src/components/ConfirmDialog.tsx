import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
}

/**
 * Reusable "are you sure?" confirmation modal built on shadcn's AlertDialog.
 * The caller supplies `trigger` (the element that opens the dialog) and
 * `onConfirm` (called when the user accepts). `destructive` (default true)
 * styles the confirm button as a destructive action; set it to false for
 * non-destructive confirmations. `isLoading` disables the confirm button and
 * shows a spinner while an async `onConfirm` is in flight.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
