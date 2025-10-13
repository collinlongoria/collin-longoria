import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="text-center py-24">
            <h1 className="font-garamond text-5xl mb-4">404</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
            <Link className="inline-block mt-6 underline" to={"/"}>Go Home</Link>
        </div>
    )
}