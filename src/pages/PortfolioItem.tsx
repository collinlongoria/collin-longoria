import { useParams, Link } from 'react-router-dom'
import { loadPortfolioItem } from '../lib/content'
import ContentRenderer from '../components/ContentRenderer'
import TagPill from '../components/TagPill'

type Props = { forcedSlug?: string }

export default function PortfolioItem({ forcedSlug }: Props) {
    const { categoryKey, slug: slugFromParams } = useParams()
    const slug = forcedSlug ?? slugFromParams!
    const item = loadPortfolioItem(categoryKey, slug)

    if (!item) return <div>Item not found.</div>

    const backHref = '/portfolio'
    const backLabel = 'Portfolio'
    window.scrollTo(0, 0);

    return (
        <article className="max-w-3xl mx-auto">
            <Link to={backHref} className="text-sm underline font-body text-text2">
                ← Back to {backLabel}
            </Link>
            <h1 className="font-header text-3xl mt-2 text-text">{item.title}</h1>
            <h3 className="font-header text-md mt-2 text-text2">{item.group}</h3>
            <TagPill tags={item.tags} className="mt-2" />

            <div className="mt-6">
                <ContentRenderer content={item.content} />
            </div>
        </article>
    )
}

/*
(removed but may put back later)
           {item.coverImage && (
                <figure className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img src={item.coverImage} alt={item.title} className="w-full object-cover" loading="lazy" />
                </figure>
            )}
*/