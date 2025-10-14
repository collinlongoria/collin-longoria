import { SiGithub, SiLinkedin } from 'react-icons/si';
import { FiMail } from "react-icons/fi";

export default function ContactBlock() {
    return (
        <section className="rounded-2xl border border-primary-darker p-8 bg-primary2 shadow-sm">
            <h2 className="flex justify-center font-garamond text-primary-darker text-2xl mb-2">Get in touch</h2>
            <p className="flex font-merriweather justify-center text-primary mb-4">
                For collaborations, internships, or engine/graphics roles — I’m open to chat.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3">
                <a href="mailto:collin.longoria25@gmail.com" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary/10 hover:bg-primary/20 text-primary">
                    <FiMail className="w-4 h-4" /> Email me
                </a>
                <a href="https://www.linkedin.com/in/collin-longoria/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary/10 hover:bg-primary/20 text-primary">
                    <SiLinkedin className="w-4 h-4" /> LinkedIn
                </a>
                <a href="https://github.com/collinlongoria" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary/10 hover:bg-primary/20 text-primary">
                    <SiGithub className="w-4 h-4" /> GitHub
                </a>
            </div>
        </section>
    )
}