import fm from 'front-matter'

export type FrontMatter = {
    title: string
    date?: string
    summary?: string
    tags?: string[]
    coverImage?: string
    // Portfolio-only (ignored by blog):
    category?: string
    group?: string
    links?: { label: string; href: string }[]
}

export type LoadedDoc = FrontMatter & {
    slug: string
    content: string
}

export type PortfolioDoc = LoadedDoc & {
    // category undefined => belongs to root portfolio page
    category?: string
    group?: string
}

export type BlogDoc = LoadedDoc & {
    date?: string
}

function normalizeStr(v: unknown): string | undefined {
    if (typeof v !== 'string') return undefined
    const t = v.trim()
    return t.length > 0 ? t : undefined
}

function fileSlug(path: string): string {
    return path.split('/').pop()!.replace(/\.md$/i, '')
}

function categoryFromPath(path: string): string | undefined {
    const parts = path.split('/')
    const idx = parts.indexOf('portfolio')

    if (idx >= 0 && idx + 2 <= parts.length - 1) {
        const maybeCategory = parts[idx + 1]

        const filename = parts[parts.length - 1]
        if (maybeCategory && maybeCategory !== filename) {
            return normalizeStr(maybeCategory)
        }
    }
    return undefined
}

function coerceDate(d?: string): Date | undefined {
    if (!d) return undefined
    const dt = new Date(d)
    return isNaN(+dt) ? undefined : dt
}

// Portfolio .md files anywhere under /src/content/portfolio
const portfolioFiles = import.meta.glob('/src/content/portfolio/**/*.md', {
    eager: true,
    as: 'raw',
}) as Record<string, string>

// Blog .md files anywhere under /src/content/blog
const blogFiles = import.meta.glob('/src/content/blog/**/*.md', {
    eager: true,
    as: 'raw',
}) as Record<string, string>

export function loadPortfolio(): PortfolioDoc[] {
    const out: PortfolioDoc[] = []

    for (const [path, raw] of Object.entries(portfolioFiles)) {
        const { attributes, body } = fm<FrontMatter>(raw)

        const slug = fileSlug(path)
        const catFromFolder = categoryFromPath(path)
        const fmCategory = normalizeStr(attributes?.category)
        const category = fmCategory ?? catFromFolder ?? undefined

        const group = normalizeStr(attributes?.group)

        out.push({
            ...attributes,
            category,
            group,
            slug,
            content: body,
        })
    }

    out.sort((a, b) => {
        const ad = coerceDate(a.date)?.getTime()
        const bd = coerceDate(b.date)?.getTime()
        if (ad && bd) return bd - ad
        if (ad && !bd) return -1
        if (!ad && bd) return 1
        return (a.title || '').localeCompare(b.title || '')
    })

    return out
}

export function loadPortfolioAtRoot(): PortfolioDoc[] {
    return loadPortfolio().filter(i => !i.category)
}

export function loadPortfolioByCategory(categoryKey: string): PortfolioDoc[] {
    const key = normalizeStr(categoryKey)
    return loadPortfolio().filter(i => i.category === key)
}

export function loadPortfolioItem(categoryKey: string | undefined, slug: string): PortfolioDoc | undefined {
    const all = categoryKey ? loadPortfolioByCategory(categoryKey) : loadPortfolioAtRoot()
    return all.find(i => i.slug === slug)
}

export function loadBlogIndex(): BlogDoc[] {
    const out: BlogDoc[] = []

    for (const [path, raw] of Object.entries(blogFiles)) {
        const { attributes, body } = fm<FrontMatter>(raw)
        const slug = fileSlug(path)

        out.push({
            ...attributes,
            slug,
            content: body,
        })
    }

    // Newest first
    out.sort((a, b) => {
        const ad = coerceDate(a.date)?.getTime()
        const bd = coerceDate(b.date)?.getTime()
        if (ad && bd) return bd - ad
        if (ad && !bd) return -1
        if (!ad && bd) return 1
        return (a.title || '').localeCompare(b.title || '')
    })

    return out
}

export function loadBlogPost(slug: string): BlogDoc | undefined {
    return loadBlogIndex().find(p => p.slug === slug)
}
