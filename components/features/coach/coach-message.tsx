'use client'

import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import { CoachMarkdown } from '@/components/features/coach/coach-markdown'

interface CoachMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function CoachMessage({ role, content, isStreaming = false }: CoachMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User size={14} />
        </div>
      ) : (
        <GeoAvatar size="sm" pulse={isStreaming} />
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <CoachMarkdown content={content} />
        )}
        {isStreaming && (
          <span className="ml-1 inline-block h-3.5 w-0.5 animate-pulse bg-current opacity-60" />
        )}
      </div>
    </div>
  )
}
