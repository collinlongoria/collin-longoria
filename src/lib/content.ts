import fm from 'front-matter'

export type FrontMatter = {
    title: string
    date?: string
    summary?: string
    tags?: string[]
    coverImage?: string
    private?: boolean  // New: marks post as private/draft
    // Portfolio-only (ignored by blog):
    category?: string
    group?: string
    links?: { label: string; href: string }[]
}

export type LoadedDoc = FrontMatter & {
    slug: string
    content: string
    readingTime: number  // New: estimated minutes to read
}

export type PortfolioDoc = LoadedDoc & {
    // category undefined => belongs to root portfolio page
    category?: string
    group?: string
}

export type BlogDoc = LoadedDoc & {
    date?: string
    private?: boolean
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

function calculateReadingTime(content: string): number {
    const codeBlockRegex = /```[\s\S]*?```/g
    const codeBlocks = content.match(codeBlockRegex) || []
    const contentWithoutCode = content.replace(codeBlockRegex, '')

    // Remove HTML tags and custom components
    const plainText = contentWithoutCode
        .replace(/<[^>]+>/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to just text
        .replace(/[#*_~`]/g, '') // Remove markdown formatting

    // Count words in regular text (average 230 wpm)
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length
    const textMinutes = words / 230

    // Count words in code (slower reading, ~100 wpm for code)
    const codeWords = codeBlocks.join(' ').split(/\s+/).filter(w => w.length > 0).length
    const codeMinutes = codeWords / 100

    // Count images (add ~10 seconds per image)
    const imageCount = (content.match(/!\[/g) || []).length +
        (content.match(/<img/gi) || []).length +
        (content.match(/<imagescroller/gi) || []).length
    const imageMinutes = imageCount * (10 / 60)

    // Add time for embedded content
    const youtubeCount = (content.match(/<youtube/gi) || []).length
    const youtubeMinutes = youtubeCount * 0.5 // Assume 30 seconds to notice/consider embedded video

    const totalMinutes = textMinutes + codeMinutes + imageMinutes + youtubeMinutes

    // Round up, minimum 1 minute
    return Math.max(1, Math.ceil(totalMinutes))
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
        const readingTime = calculateReadingTime(body)

        out.push({
            ...attributes,
            category,
            group,
            slug,
            content: body,
            readingTime,
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

export function loadBlogIndex(includePrivate: boolean = false): BlogDoc[] {
    const out: BlogDoc[] = []

    for (const [path, raw] of Object.entries(blogFiles)) {
        const { attributes, body } = fm<FrontMatter>(raw)
        const slug = fileSlug(path)
        const readingTime = calculateReadingTime(body)

        out.push({
            ...attributes,
            slug,
            content: body,
            readingTime,
            private: attributes.private ?? false,
        })
    }

    // Filter out private posts unless explicitly included
    const filtered = includePrivate ? out : out.filter(p => !p.private)

    // Newest first
    filtered.sort((a, b) => {
        const ad = coerceDate(a.date)?.getTime()
        const bd = coerceDate(b.date)?.getTime()
        if (ad && bd) return bd - ad
        if (ad && !bd) return -1
        if (!ad && bd) return 1
        return (a.title || '').localeCompare(b.title || '')
    })

    return filtered
}

export function loadBlogPost(slug: string, includePrivate: boolean = false): BlogDoc | undefined {
    return loadBlogIndex(includePrivate).find(p => p.slug === slug)
}