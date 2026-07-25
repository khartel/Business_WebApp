import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import * as transactionService from "@/services/transaction.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CartLine {
  productId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  availableStock: number
}

export function NewSaleDialog() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [lineQuantity, setLineQuantity] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH")
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")

  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: ["products", activeBusinessId],
    queryFn: () => productService.getProducts(activeBusinessId!),
    enabled: open && !!activeBusinessId,
  })

  const selectedProduct = productsQuery.data?.find((p) => p.id === selectedProductId)
  const availableStock = selectedProduct?.primaryStock?.quantity ?? 0

  const resetAll = () => {
    setCart([])
    setSelectedProductId("")
    setLineQuantity("")
    setPaymentMethod("CASH")
    setCustomerName("")
    setNotes("")
  }

  const addLine = () => {
    if (!selectedProduct) return
    const qty = parseFloat(lineQuantity)
    if (!qty || qty <= 0) {
      toast.error("Enter a quantity greater than 0")
      return
    }
    if (qty > availableStock) {
      toast.error(`Only ${availableStock} ${selectedProduct.unit} of ${selectedProduct.name} in stock`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === selectedProduct.id)
      if (existing) {
        return prev.map((line) =>
          line.productId === selectedProduct.id ? { ...line, quantity: line.quantity + qty } : line
        )
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: qty,
          unitPrice: selectedProduct.price,
          availableStock,
        },
      ]
    })
    setSelectedProductId("")
    setLineQuantity("")
  }

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId))
  }

  const updateLinePrice = (productId: string, price: number) => {
    setCart((prev) => prev.map((line) => (line.productId === productId ? { ...line, unitPrice: price } : line)))
  }

  const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  const saleMutation = useMutation({
    mutationFn: () =>
      transactionService.createTransaction(activeBusinessId!, {
        paymentMethod,
        customerName: customerName || undefined,
        notes: notes || undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantitySold: line.quantity,
          unitPrice: line.unitPrice,
        })),
      }),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
      toast.success(`Sale recorded — ${formatMoney(transaction.totalAmount, currency)}`)
      resetAll()
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not record sale")
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="size-4" />
          New sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New sale</DialogTitle>
          <DialogDescription>Sales are recorded against the primary warehouse.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {productsQuery.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={(p.primaryStock?.quantity ?? 0) <= 0}>
                      {p.name} — {p.primaryStock?.quantity ?? 0} {p.unit} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label>Qty</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={lineQuantity}
                onChange={(e) => setLineQuantity(e.target.value)}
                disabled={!selectedProductId}
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={addLine} disabled={!selectedProductId}>
              <Plus className="size-4" />
            </Button>
          </div>

          {cart.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((line) => (
                    <TableRow key={line.productId}>
                      <TableCell className="font-medium">
                        {line.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({line.quantity} {line.unit})
                        </span>
                      </TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={line.unitPrice}
                          onChange={(e) => updateLinePrice(line.productId, parseFloat(e.target.value) || 0)}
                          className="h-7 w-24"
                        />
                      </TableCell>
                      <TableCell>{formatMoney(line.quantity * line.unitPrice, currency)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeLine(line.productId)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "CASH" | "TRANSFER")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer name (optional)</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
            <span className="text-sm font-medium">Total</span>
            <span className="font-heading text-lg font-semibold">{formatMoney(total, currency)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => saleMutation.mutate()}
            disabled={cart.length === 0 || saleMutation.isPending}
          >
            {saleMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Complete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
