import { Check, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

const GTFS_STEPS = [
    {
        id: "welcome",
        label: "Welcome",
        path: "/editor",
        required: false,
        description: "Get started"
    },
    {
        id: "agency",
        label: "Agency",
        path: "/editor/agency",
        required: true,
        description: "Transit agency information"
    },
    {
        id: "stops",
        label: "Stops",
        path: "/editor/stops",
        required: true,
        description: "Transit stops and stations"
    },
    {
        id: "routes",
        label: "Routes",
        path: "/editor/routes",
        required: true,
        description: "Transit routes"
    },
    {
        id: "shapes",
        label: "Shapes",
        path: "/editor/shapes",
        required: false,
        description: "Route geometry (optional)"
    },
    {
        id: "trips",
        label: "Trips",
        path: "/editor/trips",
        required: true,
        description: "Individual trips"
    },
    {
        id: "calendar",
        label: "Calendar",
        path: "/editor/calendar",
        required: true,
        description: "Service schedules"
    },
    {
        id: "stop-times",
        label: "Stop Times",
        path: "/editor/stop-times",
        required: true,
        description: "Trip schedules"
    },
    {
        id: "frequencies",
        label: "Frequencies",
        path: "/editor/frequencies",
        required: false,
        description: "Headway-based service (optional)"
    },
    {
        id: "transfers",
        label: "Transfers",
        path: "/editor/transfers",
        required: false,
        description: "Transfer rules (optional)"
    },
    {
        id: "fares",
        label: "Fares",
        path: "/editor/fares",
        required: false,
        description: "Fare information (optional)"
    },
]

export function ProgressStepper({ currentStep, completionStatus = {}, compact = false }) {
    const navigate = useNavigate()

    const currentIndex = GTFS_STEPS.findIndex(step => step.id === currentStep)

    const canNavigateToStep = (stepIndex) => {
        // Can always go to welcome
        if (stepIndex === 0) return true

        // Can navigate to current or previous steps
        if (stepIndex <= currentIndex) return true

        // Can navigate to next step if current required steps are complete
        const previousRequiredSteps = GTFS_STEPS.slice(0, stepIndex).filter(s => s.required)
        return previousRequiredSteps.every(step => completionStatus[step.id])
    }

    const handleStepClick = (step, index) => {
        if (canNavigateToStep(index)) {
            navigate(step.path)
        }
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {GTFS_STEPS.map((step, index) => {
                    const isComplete = completionStatus[step.id]
                    const isCurrent = step.id === currentStep
                    const canNavigate = canNavigateToStep(index)

                    return (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => handleStepClick(step, index)}
                                disabled={!canNavigate}
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                                    isCurrent && "border-primary bg-primary text-primary-foreground",
                                    !isCurrent && isComplete && "border-green-500 bg-green-500 text-white",
                                    !isCurrent && !isComplete && canNavigate && "border-muted-foreground/30 hover:border-primary",
                                    !canNavigate && "border-muted-foreground/20 opacity-50 cursor-not-allowed"
                                )}
                                title={`${step.label}${step.required ? ' (required)' : ' (optional)'}`}
                            >
                                {isComplete ? (
                                    <Check className="w-4 h-4" />
                                ) : !canNavigate && !isCurrent ? (
                                    <Lock className="w-3 h-3" />
                                ) : (
                                    <Circle className="w-2 h-2 fill-current" />
                                )}
                            </button>
                            {index < GTFS_STEPS.length - 1 && (
                                <div className={cn(
                                    "w-4 h-0.5",
                                    isComplete ? "bg-green-500" : "bg-muted-foreground/20"
                                )} />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {GTFS_STEPS.map((step, index) => {
                const isComplete = completionStatus[step.id]
                const isCurrent = step.id === currentStep
                const canNavigate = canNavigateToStep(index)

                return (
                    <button
                        key={step.id}
                        onClick={() => handleStepClick(step, index)}
                        disabled={!canNavigate}
                        className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
                            isCurrent && "border-primary bg-primary/5",
                            !isCurrent && isComplete && "border-green-500/30 bg-green-500/5",
                            !isCurrent && !isComplete && canNavigate && "border-muted-foreground/20 hover:border-primary/50",
                            !canNavigate && "border-muted-foreground/10 opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5",
                            isCurrent && "border-primary bg-primary text-primary-foreground",
                            !isCurrent && isComplete && "border-green-500 bg-green-500 text-white",
                            !isCurrent && !isComplete && "border-muted-foreground/30"
                        )}>
                            {isComplete ? (
                                <Check className="w-3.5 h-3.5" />
                            ) : !canNavigate && !isCurrent ? (
                                <Lock className="w-3 h-3" />
                            ) : (
                                <span className="text-xs font-semibold">{index}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-semibold text-sm",
                                    isCurrent && "text-primary"
                                )}>
                                    {step.label}
                                </span>
                                {!step.required && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        Optional
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {step.description}
                            </p>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

export { GTFS_STEPS }
