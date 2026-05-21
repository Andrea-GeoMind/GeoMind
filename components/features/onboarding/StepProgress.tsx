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
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200',
                  isCompleted &&
                    'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30',
                  isActive &&
                    'border-2 border-indigo-600 bg-white text-indigo-600 shadow-sm ring-4 ring-indigo-600/10',
                  !isCompleted &&
                    !isActive &&
                    'border-2 border-border bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium tracking-wide',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-6 h-0.5 w-16 rounded-full transition-all duration-300',
                  stepNumber < currentStep
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                    : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
