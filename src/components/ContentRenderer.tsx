import React, {JSX} from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { SiItchdotio } from "react-icons/si"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ImageScroller from "./ImageScroller";
import ThreeGame from "./ThreeGame";

export default function ContentRenderer({ content }: { content: string }) {
    const asBlock = (el: JSX.Element) => <div className="my-6 block w-full">{el}</div>

    const containsBlockHTML = (node: any) =>
        (node?.children ?? []).some((c: any) => {
            if (c.type === 'element') {
                const t = String(c.tagName || '').toLowerCase()
                return ['youtube','imagescroller','section','div','iframe', 'threegame'].includes(t)
            }
            if (c.type === 'raw' && typeof c.value === 'string') {
                return /<(youtube|imagescroller|section|div|iframe|threegame)\b/i.test(c.value)
            }
            return false
        })

    return (
        <article className="prose max-w-none text-text font-body prose-headings:text-text prose-strong:text-text">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                unwrapDisallowed={false}
                components={
                    {
                        p: ({node, children}) => (containsBlockHTML(node) ? <>{children}</> : <p>{children}</p>),

                        code: ({node, className, children, ...props}: any) => {
                            const hasLangClass = /language-(\w+)/.test(className || '')
                            const isInPre = node?.position &&
                                node.position.start.line !== node.position.end.line

                            // If no language class and content is short/single-line, treat as inline
                            const content = String(children).replace(/\n$/, '')
                            const isMultiLine = content.includes('\n')
                            const isInline = !hasLangClass && !isMultiLine && !isInPre

                            if (isInline) {
                                return (
                                    <code
                                        className="bg-primary text-text px-1.5 py-0.5 rounded font-code text-sm"
                                        style={{ display: 'inline' }}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                )
                            }

                            // Code blocks with syntax highlighting
                            const match = /language-(\w+)/.exec(className || '')
                            const language = match ? match[1] : 'text'

                            // Clean the content - remove any leading/trailing backticks that might have leaked through
                            let cleanContent = content
                                .replace(/^`{1,3}[\w]*\n?/, '') // Remove opening fence
                                .replace(/\n?`{1,3}$/, '')      // Remove closing fence
                                .trim()

                            return (
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={language}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        padding: '1rem',
                                    }}
                                    {...props}
                                >
                                    {cleanContent}
                                </SyntaxHighlighter>
                            )
                        },

                        pre: ({children, node, ...props}: any) => {
                            // Check if the child is already a SyntaxHighlighter (rendered code block)
                            // If so, just return children to avoid double-wrapping
                            return (
                                <pre className="not-prose my-4" {...props}>
                                    {children}
                                </pre>
                            )
                        },

                        linkbutton: (props: any) => {
                            const href = props.href
                            const children = props.children
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={href}
                                    className="btn-glow flex items-center justify-center gap-2 px-3 py-2 rounded-md border-2 border-outline bg-primary hover:bg-outline text-text font-body"
                                >
                                    <SiItchdotio size={32} className="text-text" />
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
                                <div className={"my-6 aspect-video w-full overflow-hidden rounded-xl border-2 border-outline shadow-lg"}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${id}`}
                                        title={title}
                                        allowFullScreen
                                        className={"w-full h-full"}
                                    />
                                </div>
                            )
                        },
                        threegame: (props: any) => {
                            const id = props["data-id"];
                            if (!id) return null;
                            return <ThreeGame id={id} />;
                        },
                    } as Components
                }
            >
                {content.trimEnd() + "\n"}
            </ReactMarkdown>
        </article>
    )
}