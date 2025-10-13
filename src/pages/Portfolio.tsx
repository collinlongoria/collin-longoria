import { Link } from 'react-router-dom'
import { loadPortfolio} from "../lib/content";
import { CATEGORY_META} from "../data/categories";

export default function Portfolio() {
    const all = loadPortfolio()
    const byCategory: Record<string, number> = {}
    for(const item of all) {
        byCategory[item.category] = (byCategory[item.category] ?? 0) + 1
    }
    const categories = Object.keys(byCategory)

    return(
        <div>
            <h1 className={"font-garamond text-3xl mb-6"}>Portfolio</h1>
            <div className={"grid sm:grid-cols-2 lg:grid-cols-3 gap-5"}>
                {categories.map(key => {
                    const meta = CATEGORY_META[key] ?? { title: key }
                    const count = byCategory[key]
                    return(
                        <Link key={key} to={`/portfolio/${key}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                            <h2 className="font-garamond text-xl mb-2 group-hover:text-primary">{meta.title}</h2>
                            {meta.description && <p className="text-gray-600 line-clamp-3">{meta.description}</p>}
                            <div className="mt-3 text-sm text-gray-500">{count} items</div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}