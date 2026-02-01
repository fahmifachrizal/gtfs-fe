import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { CreditCard } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DetailLayout } from "./DetailLayout"

export function FareDetail({ fare, onSave }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        fare_id: fare.fare_id || "",
        price: fare.price?.toString() || "0",
        currency_type: fare.currency_type || "IDR",
        payment_method: String(fare.payment_method ?? "0"),
        transfers: fare.transfers?.toString() || "",
        transfer_duration: fare.transfer_duration?.toString() || "",
    })

    // Generate ID for new fares
    useEffect(() => {
        if (fare.isNew && !formData.fare_id) {
            setFormData(prev => ({
                ...prev,
                fare_id: `FARE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            }))
        }
    }, [fare.isNew])

    useEffect(() => {
        setFormData({
            fare_id: fare.fare_id || formData.fare_id,
            price: fare.price?.toString() || "0",
            currency_type: fare.currency_type || "IDR",
            payment_method: String(fare.payment_method ?? "0"),
            transfers: fare.transfers?.toString() || "",
            transfer_duration: fare.transfer_duration?.toString() || "",
        })
    }, [fare])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)

        try {
            const fareData = {
                fare_id: formData.fare_id,
                price: parseFloat(formData.price),
                currency_type: formData.currency_type,
                payment_method: parseInt(formData.payment_method),
                transfers: formData.transfers ? parseInt(formData.transfers) : null,
                transfer_duration: formData.transfer_duration ? parseInt(formData.transfer_duration) : null,
            }

            let result
            if (fare.isNew) {
                result = await projectService.createFare(currentProject.id, fareData)
            } else {
                result = await projectService.updateFare(currentProject.id, fare.fare_id, fareData)
            }

            if (result.success) {
                toast.success(`Fare "${result.data.fare_id}" saved`)
                if (onSave) onSave(result.data)
            }
        } catch (error) {
            toast.error(error.message || "Failed to save fare")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DetailLayout
            icon={CreditCard}
            label={fare.isNew ? "New Fare" : "Fare Details"}
            title={fare.isNew ? "Create Fare" : fare.fare_id}
            onSave={handleSubmit}
            loading={loading}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div className="grid gap-1">
                    <Label htmlFor="fare_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Fare ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="fare_id"
                        value={formData.fare_id}
                        onChange={(e) => handleChange("fare_id", e.target.value.toUpperCase())}
                        required
                        disabled={!fare.isNew}
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="price" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Price <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="currency_type" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Currency <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="currency_type"
                            value={formData.currency_type}
                            onChange={(e) => handleChange("currency_type", e.target.value.toUpperCase())}
                            maxLength={3}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="payment_method" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Payment Method <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.payment_method} onValueChange={(v) => handleChange("payment_method", v)}>
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
                        <Label htmlFor="transfers" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Transfers
                        </Label>
                        <Select
                            value={formData.transfers || "unlimited"}
                            onValueChange={(v) => handleChange("transfers", v === "unlimited" ? "" : v)}
                        >
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
                        <Label htmlFor="transfer_duration" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Duration (sec)
                        </Label>
                        <Input
                            id="transfer_duration"
                            type="number"
                            min="0"
                            value={formData.transfer_duration}
                            onChange={(e) => handleChange("transfer_duration", e.target.value)}
                            placeholder="Optional"
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>
            </form>
        </DetailLayout>
    )
}
