import { Link, useParams } from 'react-router-dom'
import { loadPortfolioItem } from "../lib/content";
import ContentRenderer from "../components/ContentRenderer";

export default function PortfolioItem() {
    const { categoryKey, slug } = useParams()
    const item = loadPortfolioItem(categoryKey!, slug!)

    if(!item) return <div>Item not found. Not good!</div>

    return (
        <article className={"max-w-3xl mx-auto"}>
            <Link to={`/portfolio/${categoryKey}`} className="text-sm underline text-gray-600">← Back to {categoryKey}</Link>
            <h1 className="font-garamond text-3xl mt-2">{item.title}</h1>
            <div className="mt-2 text-xs text-gray-500">{item.tags?.join(' • ')}</div>
            <div className="mt-6">
                <ContentRenderer content={item.content} />
            </div>
            {item.links && item.links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                    {item.links.map(l => (
                        <a key={l.href} className="inline-flex px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50" href={l.href} target="_blank" rel="noreferrer">
                            {l.label}
                        </a>
                    ))}
                </div>
            )}
        </article>
    )
}