import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import * as businessService from "@/services/business.service"
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
  name: z.string().trim().min(1, "Business name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  country: z.string().min(1, "Country is required"),
  location: z.string().trim().min(1, "Location is required"),
})

type FormValues = z.infer<typeof schema>

export function CreateBusinessDialog({ onCreated }: { onCreated?: (businessId: string) => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: businessService.getCountries,
    enabled: open,
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", country: "", location: "" },
  })

  const createMutation = useMutation({
    mutationFn: businessService.createBusiness,
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success(`"${business.name}" created`)
      setOpen(false)
      reset()
      onCreated?.(business.id)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not create business")
    },
  })

  const onSubmit = (values: FormValues) => createMutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New business
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a business</DialogTitle>
          <DialogDescription>Set up a new business to track its own inventory and sales.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Business name</Label>
            <Input id="biz-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biz-phone">Phone number</Label>
            <Input id="biz-phone" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biz-email">Email (optional)</Label>
            <Input id="biz-email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biz-country">Country</Label>
            <Select
              value={watch("country")}
              onValueChange={(value) => setValue("country", value, { shouldValidate: true })}
            >
              <SelectTrigger id="biz-country" className="w-full">
                <SelectValue
                  placeholder={countriesQuery.isLoading ? "Loading countries..." : "Select a country"}
                />
              </SelectTrigger>
              <SelectContent>
                {countriesQuery.data?.map((c) => (
                  <SelectItem key={c.country} value={c.country}>
                    {c.country} ({c.currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biz-location">Location</Label>
            <Input id="biz-location" placeholder="City, area" {...register("location")} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Create business
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
