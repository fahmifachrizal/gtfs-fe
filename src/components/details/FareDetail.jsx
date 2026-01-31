import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { CreditCard, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layout } from "@/components/details/Layout"

export function FareDetail({ fare, onSave }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    const [fareId, setFareId] = useState(fare.fare_id || "")
    const [price, setPrice] = useState(fare.price?.toString() || "0")
    const [currencyType, setCurrencyType] = useState(fare.currency_type || "IDR")
    const [paymentMethod, setPaymentMethod] = useState(String(fare.payment_method ?? "0"))
    const [transfers, setTransfers] = useState(fare.transfers?.toString() || "")
    const [transferDuration, setTransferDuration] = useState(fare.transfer_duration?.toString() || "")

    useEffect(() => {
        setFareId(fare.fare_id || "")
        setPrice(fare.price?.toString() || "0")
        setCurrencyType(fare.currency_type || "IDR")
        setPaymentMethod(String(fare.payment_method ?? "0"))
        setTransfers(fare.transfers?.toString() || "")
        setTransferDuration(fare.transfer_duration?.toString() || "")
    }, [fare])

    if (!fare) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const fareData = {
                fare_id: fareId,
                price: parseFloat(price),
                currency_type: currencyType,
                payment_method: parseInt(paymentMethod),
                transfers: transfers ? parseInt(transfers) : null,
                transfer_duration: transferDuration ? parseInt(transferDuration) : null,
            }

            let result
            if (fare.isNew) {
                result = await projectService.createFare(currentProject.id, fareData)
            } else {
                result = await projectService.updateFare(currentProject.id, fare.fare_id, fareData)
            }

            if (result.success) {
                if (onSave) onSave(result.data)
            } else {
                toast.error(result.message || "Failed to save fare")
            }
        } catch (error) {
            console.error("Failed to save fare:", error)
            toast.error(error.message || "An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 h-full flex flex-col">
            <div className="space-y-1 flex-none border-b pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {fare.isNew ? "New Fare" : "Fare Details"}
                    </span>
                </div>
                <h2 className="text-lg font-bold truncate leading-tight">
                    {fare.isNew ? "Create Fare" : fare.fare_id}
                </h2>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto px-1">
                <div className="grid gap-1">
                    <Label htmlFor="fare_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Fare ID <span className="text-destructive">*</span></Label>
                    <Input
                        id="fare_id"
                        value={fareId}
                        onChange={(e) => setFareId(e.target.value.toUpperCase())}
                        required
                        disabled={!fare.isNew}
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="price" className="text-[10px] font-semibold text-muted-foreground uppercase">Price <span className="text-destructive">*</span></Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="currency_type" className="text-[10px] font-semibold text-muted-foreground uppercase">Currency <span className="text-destructive">*</span></Label>
                        <Input
                            id="currency_type"
                            value={currencyType}
                            onChange={(e) => setCurrencyType(e.target.value.toUpperCase())}
                            maxLength={3}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="payment_method" className="text-[10px] font-semibold text-muted-foreground uppercase">Payment Method <span className="text-destructive">*</span></Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">On Board (0)</SelectItem>
                            <SelectItem value="1">Before Boarding (1)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="transfers" className="text-[10px] font-semibold text-muted-foreground uppercase">Transfers</Label>
                        <Select value={transfers || "unlimited"} onValueChange={(v) => setTransfers(v === "unlimited" ? "" : v)}>
                            <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unlimited">Unlimited</SelectItem>
                                <SelectItem value="0">No transfers (0)</SelectItem>
                                <SelectItem value="1">1 transfer</SelectItem>
                                <SelectItem value="2">2 transfers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="transfer_duration" className="text-[10px] font-semibold text-muted-foreground uppercase">Duration (sec)</Label>
                        <Input
                            id="transfer_duration"
                            type="number"
                            min="0"
                            value={transferDuration}
                            onChange={(e) => setTransferDuration(e.target.value)}
                            placeholder="Optional"
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2 border-t mt-auto flex-none">
                <Button type="submit" className="w-full h-8 text-xs font-medium" disabled={loading}>
                    <Save className="w-3 h-3 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
