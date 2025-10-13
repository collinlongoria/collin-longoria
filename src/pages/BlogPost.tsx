import { useParams, Link } from "react-router-dom";
import { loadBlogPost } from "../lib/content";
import ContentRenderer from "../components/ContentRenderer";

export default function BlogPost(){
    const { slug } = useParams();
    const post = loadBlogPost(slug!);

    if(!post) return <div>Post not found! Not good.</div>

    return (
        <article className={"max-w-3xl mx-auto"}>
            <Link to={"/blog"} className={"text-sm underline text-gray-600"}>← Back to blog</Link>
            <h1 className={"font-garamond text-3xl mt-2"}>{post.title}</h1>
            {post.date && <div className={"text-xs text-gray-500"}>{new Date(post.date).toLocaleDateString()}</div>}
            <div className={"mt-6"}>
                <ContentRenderer content={post.content} />
            </div>
        </article>
    )
}