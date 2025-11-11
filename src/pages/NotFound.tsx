import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="text-center py-24">
            <h1 className="font-header text-accent text-5xl mb-4">404</h1>
            <p className="font-body text-text">The page you're looking for doesn't exist.</p>
            <Link className="font-body inline-block mt-6 underline text-text" to={"/"}>Go Home</Link>
        </div>
    )
}