import fm from 'front-matter'

export type FrontMatter = {
    title: string
    date?: string
    summary?: string
    tags?: string[]
    coverImage?: string
    category?: string
    group?: string
    links?: { label: string; href: string }[]
}

export type LoadedDoc = FrontMatter & {
    slug: string
    content: string
    category: string
}

// Blog
const blogFiles = import.meta.glob('/src/content/blog/**/*.md', {
    eager: true,
    as: 'raw', // TODO: The glob option "as" has been deprecated in favour of "query". Please update `as: 'raw'` to `query: '?raw', import: 'default'`.
}) as Record<string, string>

export function loadBlogIndex(): LoadedDoc[] {
    const out: LoadedDoc[] = []
    for (const [path, raw] of Object.entries(blogFiles)) {
        const { attributes, body } = fm<FrontMatter>(raw)
        const slug = path.split('/').pop()!.replace(/\.md$/, '')
        out.push({
            ...(attributes || {}),
            slug,
            content: body,
            category: 'blog',
        })
    }
    return out.sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0))
}

export function loadBlogPost(slug: string): LoadedDoc | undefined {
    return loadBlogIndex().find(p => p.slug === slug)
}

// Portfolio
const portfolioFiles = import.meta.glob('/src/content/portfolio/**/*.md', {
    eager: true,
    as: 'raw', // TODO: The glob option "as" has been deprecated in favour of "query". Please update `as: 'raw'` to `query: '?raw', import: 'default'`.
}) as Record<string, string>

export function loadPortfolio(): LoadedDoc[] {
    const out: LoadedDoc[] = []
    for (const [path, raw] of Object.entries(portfolioFiles)) {
        const { attributes, body } = fm<FrontMatter>(raw)
        const slug = path.split('/').pop()!.replace(/\.md$/, '')
        const parts = path.split('/')
        const catFromFolder = parts[parts.indexOf('portfolio') + 1]
        const category = attributes?.category ?? catFromFolder ?? 'misc'
        out.push({
            ...(attributes || {}),
            slug,
            content: body,
            category,
        })
    }
    return out
}

export function loadPortfolioByCategory(category: string): LoadedDoc[] {
    return loadPortfolio().filter(i => i.category === category)
}

export function loadPortfolioItem(category: string, slug: string): LoadedDoc | undefined {
    return loadPortfolioByCategory(category).find(i => i.slug === slug)
}