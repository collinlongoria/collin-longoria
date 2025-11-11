import { NavLink } from 'react-router-dom'

// Tailwind constants
const base = "px-3 py-2 rounded-md text-md transition-colors"
const inactive = "text-text hover:text-text2"
const active = "text-text2 underline"

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `font-header ${base} ${isActive ? active : inactive}`
            }
        >
            {children}
        </NavLink>
    )
}

export default function NavBar() {
    return(
        <nav className="bg-primary p-2 flex justify-center space-x-6">
            <NavItem to='/'>Home</NavItem>
            <NavItem to="/portfolio">Portfolio</NavItem>
            <NavItem to="/resume">Resume</NavItem>
            <NavItem to="/blog">Blog</NavItem>
            <NavItem to='/contact'>Contact</NavItem>
        </nav>
    )
}