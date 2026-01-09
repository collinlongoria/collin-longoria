import { useParams, Link } from "react-router-dom";
import { loadBlogPost } from "../lib/content";
import ContentRenderer from "../components/ContentRenderer";
import TagPill from "../components/TagPill";

export default function BlogPost() {
    const { slug } = useParams();
    // Pass true to include private posts (they're still viewable via direct link)
    const post = loadBlogPost(slug!, true);

    if (!post) return <div>Post not found.</div>;
    window.scrollTo(0, 0);

    return (
        <article className="max-w-3xl mx-auto">
            <Link to="/blog" className="text-sm underline font-body text-text2">← Back to blog</Link>

            <h1 className="font-header text-3xl mt-2 text-text">{post.title}</h1>

            <div className="flex items-center gap-3 mt-1">
                {post.date && (
                    <span className="text-xs font-body text-text2">
                        {new Date(post.date).toLocaleDateString()}
                    </span>
                )}
                <span className="text-xs font-body text-text2">
                    · {post.readingTime} min read
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
                {post.private && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white uppercase tracking-wide">
                        Private
                    </span>
                )}
                <TagPill tags={post.tags} />
            </div>

            <div className="mt-6 font-body text-text">
                <ContentRenderer content={post.content} />
            </div>

            <Link to="/blog" className="flex justify-center mt-8 text-sm underline text-text2 font-body">← Back to blog</Link>
        </article>
    );
}