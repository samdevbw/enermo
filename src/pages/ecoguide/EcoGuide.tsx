import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Sun, Flame, ClipboardList, PackageSearch, Gauge, Store, Briefcase, Sprout, Search, ArrowRight, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEcoGuideChat } from '@/hooks/useEcoGuideChat'
import { ChatPanel } from '@/components/ecoguide/ChatPanel'
import { CATEGORY_LABELS, fetchArticles } from '@/services/ecoguide'
import { Spinner } from '@/components/ui'

const TOPICS: { title: string; blurb: string; prompt: string; icon: LucideIcon }[] = [
  { title: 'Solar Energy', blurb: 'How systems work and what they need', icon: Sun, prompt: 'How does a home solar system work, and what parts does it need?' },
  { title: 'Biogas Solutions', blurb: 'Cooking gas and fertiliser from waste', icon: Flame, prompt: 'Is biogas suitable for a farm, and how does it work?' },
  { title: 'Energy Assessment', blurb: 'Estimate the system size you need', icon: ClipboardList, prompt: 'I want to install solar at my house. Can you help me work out what size system I need?' },
  { title: 'Product Recommendations', blurb: 'Find listed products that fit', icon: PackageSearch, prompt: 'Recommend a hybrid inverter and battery for a 5kW home system.' },
  { title: 'Energy Efficiency', blurb: 'Cut your bill before buying', icon: Gauge, prompt: 'How can I reduce my electricity use before installing solar?' },
  { title: 'ENERMO Marketplace', blurb: 'Browse, compare and enquire', icon: Store, prompt: 'How do I find and contact a solar vendor on ENERMO?' },
  { title: 'Vendor Assistance', blurb: 'Register, get verified, list products', icon: Briefcase, prompt: 'How do I become an ENERMO vendor and list my products?' },
  { title: 'Green Technologies', blurb: 'Solar water heating, pumps and more', icon: Sprout, prompt: 'Besides solar panels, what clean energy options suit a home or farm in Botswana?' },
]

export function EcoGuide() {
  const chat = useEcoGuideChat()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()

  // /ecoguide?ask=... (from Learn articles) pre-fills the question; it is not
  // sent automatically, so a link can't spend AI quota on the user's behalf.
  useEffect(() => {
    const ask = params.get('ask')
    if (ask) {
      setDraft(ask.slice(0, 500))
      params.delete('ask')
      setParams(params, { replace: true })
      setTimeout(() => focusChat(), 50)
    }
  }, [params, setParams])

  function focusChat() {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    inputRef.current?.focus({ preventScroll: true })
  }

  function askTopic(prompt: string) {
    chat.send(prompt)
    focusChat()
  }

  return (
    <div className="bg-gray-50/60">
      {/* Hero + chat */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-50 border border-forest-100 px-3 py-1 rounded-full mb-4">
            ENERMO EcoGuide · Your Intelligent Guide to Clean Energy
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">Smarter Energy Decisions Start Here.</h1>
          <p className="text-gray-600 mt-3 leading-relaxed">
            Explore renewable energy, understand your options and discover solutions that work for your needs with ENERMO EcoGuide.
          </p>
        </div>
        <div ref={chatRef} className="scroll-mt-20">
          <ChatPanel chat={chat} draft={draft} onDraftChange={setDraft} inputRef={inputRef} />
        </div>
      </section>

      {/* Topics */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="font-display text-xl font-bold text-gray-900 mb-1">What can EcoGuide help with?</h2>
        <p className="text-sm text-gray-500 mb-5">Pick a topic to start a conversation.</p>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TOPICS.map((t) => (
            <li key={t.title}>
              <button
                type="button"
                onClick={() => askTopic(t.prompt)}
                disabled={chat.pending}
                className="w-full h-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-forest-300 hover:shadow-sm transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-forest-400"
              >
                <t.icon size={20} className="text-forest-600 mb-3" aria-hidden="true" />
                <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.blurb}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <LearnSection />
    </div>
  )
}

function LearnSection() {
  const { data: articles = [], isLoading, error } = useQuery({ queryKey: ['ecoguide-articles'], queryFn: fetchArticles, staleTime: 300_000 })
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')

  const categories = useMemo(() => [...new Set(articles.map((a) => a.category))], [articles])
  const shown = articles.filter((a) =>
    (!cat || a.category === cat) &&
    (!q || `${a.title} ${a.summary}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16" aria-labelledby="learn-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <h2 id="learn-heading" className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-forest-600" aria-hidden="true" /> Learn
          </h2>
          <p className="text-sm text-gray-500 mt-1">Plain-language guides to clean energy and to using ENERMO.</p>
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <label htmlFor="learn-search" className="sr-only">Search guides</label>
          <input
            id="learn-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by topic">
          {['', ...categories].map((c) => (
            <button
              key={c || 'all'}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                cat === c ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c ? CATEGORY_LABELS[c] ?? c : 'All'}
            </button>
          ))}
        </div>
      )}

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-gray-500">Guides are unavailable right now.</p>}
      {!isLoading && !error && shown.length === 0 && <p className="text-sm text-gray-500">No guides match your search.</p>}

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((a) => (
          <li key={a.id}>
            <Link
              to={`/ecoguide/learn/${a.slug}`}
              className="group flex flex-col h-full p-4 rounded-xl bg-white border border-gray-200 hover:border-forest-300 hover:shadow-sm transition"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-forest-700">{CATEGORY_LABELS[a.category] ?? a.category}</span>
              <span className="mt-1 text-sm font-semibold text-gray-900">{a.title}</span>
              <span className="mt-1 text-xs text-gray-500 flex-1">{a.summary}</span>
              <span className="mt-3 text-xs font-medium text-forest-700 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Read guide <ArrowRight size={12} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
