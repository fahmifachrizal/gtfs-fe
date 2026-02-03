import { service } from "@/services"
import { useUser } from "@/contexts/UserContext"
import { useEditorContext } from "@/contexts/EditorContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DetailLayout } from "./DetailLayout"

export function StopDetail({ stop, onSave, onPreview }) {
  const { currentProject } = useUser()
  const { setHasUnsavedChanges: setContextUnsavedChanges } = useEditorContext()
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Controlled state for inputs
  const [formData, setFormData] = useState({
    stop_id: stop.stop_id || "",
    stop_code: stop.stop_code || "",
    stop_name: stop.stop_name || "",
    stop_lat: stop.stop_lat || "",
    stop_lon: stop.stop_lon || "",
    stop_desc: stop.stop_desc || "",
  })

  // Sync local unsaved changes state with context
  useEffect(() => {
    setContextUnsavedChanges(hasUnsavedChanges)
  }, [hasUnsavedChanges, setContextUnsavedChanges])

  // Listen for save requests from the layout
  useEffect(() => {
    const handleSaveRequest = () => {
      document.getElementById('stop-form')?.requestSubmit()
    }

    window.addEventListener('detail-save-requested', handleSaveRequest)
    return () => window.removeEventListener('detail-save-requested', handleSaveRequest)
  }, [])

  // Generate ID for new stops
  useEffect(() => {
    if (stop.isNew && !formData.stop_id) {
      setFormData(prev => ({
        ...prev,
        stop_id: Math.random().toString(36).substring(2, 10).toUpperCase()
      }))
    }
  }, [stop.isNew])

  // Sync with prop changes
  useEffect(() => {
    setFormData({
      stop_id: stop.stop_id || formData.stop_id,
      stop_code: stop.stop_code || "",
      stop_name: stop.stop_name || "",
      stop_lat: stop.stop_lat || "",
      stop_lon: stop.stop_lon || "",
      stop_desc: stop.stop_desc || "",
    })
  }, [stop])

  // Trigger preview when coordinates change
  const handleCoordinateChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    if (onPreview && newData.stop_lat && newData.stop_lon) {
      const lat = parseFloat(newData.stop_lat)
      const lon = parseFloat(newData.stop_lon)
      if (!isNaN(lat) && !isNaN(lon)) {
        onPreview({
          ...stop,
          ...newData,
          stop_lat: lat,
          stop_lon: lon,
        })
      }
    }
  }

  const handleChange = (field, value) => {
    if (field === 'stop_lat' || field === 'stop_lon') {
      handleCoordinateChange(field, value)
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setHasUnsavedChanges(true)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)

    try {
      const stopData = {
        ...formData,
        stop_lat: parseFloat(formData.stop_lat),
        stop_lon: parseFloat(formData.stop_lon),
      }

      let result
      if (stop.isNew) {
        result = await service.stops.createStop(currentProject.id, stopData)
      } else {
        result = await service.stops.updateStop(currentProject.id, stop.stop_id, stopData)
      }

      if (result.success) {
        toast.success(`Stop "${result.data.stop_name}" saved`)
        setHasUnsavedChanges(false)
        if (onSave) onSave(result.data)
      }
    } catch (error) {
      toast.error(error.message || "Failed to save stop")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DetailLayout
      icon={MapPin}
      label={stop.isNew ? "New Stop" : "Stop Details"}
      title={stop.isNew ? "Create Stop" : stop.stop_name}
      onSave={handleSubmit}
      loading={loading}
    >
      <form id="stop-form" onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="grid gap-1">
            <Label htmlFor="stop_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
              ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stop_id"
              value={formData.stop_id}
              onChange={(e) => handleChange("stop_id", e.target.value.toUpperCase())}
              maxLength={8}
              required
              disabled={!stop.isNew}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="stop_code" className="text-[10px] font-semibold text-muted-foreground uppercase">
              Code
            </Label>
            <Input
              id="stop_code"
              value={formData.stop_code}
              onChange={(e) => handleChange("stop_code", e.target.value)}
              maxLength={10}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="stop_name" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="stop_name"
            value={formData.stop_name}
            onChange={(e) => handleChange("stop_name", e.target.value)}
            required
            className="h-7 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="grid gap-1">
            <Label htmlFor="lat" className="text-[10px] font-semibold text-muted-foreground uppercase">
              Latitude <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lat"
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={formData.stop_lat}
              onChange={(e) => handleChange("stop_lat", e.target.value)}
              required
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="lon" className="text-[10px] font-semibold text-muted-foreground uppercase">
              Longitude <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lon"
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={formData.stop_lon}
              onChange={(e) => handleChange("stop_lon", e.target.value)}
              required
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="desc" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Description
          </Label>
          <Textarea
            id="desc"
            value={formData.stop_desc}
            onChange={(e) => handleChange("stop_desc", e.target.value)}
            rows={3}
            placeholder="Optional description"
            className="text-xs min-h-[60px] resize-none"
          />
        </div>
      </form>
    </DetailLayout>
  )
}