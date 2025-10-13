import { Link } from 'react-router-dom'
import {loadBlogIndex} from "../lib/content";

export default function Blog() {
    const posts = loadBlogIndex()
    const [latest, ...rest] = posts

    return(
        <div className={"space-y-8"}>
            <h1 className={"font-garamond text-3xl"}>Blog</h1>

            {latest && (
                <Link to={`/blog/${latest.slug}`} className={"block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"}>
                    <div className={"text-xs text-gray-500"}>{latest.date ? new Date(latest.date).toLocaleDateString() : ''}</div>
                    <h2 className={"font-garamond text-2xl mt-1"}>{latest.title}</h2>
                    {latest.summary && <p className={"text-gray-700 mt-2"}>{latest.summary}</p>}
                </Link>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(p => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                        <div className="text-xs text-gray-500">{p.date ? new Date(p.date).toLocaleDateString() : ''}</div>
                        <h3 className="font-garamond text-lg mt-1">{p.title}</h3>
                        {p.summary && <p className="text-gray-600 line-clamp-3">{p.summary}</p>}
                    </Link>
                ))}
            </div>
        </div>
    )
}