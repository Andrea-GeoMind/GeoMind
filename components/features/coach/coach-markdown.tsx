'use client'

import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'

/**
 * Rendu Markdown minimal et robuste des réponses de GEO (§16.10), sans
 * dépendance lourde ni dangerouslySetInnerHTML : tout est construit en
 * éléments React à partir d'un parsing tokenisé.
 *
 * Supporté : blocs de code ``` (avec étiquette de langage + bouton
 * « Copier »), `code inline`, **gras**, *italique*, liens [texte](url),
 * listes à puces / numérotées, titres ### rendus en gras.
 * Tolérant au streaming (fence non fermée = bloc de code en cours).
 */

interface CoachMarkdownProps {
  content: string
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; lang: string }

function splitSegments(markdown: string): Segment[] {
  const segments: Segment[] = []
  const lines = markdown.split('\n')
  let buffer: string[] = []
  let inCode = false
  let lang = ''

  const flush = () => {
    const content = buffer.join('\n')
    if (content.trim().length > 0) {
      segments.push(inCode ? { type: 'code', content, lang } : { type: 'text', content })
    }
    buffer = []
  }

  for (const line of lines) {
    const fence = /^```([\w-]*)\s*$/.exec(line)
    if (fence) {
      flush()
      if (!inCode) {
        inCode = true
        lang = fence[1] ?? ''
      } else {
        inCode = false
        lang = ''
      }
    } else {
      buffer.push(line)
    }
  }
  flush()
  return segments
}

const INLINE_PATTERN =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let i = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0]
    const index = match.index
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index))

    const key = `${keyPrefix}-${i++}`
    if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(token)
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        nodes.push(token)
      }
    }
    lastIndex = index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function TextBlock({ content, blockKey }: { content: string; blockKey: string }) {
  const lines = content.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const key = `${blockKey}-l${i}`
        const trimmed = line.trim()
        if (trimmed.length === 0) return <div key={key} className="h-2" aria-hidden />

        const bullet = /^[-*]\s+(.*)$/.exec(trimmed)
        if (bullet) {
          return (
            <p key={key} className="flex gap-2 pl-1">
              <span aria-hidden className="select-none">
                •
              </span>
              <span className="min-w-0 flex-1">{renderInline(bullet[1] ?? '', key)}</span>
            </p>
          )
        }

        const ordered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed)
        if (ordered) {
          return (
            <p key={key} className="flex gap-2 pl-1">
              <span className="select-none font-semibold">{ordered[1]}.</span>
              <span className="min-w-0 flex-1">{renderInline(ordered[2] ?? '', key)}</span>
            </p>
          )
        }

        const heading = /^#{1,4}\s+(.*)$/.exec(trimmed)
        if (heading) {
          return (
            <p key={key} className="font-bold">
              {renderInline(heading[1] ?? '', key)}
            </p>
          )
        }

        return <p key={key}>{renderInline(line, key)}</p>
      })}
    </>
  )
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true)
        captureCoachEvent('coach_code_copied', { lang: lang || null })
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err: unknown) => {
        console.error('[CoachMarkdown] copy failed:', err)
      })
  }

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          aria-label="Copier le code"
        >
          {copied ? (
            <>
              <Check size={11} /> Copié ✓
            </>
          ) : (
            <>
              <Copy size={11} /> Copier
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function CoachMarkdown({ content }: CoachMarkdownProps) {
  const segments = splitSegments(content)

  return (
    <div className="space-y-1 break-words">
      {segments.map((segment, i) =>
        segment.type === 'code' ? (
          <CodeBlock key={`s${i}`} code={segment.content} lang={segment.lang} />
        ) : (
          <TextBlock key={`s${i}`} content={segment.content} blockKey={`s${i}`} />
        )
      )}
    </div>
  )
}
