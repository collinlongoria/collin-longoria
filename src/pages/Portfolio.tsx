import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadPortfolio, loadPortfolioAtRoot } from '../lib/content'
import TagPill from '../components/TagPill'
import { CATEGORY_META } from "../data/categories";

type Item = ReturnType<typeof loadPortfolio>[number]

function byDateDesc(a: Item, b: Item) {
    const ad = a.date ? new Date(a.date).getTime() : undefined
    const bd = b.date ? new Date(b.date).getTime() : undefined
    if (ad && bd) return bd - ad
    if (ad && !bd) return -1
    if (!ad && bd) return 1
    return (a.title || '').localeCompare(b.title || '')
}

function Row({
                 title,
                 href,
                 items,
                 buildHref,
             }: {
    title: string
    href?: string
    items: Item[]
    buildHref: (it: Item) => string
}) {
    const scrollerRef = useRef<HTMLDivElement>(null)
    const [canScroll, setCanScroll] = useState(false)
    const [atStart, setAtStart] = useState(true)
    const [atEnd, setAtEnd] = useState(false)

    const mask = !canScroll ? 'none'
        : atStart ? 'linear-gradient(to right, black 0, black calc(100% - 24px), transparent 100%)'
            : atEnd   ? 'linear-gradient(to right, transparent 0, black 24px, black 100%)'
                : 'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)'

    const updateScrollState = () => {
        const el = scrollerRef.current
        if (!el) return
        const c = el.clientWidth
        const s = el.scrollWidth
        const left = el.scrollLeft
        const maxLeft = s - c - 1
        setCanScroll(s > c + 1)
        setAtStart(left <= 1)
        setAtEnd(left >= maxLeft)
    }

    useEffect(() => {
        updateScrollState()
        const onResize = () => updateScrollState()
        window.addEventListener('resize', onResize)
        const el = scrollerRef.current
        const onScroll = () => updateScrollState()
        el?.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            window.removeEventListener('resize', onResize)
            el?.removeEventListener('scroll', onScroll)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {

    }

    const scrollBy = (dx: number) => {
        const el = scrollerRef.current
        if (!el) return
        el.scrollBy({ left: dx, behavior: 'smooth' })
    }

    return (
        <section className="space-y-3">
            <div className="flex items-baseline justify-between pr-1">
                <h2 className="font-header text-text text-2xl">{title}</h2>
            </div>

            <div
                ref={scrollerRef}
                onWheel={onWheel}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-1 py-1
                    overscroll-x-contain overscroll-y-auto
                   [scrollbar-width:none] [-ms-overflow-style:none]"
                style={{ scrollBehavior: 'smooth', WebkitMaskImage: mask, maskImage: mask }}
            >
                <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

                {items.map((it) => (
                    <Link
                        key={it.slug + (it.category ?? '')}
                        to={buildHref(it)}
                        className="btn-jump snap-start shrink-0 w-80 rounded-2xl border-2 border-outline bg-primary shadow-md hover:shadow-xl transition overflow-hidden"
                    >
                        {it.coverImage && (
                            <div className="aspect-video w-full overflow-hidden bg-primary">
                                <img
                                    src={it.coverImage}
                                    alt={it.title}
                                    className="h-full w-full object-cover"
                                    loading="eager"
                                />
                            </div>
                        )}
                        <div className="p-5">
                            <h3 className="font-header font-bold text-xl text-text mb-1">{it.title}</h3>
                            <p className="font-header text-sm text-text italic">{it.group ? `${it.group}` : ""}</p>
                            {it.summary && <p className="font-body text-md text-text2 line-clamp-3">{it.summary}</p>}
                            {it.tags?.length ? <TagPill tags={it.tags} className="mt-2" /> : null}
                        </div>
                    </Link>
                ))}
            </div>

            {canScroll && (
                <div className="flex items-center justify-end gap-2 pt-1 font-body text-text">
                    <button
                        type="button"
                        aria-label="Scroll left"
                        onClick={() => scrollBy(-360)}
                        disabled={atStart}
                        className={`rounded-full border-2 px-3 py-1.5 text-sm shadow-sm transition
                        ${atStart ? 'opacity-40 cursor-default' : 'btn-glow hover:bg-outline bg-primary border-outline'}`}
                    >
                        ‹ Prev
                    </button>
                    <button
                        type="button"
                        aria-label="Scroll right"
                        onClick={() => scrollBy(360)}
                        disabled={atEnd}
                        className={`rounded-full border-2 px-3 py-1.5 text-sm shadow-sm transition
                        ${atEnd ? 'opacity-40 cursor-default' : 'btn-glow hover:bg-outline bg-primary border-outline'}`}
                    >
                        Next ›
                    </button>
                </div>
            )}
        </section>
    )
}

export default function Portfolio() {
    const all = useMemo(() => loadPortfolio().slice().sort(byDateDesc), [])
    const featured = useMemo(() => all.filter(i => i.featured), [all])
    const rootItems = useMemo(
        () => loadPortfolioAtRoot().slice().sort(byDateDesc).filter(i => !i.featured),
        []
    )

    const categories = Object.keys(CATEGORY_META).filter(cat =>
        all.some(i => i.category === cat && !i.featured)
    )

    const buildFeaturedHref = (it: Item) =>
        it.category ? `/portfolio/${it.category}/${it.slug}` : `/portfolio/${it.slug}`

    return (
        <div className="space-y-10">
            {/* Header */}
            <section className="space-y-4">
                <div className="rounded-2xl border-2 border-outline p-2 bg-primary overflow-hidden shadow-sm">
                    <h1 className="flex justify-center font-header text-3xl text-text">Portfolio</h1>
                    <p className="flex justify-center font-body text-sm text-text2">
                        All of my development projects, new and old.
                    </p>
                </div>
            </section>

            {/* Featured */}
            {featured.length > 0 && (
                <section className="space-y-4">
                    <h2 className="font-header text-text text-3xl">Featured Work</h2>
                    <p className="font-body text-sm text-text2">
                        The projects I'm most proud of.
                    </p>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pt-2 pb-4">
                        {featured.map(it => (
                            <Link
                                key={it.slug + (it.category ?? '')}
                                to={buildFeaturedHref(it)}
                                className="btn-jump rounded-2xl border-2 border-outline bg-primary overflow-hidden flex flex-col shadow-md hover:shadow-xl transition"
                                style={{
                                    boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.4), 0 0 12px rgba(220, 38, 38, 0.35)'
                                }}
                            >
                                {it.coverImage && (
                                    <div className="aspect-video w-full overflow-hidden bg-primary">
                                        <img
                                            src={it.coverImage}
                                            alt={it.title}
                                            className="h-full w-full object-cover"
                                            loading="eager"
                                        />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-header font-bold text-2xl text-text mb-1">{it.title}</h3>
                                    {it.group && (
                                        <p className="font-header text-sm text-text italic mb-2">{it.group}</p>
                                    )}
                                    {it.summary && (
                                        <p className="font-body text-md text-text2 mb-3">{it.summary}</p>
                                    )}
                                    {it.tags?.length ? <TagPill tags={it.tags} className="mt-auto" /> : null}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Divider into past projects */}
            <section className="pt-8">
                <div className="border-t-2 border-outline pt-8">
                    <h2 className="font-header text-text text-3xl text-center">Other Past Projects</h2>
                    <p className="font-body text-sm text-text2 text-center mt-1">
                        Everything else I've built along the way.
                    </p>
                </div>
            </section>

            {/* Latest (non-featured root items) */}
            {rootItems.length > 0 && (
                <Row title="Latest" items={rootItems} buildHref={(it) => `/portfolio/${it.slug}`} />
            )}

            {/* Categories (excluding featured items) */}
            {categories.map((cat) => {
                const items = all.filter((i) => i.category === cat && !i.featured)
                if (items.length === 0) return null
                const meta = CATEGORY_META[cat]
                return (
                    <section key={cat} className="space-y-2">
                        <h2 className="font-header text-text text-2xl">{meta.title}</h2>
                        {meta.description && (
                            <p className="font-body text-sm text-text2 mb-2">{meta.description}</p>
                        )}
                        <Row
                            title=""
                            items={items}
                            buildHref={(it) => `/portfolio/${cat}/${it.slug}`}
                        />
                    </section>
                )
            })}
        </div>
    )
}