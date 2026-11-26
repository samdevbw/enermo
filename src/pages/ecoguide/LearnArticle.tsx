import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Leaf } from 'lucide-react'
import { CATEGORY_LABELS, fetchArticle } from '@/services/ecoguide'
import { MessageContent } from '@/components/ecoguide/MessageContent'
import { Button, EmptyState, Spinner } from '@/components/ui'

export function LearnArticle() {
  const { slug = '' } = useParams()
  const { data: article, isLoading } = useQuery({
    queryKey: ['ecoguide-article', slug],
    queryFn: () => fetchArticle(slug),
    staleTime: 300_000,
  })

  if (isLoading) return <div className="py-16"><Spinner /></div>
  if (!article) {
    return (
      <EmptyState
        title="Guide not found"
        description="It may have been moved or unpublished."
        action={<Link to="/ecoguide"><Button variant="outline">Back to EcoGuide</Button></Link>}
      />
    )
  }

  const ask = encodeURIComponent(`I just read "${article.title}". `)

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/ecoguide" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> EcoGuide
      </Link>
      <p className="text-xs font-medium uppercase tracking-wide text-forest-700">{CATEGORY_LABELS[article.category] ?? article.category}</p>
      <h1 className="font-display text-3xl font-bold text-gray-900 mt-1">{article.title}</h1>
      <p className="text-gray-600 mt-2">{article.summary}</p>

      <div className="mt-8 text-gray-700 [&_p]:text-base [&_li]:text-base [&_.text-sm]:text-base">
        <MessageContent text={article.content ?? ''} />
      </div>

      <div className="mt-10 p-5 rounded-2xl border border-forest-200 bg-forest-50/60 flex flex-col sm:flex-row sm:items-center gap-4">
        <Leaf size={24} className="text-forest-700 shrink-0" aria-hidden="true" />
        <p className="text-sm text-gray-700 flex-1">Have a question about your own situation? EcoGuide can apply this to your home, farm or business.</p>
        <Link to={`/ecoguide?ask=${ask}`}>
          <Button variant="secondary">Ask EcoGuide</Button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        General guidance only. Figures are typical ranges; confirm details with a qualified professional. Last updated{' '}
        {new Date(article.updated_at).toLocaleDateString('en-BW', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </p>
    </article>
  )
}
