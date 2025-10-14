import { useParams, Link } from "react-router-dom";
import { loadBlogPost } from "../lib/content";
import ContentRenderer from "../components/ContentRenderer";
import TagPill from "../components/TagPill";

export default function BlogPost() {
    const { slug } = useParams();
    const post = loadBlogPost(slug!);

    if (!post) return <div>Post not found.</div>;

    return (
        <article className="max-w-3xl mx-auto">
            <Link to="/blog" className="text-sm underline text-primary/80">← Back to blog</Link>

            <h1 className="font-garamond text-3xl mt-2 text-primary-darker">{post.title}</h1>
            {post.date && (
                <div className="text-xs text-primary/80">{new Date(post.date).toLocaleDateString()}</div>
            )}
            <TagPill tags={post.tags} className="mt-2" />

            {post.coverImage && (
                <figure className="mt-4 overflow-hidden rounded-xl border border-primary-darker/20 bg-primary4/40">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full object-cover"
                        loading="lazy"
                    />
                </figure>
            )}

            <div className="mt-6">
                <ContentRenderer content={post.content} />
            </div>

            <Link to="/blog" className="flex justify-center mt-8 text-sm underline text-primary/80">← Back to blog</Link>
        </article>
    );
}