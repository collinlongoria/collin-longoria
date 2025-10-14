import { useParams } from 'react-router-dom'
import { loadPortfolioAtRoot, loadPortfolioByCategory } from '../lib/content'
import PortfolioCategory from './PortfolioCategory'
import PortfolioItem from './PortfolioItem'

export default function PortfolioSmart() {
    const { key } = useParams<{ key: string }>()
    if (!key) return null

    // If there are items under this category, render the category page
    const catItems = loadPortfolioByCategory(key)
    if (catItems.length > 0) {
        return <PortfolioCategory forcedKey={key} />
    }

    // Otherwise, treat it as a root-item slug
    return <PortfolioItem forcedSlug={key} />
}
