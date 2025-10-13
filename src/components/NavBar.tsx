import { NavLink } from 'react-router-dom'

// Tailwind constants
const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors"
const inactive = "text-gray-700 hover:text-primary"
const active = "text-primary underline"

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `font-garamond ${base} ${isActive ? active : inactive}`
            }
        >
            {children}
        </NavLink>
    )
}

export default function NavBar() {
    return(
        <nav className="bg-gray-100 p-4 flex justify-center space-x-6">
            <NavItem to='/'>Home</NavItem>
            <NavItem to="/portfolio">Portfolio</NavItem>
            <NavItem to="/resume">Resume</NavItem>
            <NavItem to="/blog">Blog</NavItem>
            <NavItem to='/contact'>Contact</NavItem>
        </nav>
    )
}