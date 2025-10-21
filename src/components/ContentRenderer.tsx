import React from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { SiItchdotio } from "react-icons/si"
import ImageScroller from "./ImageScroller";

export default function ContentRenderer({ content }: { content: string }) {
    return (
        <article className="prose max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={
                    {
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
                            return <section><ImageScroller images={sources} altTexts={alts} /></section>
                        },
                    } as Components
                }
            >
                {content.trimEnd() + "\n"}
            </ReactMarkdown>
        </article>
    )
}