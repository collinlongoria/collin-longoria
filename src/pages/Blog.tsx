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
            className="btn-jump rounded-2xl border-2 border-outline bg-primary shadow-sm hover:shadow-md transition overflow-hidden"
        >
            {p.coverImage && (
                <div className="aspect-[16/9] w-full bg-primary">
                    <img
                        src={p.coverImage}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="p-5">
                <div className="font-header text-xs text-text">
                    {p.date ? new Date(p.date).toLocaleDateString() : ""}
                </div>
                <h3 className="font-header text-xl mt-1 text-text">{p.title}</h3>
                {p.summary && <p className="font-body text-text2 mt-2 line-clamp-3">{p.summary}</p>}
                <TagPill tags={p.tags} className="mt-3" />
            </div>
        </Link>
    );

    return (
        <div className="space-y-4">
            <div className={"rounded-2xl border-2 border-outline p-2 bg-primary overflow-hidden shadow-sm "}>
                <h1 className="flex justify-center font-header text-3xl text-text">Blog</h1>
                <p className={"flex justify-center font-body text-sm text-text2"}>
                    DevLogs, announcements, and anything else that interests me.
                </p>
            </div>

            <h1 className={"text-3xl font-header text-text"}>Latest</h1>
            {latest && (
                <Link
                    to={`/blog/${latest.slug}`}
                    className="btn-jump block rounded-2xl border-2 border-outline bg-primary transition overflow-hidden max-w-md mx-auto"
                >
                    {latest.coverImage && (
                        <div className="aspect-[16/9] w-full bg-primary4/40">
                            <img
                                src={latest.coverImage}
                                alt={latest.title}
                                className="h-full w-full object-cover"
                                loading="eager"
                            />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="font-body text-xs text-text2">
                            {latest.date ? new Date(latest.date).toLocaleDateString() : ""}
                        </div>
                        <h2 className="font-header text-2xl mt-1 text-text">{latest.title}</h2>
                        {latest.summary && <p className="font-body text-text2 mt-2">{latest.summary}</p>}
                        <TagPill tags={latest.tags} className="mt-3" />
                    </div>
                </Link>
            )}

            <h1 className={"text-3xl font-header text-text"}>Older</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(Card)}
            </div>
        </div>
    );
}