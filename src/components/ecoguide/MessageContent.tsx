import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Renders the small markdown subset EcoGuide is told to use: paragraphs,
 * bullet/numbered lists, **bold**, headings, and internal links.
 * Builds React elements (no innerHTML), and only renders links to ENERMO's
 * own pages — anything else becomes plain text.
 */
export function MessageContent({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const bullet = /^\s*[-*•]\s+(.*)$/
    const numbered = /^\s*\d+[.)]\s+(.*)$/

    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line)
      const re = ordered ? numbered : bullet
      const items: string[] = []
      while (i < lines.length && re.test(lines[i])) {
        items.push(lines[i].replace(re, '$1'))
        i++
      }
      const ListTag = ordered ? 'ol' : 'ul'
      blocks.push(
        <ListTag key={blocks.length} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
          {items.map((it, k) => <li key={k}>{inline(it)}</li>)}
        </ListTag>,
      )
      continue
    }

    const heading = /^#{1,4}\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push(<p key={blocks.length} className="font-semibold text-gray-900">{inline(heading[1])}</p>)
      i++
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !bullet.test(lines[i]) && !numbered.test(lines[i]) && !/^#{1,4}\s/.test(lines[i])) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push(<p key={blocks.length}>{inline(para.join(' '))}</p>)
  }

  return <div className="space-y-3 text-sm leading-relaxed">{blocks}</div>
}

const INTERNAL = /^\/(product|vendors|ecoguide|marketplace|signup|signin|contact|about)\b[\w\-/?=&.#]*$/

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(<strong key={out.length} className="font-semibold text-gray-900">{m[1]}</strong>)
    } else if (INTERNAL.test(m[3])) {
      out.push(<Link key={out.length} to={m[3]} className="text-primary-700 underline underline-offset-2 hover:text-primary-800">{m[2]}</Link>)
    } else {
      out.push(<Fragment key={out.length}>{m[2]}</Fragment>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
