import { useParams, Link } from "react-router-dom";
import { loadBlogPost } from "../lib/content";
import ContentRenderer from "../components/ContentRenderer";
import TagPill from "../components/TagPill";

export default function BlogPost() {
    const { slug } = useParams();
    const post = loadBlogPost(slug!);

    if (!post) return <div>Post not found.</div>;
    window.scrollTo(0, 0);
    return (
        <article className="max-w-3xl mx-auto">
            <Link to="/blog" className="text-sm underline font-body text-text2">← Back to blog</Link>

            <h1 className="font-header text-3xl mt-2 text-text">{post.title}</h1>
            {post.date && (
                <div className="text-xs font-body text-text2">{new Date(post.date).toLocaleDateString()}</div>
            )}
            <TagPill tags={post.tags} className="mt-2" />

            <div className="mt-6 font-body text-text">
                <ContentRenderer content={post.content} />
            </div>

            <Link to="/blog" className="flex justify-center mt-8 text-sm underline text-text2 font-body">← Back to blog</Link>
        </article>
    );
}