import { Link } from 'react-router-dom'

export default function Header() {
    return (
        <header className={"w-full"}>
            <div className={"w-full h-12 bg-gray-100 flex items-center"}>
                <div className={"mx-auto w-full max-w-screen-xl px-4 flex items-center justify-between"}>
                    <Link to={"/"} className={"flex items-center gap-3"}>
                        {/* Put logo image here */}
                        <div className={"w-8 h-8 rounded-full bg-primary aria-hidden"} aria-hidden />
                        <span className={"font-garamond text-xl tracking-wide"}>Collin Longoria</span>
                    </Link>
                    <div className={"text-xs text-gray-500"}>Portfolio &nbsp;•&nbsp; Engine &nbsp;•&nbsp; Graphics </div>
                </div>
            </div>
        </header>
    )
}