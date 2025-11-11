import { NavLink } from 'react-router-dom'
import {useState} from "react";

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
    const [open, setOpen] = useState(false);

    return (
        <nav className="bg-primary p-2 flex flex-col items-center">
            {/* Mobile option */}
            <button
                onClick={() => setOpen(!open)}
                className="sm:hidden text-text2 px-2 py-1 border border-outline rounded mb-2"
                aria-label="Toggle menu"
            >☰</button>

            <div
                className={`${
                    open ? "flex" : "hidden"
                } flex-col items-center space-y-2 sm:flex sm:flex-row sm:space-y-0 sm:space-x-6`}
            >
                <NavItem to="/">Home</NavItem>
                <NavItem to="/portfolio">Portfolio</NavItem>
                <NavItem to="/resume">Resume</NavItem>
                <NavItem to="/blog">Blog</NavItem>
                <NavItem to="/contact">Contact</NavItem>
            </div>
        </nav>
    );
}