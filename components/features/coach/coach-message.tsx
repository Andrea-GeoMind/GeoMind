import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface CoachMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function CoachMessage({ role, content, isStreaming = false }: CoachMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} className="text-indigo-600" />}
      </div>

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {isStreaming && (
          <span className="ml-1 inline-block h-3.5 w-0.5 animate-pulse bg-current opacity-60" />
        )}
      </div>
    </div>
  )
}
