import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { GTFS_STEPS } from "./ProgressStepper"

export function WorkflowNavigation({ currentStep, completionStatus = {}, className = "" }) {
    const navigate = useNavigate()

    const currentIndex = GTFS_STEPS.findIndex(step => step.id === currentStep)
    const previousStep = currentIndex > 0 ? GTFS_STEPS[currentIndex - 1] : null
    const nextStep = currentIndex < GTFS_STEPS.length - 1 ? GTFS_STEPS[currentIndex + 1] : null

    // Check if current step requirements are met
    const currentStepComplete = completionStatus[currentStep]
    const currentStepRequired = GTFS_STEPS[currentIndex]?.required

    // Check if user can navigate to next step (linear progression)
    const canGoNext = () => {
        if (!nextStep) return false

        // Check all previous required steps are completed
        for (let i = 0; i <= currentIndex; i++) {
            const step = GTFS_STEPS[i]
            if (step.required && !completionStatus[step.id]) {
                return false
            }
        }

        return true
    }

    const handlePrevious = () => {
        if (previousStep) {
            navigate(previousStep.path)
        }
    }

    const handleNext = () => {
        if (nextStep && canGoNext()) {
            navigate(nextStep.path)
        }
    }

    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!previousStep}
                className="flex items-center gap-2"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                    {previousStep ? previousStep.label : 'Previous'}
                </span>
                <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex-1 text-center">
                {currentStepRequired && !currentStepComplete && (
                    <p className="text-xs text-muted-foreground">
                        Complete this step to continue
                    </p>
                )}
                {currentStepComplete && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                        ✓ Step complete
                    </p>
                )}
                {!currentStepRequired && (
                    <p className="text-xs text-muted-foreground">
                        Optional step
                    </p>
                )}
            </div>

            <Button
                onClick={handleNext}
                disabled={!nextStep || !canGoNext()}
                className="flex items-center gap-2"
            >
                <span className="hidden sm:inline">
                    {nextStep ? nextStep.label : 'Next'}
                </span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    )
}
