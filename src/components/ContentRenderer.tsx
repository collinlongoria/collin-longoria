import React, {JSX} from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { SiItchdotio } from "react-icons/si"
import ImageScroller from "./ImageScroller";

export default function ContentRenderer({ content }: { content: string }) {
    const asBlock = (el: JSX.Element) => <div className="my-6 block w-full">{el}</div>

    const containsBlockHTML = (node: any) =>
        (node?.children ?? []).some((c: any) => {
            if (c.type === 'element') {
                const t = String(c.tagName || '').toLowerCase()
                return ['youtube','imagescroller','section','div','iframe'].includes(t)
            }
            if (c.type === 'raw' && typeof c.value === 'string') {
                return /<(youtube|imagescroller|section|div|iframe)\b/i.test(c.value)
            }
            return false
        })

    return (
        <article className="prose max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                unwrapDisallowed={false}
                components={
                    {
                        p: ({node, children}) => (containsBlockHTML(node) ? <>{children}</> : <p>{children}</p>),

                        linkbutton: (props: any) => {
                            const href = props.href
                            const children = props.children
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={href}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border bg-primary/10 hover:bg-primary/20 text-primary"
                                >
                                    <SiItchdotio size={32} className="text-primary" />
                                    <span>{children}</span>
                                </a>
                            )
                        },
                        imagescroller: (props: any) => {
                            const sources = props["data-images"]?.split(",") || []
                            const alts = props["data-alts"]?.split(",") || []
                            return asBlock(<section><ImageScroller images={sources} altTexts={alts} /></section>)
                        },
                        youtube: (props: any) => {
                            const id = props["data-id"]
                            const title = props["data-title"] ?? "Youtube Video"
                            if(!id) return null

                            return asBlock(
                                <div className={"my-6 aspect-video w-full overflow-hidden rounded-xl border border-primary/30 shadow-sm"}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${id}`}
                                        title={title}
                                        allowFullScreen
                                        className={"w-full h-full"}
                                    />
                                </div>
                            )
                        },
                    } as Components
                }
            >
                {content.trimEnd() + "\n"}
            </ReactMarkdown>
        </article>
    )
}