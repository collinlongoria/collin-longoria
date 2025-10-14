import { Link } from "react-router-dom";
import { loadBlogIndex } from "../lib/content";
import TagPill from "../components/TagPill"

export default function Blog() {
    const posts = loadBlogIndex();
    const [latest, ...rest] = posts;

    const Card = (p: any) => (
        <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="rounded-2xl border border-primary-darker/20 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
        >
            {p.coverImage && (
                <div className="aspect-[16/9] w-full bg-primary4/40">
                    <img
                        src={p.coverImage}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="p-5">
                <div className="font-merriweather text-xs text-primary/80">
                    {p.date ? new Date(p.date).toLocaleDateString() : ""}
                </div>
                <h3 className="font-garamond text-xl mt-1 text-primary-darker">{p.title}</h3>
                {p.summary && <p className="font-merriweather text-primary mt-2 line-clamp-3">{p.summary}</p>}
                <TagPill tags={p.tags} className="mt-3" />
            </div>
        </Link>
    );

    return (
        <div className="space-y-4">
            <div className={"rounded-2xl border border-primary-darker p-2 bg-primary4 overflow-hidden overflow-hidden overflow-hidden shadow-sm "}>
                <h1 className="flex justify-center font-garamond text-3xl text-primary-darker">Blog</h1>
                <p className={"flex justify-center font-merriweather text-sm text-primary"}>
                    DevLogs, announcements, and anything else that interests me.
                </p>
            </div>

            <h1 className={"text-3xl font-garamond text-primary-darker"}>Latest</h1>
            {latest && (
                <Link
                    to={`/blog/${latest.slug}`}
                    className="block rounded-2xl border border-primary-darker bg-primary3 shadow-sm hover:shadow-xl transition overflow-hidden"
                >
                    {latest.coverImage && (
                        <div className="aspect-[16/9] w-full bg-primary4/40">
                            <img
                                src={latest.coverImage}
                                alt={latest.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="font-merriweather text-xs text-primary/80">
                            {latest.date ? new Date(latest.date).toLocaleDateString() : ""}
                        </div>
                        <h2 className="font-garamond text-2xl mt-1 text-primary-darker">{latest.title}</h2>
                        {latest.summary && <p className="font-merriweather text-primary mt-2">{latest.summary}</p>}
                        <TagPill tags={latest.tags} className="mt-3" />
                    </div>
                </Link>
            )}

            <h1 className={"text-3xl font-garamond text-primary-darker"}>Older</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(Card)}
            </div>
        </div>
    );
}