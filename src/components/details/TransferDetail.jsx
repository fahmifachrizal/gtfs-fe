import { service } from "@/services"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { ArrowRightLeft, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DetailLayout } from "./DetailLayout"
import { Button } from "@/components/ui/button"

const TRANSFER_TYPES = [
    { value: 0, label: "Recommended", description: "Recommended transfer point" },
    { value: 1, label: "Timed", description: "Timed transfer between routes" },
    { value: 2, label: "Min Time", description: "Minimum time required to transfer" },
    { value: 3, label: "Not Possible", description: "Transfer not possible" },
]

export function TransferDetail({ transfer, stops, onSave, onDelete, onClose }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [formData, setFormData] = useState({
        from_stop_id: transfer.from_stop_id || "",
        to_stop_id: transfer.to_stop_id || "",
        transfer_type: transfer.transfer_type ?? 2,
        min_transfer_time: transfer.min_transfer_time ?? 300,
    })

    useEffect(() => {
        setFormData({
            from_stop_id: transfer.from_stop_id || "",
            to_stop_id: transfer.to_stop_id || "",
            transfer_type: transfer.transfer_type ?? 2,
            min_transfer_time: transfer.min_transfer_time ?? 300,
        })
    }, [transfer])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleMinutesChange = (minutes) => {
        const secs = parseInt(minutes) * 60
        setFormData(prev => ({ ...prev, min_transfer_time: secs }))
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)

        try {
            if (formData.from_stop_id === formData.to_stop_id) {
                toast.error("From and To stops must be different")
                setLoading(false)
                return
            }

            const transferData = {
                from_stop_id: formData.from_stop_id,
                to_stop_id: formData.to_stop_id,
                transfer_type: parseInt(formData.transfer_type),
                min_transfer_time: formData.min_transfer_time ? parseInt(formData.min_transfer_time) : null,
            }

            let result
            if (transfer.isNew) {
                result = await service.transfers.createTransfer(currentProject.id, transferData)
            } else {
                result = await service.transfers.updateTransfer(currentProject.id, transfer.transfer_id, transferData)
            }

            if (result.success) {
                toast.success(`Transfer rule saved successfully`)
                if (onSave) onSave(result.data)
            }
        } catch (error) {
            toast.error(error.message || "Failed to save transfer")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete this transfer rule?`)) {
            return
        }

        setDeleting(true)
        try {
            const result = await service.transfers.deleteTransfer(currentProject.id, transfer.transfer_id)
            if (result.success) {
                toast.success(`Transfer rule deleted successfully`)
                if (onDelete) onDelete(transfer)
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete transfer")
        } finally {
            setDeleting(false)
        }
    }

    const transferMinutes = Math.floor(formData.min_transfer_time / 60)
    const selectedType = TRANSFER_TYPES.find(t => t.value === parseInt(formData.transfer_type))

    return (
        <DetailLayout
            icon={ArrowRightLeft}
            label={transfer.isNew ? "New Transfer" : "Transfer Details"}
            title={transfer.isNew ? "Create Transfer" : `${formData.from_stop_id} → ${formData.to_stop_id}`}
            onSave={handleSubmit}
            onClose={onClose}
            loading={loading}
            actions={
                !transfer.isNew && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div className="grid gap-1">
                    <Label htmlFor="from_stop_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        From Stop <span className="text-destructive">*</span>
                    </Label>
                    <select
                        id="from_stop_id"
                        value={formData.from_stop_id}
                        onChange={(e) => handleChange("from_stop_id", e.target.value)}
                        required
                        disabled={!transfer.isNew}
                        className="h-7 text-xs px-2 border rounded-md bg-background"
                    >
                        <option value="">Select a stop...</option>
                        {stops.map(stop => (
                            <option key={stop.stop_id} value={stop.stop_id}>
                                {stop.stop_name} ({stop.stop_id})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="to_stop_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        To Stop <span className="text-destructive">*</span>
                    </Label>
                    <select
                        id="to_stop_id"
                        value={formData.to_stop_id}
                        onChange={(e) => handleChange("to_stop_id", e.target.value)}
                        required
                        disabled={!transfer.isNew}
                        className="h-7 text-xs px-2 border rounded-md bg-background"
                    >
                        <option value="">Select a stop...</option>
                        {stops.map(stop => (
                            <option key={stop.stop_id} value={stop.stop_id}>
                                {stop.stop_name} ({stop.stop_id})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="transfer_type" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Transfer Type <span className="text-destructive">*</span>
                    </Label>
                    <select
                        id="transfer_type"
                        value={formData.transfer_type}
                        onChange={(e) => handleChange("transfer_type", parseInt(e.target.value))}
                        required
                        className="h-7 text-xs px-2 border rounded-md bg-background"
                    >
                        {TRANSFER_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label} ({type.value})
                            </option>
                        ))}
                    </select>
                    {selectedType && (
                        <p className="text-[10px] text-muted-foreground">
                            {selectedType.description}
                        </p>
                    )}
                </div>

                {formData.transfer_type === 2 && (
                    <div className="grid gap-1">
                        <Label htmlFor="min_transfer_minutes" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Minimum Transfer Time (minutes)
                        </Label>
                        <Input
                            id="min_transfer_minutes"
                            value={transferMinutes}
                            onChange={(e) => handleMinutesChange(e.target.value)}
                            type="number"
                            min="0"
                            max="1440"
                            className="h-7 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {formData.min_transfer_time} seconds ({transferMinutes} minutes)
                        </p>
                    </div>
                )}
            </form>
        </DetailLayout>
    )
}
