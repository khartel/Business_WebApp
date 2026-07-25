import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import * as teamService from "@/services/team.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { canManage } from "@/lib/permissions"
import { ApiError } from "@/lib/api-client"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { AddTeamMemberDialog } from "@/components/team/AddTeamMemberDialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function initials(fullName: string) {
  return fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export default function Team() {
  const { user, activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const queryClient = useQueryClient()
  const canEdit = canManage(user?.role)

  const teamQuery = useQuery({
    queryKey: ["team", activeBusinessId],
    queryFn: () => teamService.getTeamMembers(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["team", activeBusinessId] })
    queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
  }

  const roleMutation = useMutation({
    mutationFn: ({ businessUserId, role }: { businessUserId: string; role: "ADMIN" | "EMPLOYEE" }) =>
      teamService.updateTeamMemberRole(activeBusinessId!, businessUserId, role),
    onSuccess: () => {
      invalidate()
      toast.success("Role updated")
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update role"),
  })

  const removeMutation = useMutation({
    mutationFn: (businessUserId: string) => teamService.removeTeamMember(activeBusinessId!, businessUserId),
    onSuccess: () => {
      invalidate()
      toast.success("Team member removed")
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not remove team member"),
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="No business selected"
        description="Select or create a business to manage its team."
      />
    )
  }

  const members = teamQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description={activeBusiness ? `Everyone with access to ${activeBusiness.name}` : undefined}
        action={canEdit && <AddTeamMemberDialog />}
      />

      {teamQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : teamQuery.isError ? (
        <ErrorState onRetry={() => teamQuery.refetch()} />
      ) : members.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="No team members yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.userId === user?.id
                const isOwner = member.role === "SUPERADMIN"
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs">{initials(member.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.user.fullName}</span>
                        {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.user.username}</TableCell>
                    <TableCell>
                      {canEdit && !isOwner ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) =>
                            roleMutation.mutate({ businessUserId: member.id, role: role as "ADMIN" | "EMPLOYEE" })
                          }
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{member.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && !isOwner && !isSelf && (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="icon-sm" aria-label="Remove team member">
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                          title="Remove team member?"
                          description={`${member.user.fullName} will lose access to this business.`}
                          confirmLabel="Remove"
                          isLoading={removeMutation.isPending}
                          onConfirm={() => removeMutation.mutate(member.id)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
