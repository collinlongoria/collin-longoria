import { Link } from "react-router-dom";

export default function Header() {
    return (
        <header className="w-full bg-primary bg-top">
            <Link to="/" aria-label="Go to homepage" className="block w-full">
                <picture>
                    <source media="(max-width: 640px)" srcSet="/banner-mobile.png" />
                    <img
                        src="/banner-desktop.png"
                        alt="Collin Longoria — banner"
                        className="block mx-auto w-full h-auto max-w-[320px] sm:max-w-[720px] select-none"
                        draggable={false}
                        loading="eager"
                        decoding="async"
                    />
                </picture>
            </Link>
        </header>
    );
}