import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Copy, Loader2, Plus, UserPlus } from "lucide-react"
import { toast } from "sonner"
import * as teamService from "@/services/team.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  phone: z.string().trim().min(7, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EMPLOYEE"], { message: "Select a role" }),
})

type FormValues = z.infer<typeof schema>

export function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", username: "", phone: "", email: "", role: "EMPLOYEE" },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => teamService.addTeamMember(activeBusinessId!, values),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: ["team", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
      reset()
      if (member.defaultPassword) {
        setCreated({ username: member.user.username, password: member.defaultPassword })
      } else {
        toast.success(`${member.user.fullName} added to the business`)
        setOpen(false)
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not add team member")
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setCreated(null)
      setCopied(false)
    }
  }

  const copyPassword = async () => {
    if (!created) return
    await navigator.clipboard.writeText(created.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add team member
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="size-5 text-success" />
                Team member added
              </DialogTitle>
              <DialogDescription>
                Share these sign-in details with them now — this password won't be shown again. They'll be
                asked to set a new one on first login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-mono text-sm font-medium">{created.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temporary password</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium">{created.password}</p>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={copyPassword} aria-label="Copy password">
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a team member</DialogTitle>
              <DialogDescription>
                They'll get a temporary password to log in with. Existing users can be added directly by
                username.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="member-name">Full name</Label>
                <Input id="member-name" autoFocus {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-username">Username</Label>
                <Input id="member-username" {...register("username")} />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="member-phone">Phone number</Label>
                  <Input id="member-phone" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="member-role">Role</Label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="member-role" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-email">Email (optional)</Label>
                <Input id="member-email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Add member
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
