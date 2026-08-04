import { Calendar, Mail, Phone } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TeamMember } from "@/services/team.service"
import { formatDate } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Derives up-to-two-letter initials from a full name, for the avatar fallback.
function initials(fullName: string) {
  return fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

/**
 * Read-only centered dialog showing a single team member's profile: avatar,
 * full name, role, phone, email, and when they joined this business.
 * Management actions (role change, password reset, remove) stay on the
 * Team page's table row — this dialog never duplicates them, same
 * read-only-drill-down convention as `WarehouseDetailSheet`/
 * `ProductDetailSheet`.
 *
 * Props:
 * - member: the member to show, or null to close the dialog. Unlike the
 *   other detail dialogs, this one doesn't fetch its own data — the Team
 *   page's list query already has every field this dialog needs.
 * - onOpenChange: called when the dialog is dismissed.
 */
export function TeamMemberDetailSheet({
  member,
  onOpenChange,
}: {
  member: TeamMember | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member?.user.fullName ?? t("Team member")}</DialogTitle>
          <DialogDescription>@{member?.user.username}</DialogDescription>
        </DialogHeader>

        {member && (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback>{initials(member.user.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user.fullName}</p>
                <Badge variant="secondary" className="mt-0.5">
                  {member.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span>{member.user.phone || t("No phone on file")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span>{member.user.email || t("No email on file")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4 shrink-0" />
                <span>{t("Member since {{date}}", { date: formatDate(member.createdAt) })}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
