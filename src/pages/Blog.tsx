import { Link } from "react-router-dom";
import { loadBlogIndex } from "../lib/content";
import TagPill from "../components/TagPill"

// Set this to true during development to see private posts in the index
const SHOW_PRIVATE_POSTS = true;

export default function Blog() {
    const posts = loadBlogIndex(SHOW_PRIVATE_POSTS);
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
                <div className="flex items-center gap-2 font-header text-xs text-text">
                    {p.date ? new Date(p.date).toLocaleDateString() : ""}
                    <span className="text-text2">· {p.readingTime} min read</span>
                </div>
                <h3 className="font-header text-xl mt-1 text-text">{p.title}</h3>
                {p.summary && <p className="font-body text-text2 mt-2 line-clamp-3">{p.summary}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {p.private && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white uppercase tracking-wide">
                            Private
                        </span>
                    )}
                    <TagPill tags={p.tags} />
                </div>
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
                        <div className="flex items-center gap-2 font-body text-xs text-text2">
                            {latest.date ? new Date(latest.date).toLocaleDateString() : ""}
                            <span>· {latest.readingTime} min read</span>
                        </div>
                        <h2 className="font-header text-2xl mt-1 text-text">{latest.title}</h2>
                        {latest.summary && <p className="font-body text-text2 mt-2">{latest.summary}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {latest.private && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white uppercase tracking-wide">
                                    Private
                                </span>
                            )}
                            <TagPill tags={latest.tags} />
                        </div>
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