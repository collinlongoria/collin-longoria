import { SiGithub, SiLinkedin } from 'react-icons/si';
import { FiMail } from "react-icons/fi";

export default function Footer() {
    return (
        <footer className={"mt-16 border-t border-gray-200 bg-white"}>
            <div className={"mx-auto max-w-screen-xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"}>
                <p className={"text-sm text-gray-500"}>
                    © <span>{new Date().getFullYear()}</span> Collin Longoria - All rights reserved.
                </p>
                <div className={"flex items-center gap-4"}>
                    <a className={"p-2 rounded gover:bg-gray-100"} href={"https://github.com/collinlongoria"} target="_blank" rel="noreferrer" aria-label={"GitHub"}>
                        <SiGithub size={20} />
                    </a>
                    <a className={"p-2 rounded gover:bg-gray-100"} href={"https://www.linkedin.com/in/collin-longoria/"} target="_blank" rel="noreferrer" aria-label={"LinkedIn"}>
                        <SiLinkedin size={20} />
                    </a>
                    <a className={"p-2 rounded gover:bg-gray-100"} href={"mailto::collin.longoria25@gmail.com"} aria-label={"Email"}>
                        <FiMail size={20} />
                    </a>
                </div>
            </div>
        </footer>
    )
}