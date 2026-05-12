import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Bienvenue' },
  { label: 'Votre site' },
  { label: 'Analyse' },
]

type Props = {
  currentStep: 1 | 2 | 3
}

export function StepProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isActive && 'border-2 border-primary bg-background text-primary',
                  !isCompleted && !isActive && 'border-2 border-muted bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-0.5 w-16 transition-colors',
                  stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
