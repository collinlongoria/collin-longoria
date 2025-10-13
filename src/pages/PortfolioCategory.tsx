import { Link, useParams } from 'react-router-dom'
import { loadPortfolioByCategory } from '../lib/content'
import { CATEGORY_META } from '../data/categories'

export default function PortfolioCategory() {
    const { categoryKey } = useParams()
    const items = loadPortfolioByCategory(categoryKey!)
    const meta = CATEGORY_META[categoryKey!] ?? { title: categoryKey! }

    if (items.length === 0) return <div>Category not found or empty.</div>

    const grouped: Record<string, typeof items> = {}
    let anyGroup = false
    for (const it of items) {
        if (it.group) anyGroup = true
        const g = it.group ?? '__flat__'
        grouped[g] = grouped[g] ?? []
        grouped[g].push(it)
    }

    const renderCard = (it: any) => (
        <Link key={it.slug} to={`/portfolio/${categoryKey}/${it.slug}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <h3 className="font-garamond text-lg mb-1">{it.title}</h3>
            {it.summary && <p className="text-gray-600 line-clamp-3">{it.summary}</p>}
            <div className="mt-2 text-xs text-gray-500">{it.tags?.join(' • ')}</div>
        </Link>
    )

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-garamond text-3xl mb-2">{meta.title}</h1>
                {meta.description && <p className="text-gray-600">{meta.description}</p>}
            </div>

            {anyGroup ? (
                <div className="space-y-8">
                    {Object.entries(grouped).filter(([g]) => g !== '__flat__').map(([group, arr]) => (
                        <section key={group}>
                            <h2 className="font-garamond text-xl mb-3">{group}</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {arr.map(renderCard)}
                            </div>
                        </section>
                    ))}
                    {grouped['__flat__'] && grouped['__flat__'].length > 0 && (
                        <section>
                            <h2 className="font-garamond text-xl mb-3">Other</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {grouped['__flat__'].map(renderCard)}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(renderCard)}
                </div>
            )}
        </div>
    )
}
