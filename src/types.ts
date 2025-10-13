export type Link = { label: string; href: string };
export type PortfolioItem = {
    slug: string
    title: string
    dat?: string
    summary?: string
    coverImage?: string
    tags?: string[]
    links?: Link[]
    content: string
}

export type PortfolioGroup = {
    title: string
    items: PortfolioItem[]
}

export type PortfolioCategory = {
    key: string
    title: string
    description?: string
    groups?: PortfolioGroup[]
    items?: PortfolioItem[]
}

export type BlogPost = {
    slug: string
    title: string
    date: string
    summary?: string
    coverImage?: string
    tags?: string[]
    content: string
}