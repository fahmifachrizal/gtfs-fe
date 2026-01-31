import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Layout({
    icon: Icon,
    label,
    title,
    description,
    children,
    footer,
    onClose,
    loading = false,
    className
}) {
    return (
        <div className={cn("space-y-3 h-full flex flex-col", className)}>
            {/* Header */}
            <div className="space-y-1 flex-none border-b pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        {Icon && <Icon className="h-3 w-3" />}
                        <span className="text-[10px] uppercase tracking-wider font-semibold">
                            {label}
                        </span>
                    </div>
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

            {/* Content */}
            <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className="pt-2 border-t mt-auto flex-none flex gap-2">
                    {footer}
                </div>
            )}
        </div>
    )
}
