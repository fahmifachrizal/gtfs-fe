import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"

/**
 * Shared Detail Panel Layout
 * Provides consistent header, footer, and structure for all detail panels
 * Content remains separate in individual detail components
 */
export function DetailLayout({
  icon: Icon,
  label,
  title,
  description,
  children,
  onSave,
  onClose,
  loading = false,
  saveLabel = "Save Changes",
  showSaveButton = true,
  customFooter = null,
}) {
  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="space-y-1 flex-none border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {Icon && <Icon className="h-3 w-3" />}
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              {label}
            </span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 -mr-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <h2 className="text-lg font-bold truncate leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-1 min-h-0">
        {children}
      </div>

      {/* Footer */}
      {(showSaveButton || customFooter) && (
        <div className="pt-2 border-t mt-auto flex-none">
          {customFooter || (
            <Button
              type="submit"
              onClick={onSave}
              className="w-full h-8 text-xs font-medium"
              disabled={loading}
            >
              <Save className="w-3 h-3 mr-2" />
              {loading ? "Saving..." : saveLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}