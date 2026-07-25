import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import * as businessService from "@/services/business.service"
import type { BusinessListItem } from "@/services/business.service"
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

const schema = z.object({
  name: z.string().trim().min(1, "Business name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  location: z.string().trim().min(1, "Location is required"),
})

type FormValues = z.infer<typeof schema>

export function EditBusinessDialog({ business }: { business: BusinessListItem }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: business.name,
      phone: business.phone,
      email: business.email ?? "",
      location: business.location,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => businessService.updateBusiness(business.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["business", business.id] })
      toast.success("Business updated")
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not update business")
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Edit business">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit business</DialogTitle>
          <DialogDescription>Update {business.name}'s details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-biz-name-${business.id}`}>Business name</Label>
            <Input id={`edit-biz-name-${business.id}`} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-biz-phone-${business.id}`}>Phone number</Label>
            <Input id={`edit-biz-phone-${business.id}`} {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-biz-email-${business.id}`}>Email (optional)</Label>
            <Input id={`edit-biz-email-${business.id}`} type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-biz-location-${business.id}`}>Location</Label>
            <Input id={`edit-biz-location-${business.id}`} {...register("location")} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
