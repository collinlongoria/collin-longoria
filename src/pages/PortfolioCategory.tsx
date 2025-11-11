import { Link, useParams } from 'react-router-dom'
import { loadPortfolioByCategory } from '../lib/content'
import { CATEGORY_META } from '../data/categories'
import TagPill from '../components/TagPill'

type Props = { forcedKey?: string }

export default function PortfolioCategory({ forcedKey }: Props) {
    const params = useParams()
    const categoryKey = forcedKey ?? params.categoryKey!
    const items = loadPortfolioByCategory(categoryKey)
    const meta = CATEGORY_META[categoryKey] ?? { title: categoryKey }

    if (items.length === 0) return <div>Category not found or empty.</div>

    const groups: Record<string, typeof items> = {}
    const flat: typeof items = []
    for (const it of items) (it.group ? (groups[it.group] ||= []).push(it) : flat.push(it))

    const renderCard = (it: any) => (
        <Link
            key={it.slug}
            to={`/portfolio/${categoryKey}/${it.slug}`}
            className="rounded-2xl border border-primary-darker bg-primary3 shadow-xm hover:shadow-xl transition overflow-hidden"
        >
            {it.coverImage && (
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img src={it.coverImage} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
            )}
            <div className="p-5">
                <h3 className="font-garamond text-lg mb-1">{it.title}</h3>
                {it.summary && <p className="text-gray-600 line-clamp-3">{it.summary}</p>}
                <TagPill tags={it.tags} className="mt-2" />
            </div>
        </Link>
    )

    return (
        <div className="space-y-8">
            <Link to='/portfolio' className="text-sm font-body underline text-text2">
                ← Back to Portfolio
            </Link>
            <div>
                <h1 className="font-header text-text text-3xl mb-2">{meta.title}</h1>
                {meta.description && <p className="font-body text-text2">{meta.description}</p>}
            </div>

            {flat.length > 0 && (
                <section>
                    <h2 className="font-header text-xl text-text mb-3">Ungrouped</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{flat.map(renderCard)}</div>
                </section>
            )}

            {Object.entries(groups).map(([groupName, arr]) => (
                <section key={groupName}>
                    <h2 className="font-header text-text text-xl mb-3">{groupName}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{arr.map(renderCard)}</div>
                </section>
            ))}
        </div>
    )
}