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
 * listes à puces / numérotées, titres ### rendus en gras, tableaux
 * | a | b | et règles horizontales ---.
 * Tolérant au streaming (fence non fermée = bloc de code en cours ; tableau
 * dont la ligne de séparation n'est pas encore arrivée = lignes de texte).
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


// ─── Tableaux et règles horizontales ─────────────────────────────────────────
// GEO structure volontairement ses réponses en tableaux (priorités, comparatifs).
// Sans ces deux cas, les pipes et les tirets s'affichaient tels quels.

/** Ligne de tableau : commence et finit par un pipe. */
export function isTableRow(line: string): boolean {
  return /^\|.*\|$/.test(line.trim())
}

/** Ligne de séparation d'en-tête : | --- | :--: | … */
export function isTableSeparator(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim()) && line.includes('-')
}

/** Règle horizontale seule sur sa ligne. */
export function isHorizontalRule(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())
}

export function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

function MarkdownTable({
  head,
  rows,
  blockKey,
}: {
  head: string[]
  rows: string[][]
  blockKey: string
}) {
  return (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.92em]">
        <thead>
          <tr className="border-b border-border">
            {head.map((cell, i) => (
              <th key={`${blockKey}-h${i}`} className="px-2 py-1.5 font-semibold">
                {renderInline(cell, `${blockKey}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={`${blockKey}-r${r}`} className="border-b border-border/50 last:border-0">
              {row.map((cell, c) => (
                <td key={`${blockKey}-r${r}c${c}`} className="px-2 py-1.5 align-top">
                  {renderInline(cell, `${blockKey}-r${r}c${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TextBlock({ content, blockKey }: { content: string; blockKey: string }) {
  const lines = content.split('\n')
  const nodes: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const key = `${blockKey}-l${i}`
    const trimmed = line.trim()

    // Tableau : une ligne de cellules suivie d'une ligne de séparation.
    // Tant que la séparation n'est pas arrivée (streaming), on laisse le
    // rendu texte s'en charger — le tableau s'affichera au prochain rendu.
    if (isTableRow(line) && isTableSeparator(lines[i + 1] ?? '')) {
      const head = splitCells(line)
      const rows: string[][] = []
      let j = i + 2
      while (j < lines.length && isTableRow(lines[j] ?? '')) {
        rows.push(splitCells(lines[j] ?? ''))
        j++
      }
      nodes.push(<MarkdownTable key={key} head={head} rows={rows} blockKey={key} />)
      i = j - 1
      continue
    }

    if (isHorizontalRule(line)) {
      nodes.push(<hr key={key} className="my-3 border-t border-border" />)
      continue
    }

    nodes.push(renderLine(line, trimmed, key))
  }

  return <>{nodes}</>
}

function renderLine(line: string, trimmed: string, key: string): ReactNode {
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
