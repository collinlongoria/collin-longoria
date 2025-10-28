import ContactBlock from '../components/ContactBlock'
import {SiItchdotio} from "react-icons/si";

const recommendations = [
    {
        name: 'Julia Moraes',
        role: 'Software Developer, Student',
        quote: '[Collin] consistently over-delivered. His dedication to his work is truly commendable; He approaches every task with an unparalleled passion and commitment to excellence.',
    },
    {
        name: 'Sakura Shih',
        role: 'Software Developer, Student',
        quote: 'Collin was the tech lead for our team, and put 110% of his effort into the project. He was a fast worker... his code was effective, concise, and clear, and he was the glue of the team.',
    },
]

export default function Home() {
    return (
        <div className={"space-y-10"}>
            <section className={"grid gap-6"}>
                <div className={"rounded-2xl border border-primary-darker p-6 md:p-8 bg-primary4 shadow-sm"}>
                    <div className={"flex items-start gap-5 md:gap-8"}>
                        <img
                            src="/headshot.jpeg"
                            alt="Portrait of Collin Longoria"
                            className="w-24 md:w-40 aspect-square object-cover rounded-2xl border border-primary-darker bg-primary4 shadow-sm flex-none"
                            loading={'eager'}
                        />
                        <div className={"flex-1"}>
                            <h1 className={"font-garamond text-4xl md:text-3xl text-primary-darker mb-2"}>
                                Hello, I'm Collin. Welcome to my website.
                            </h1>
                            <p className={"font-merriweather text-primary"}>
                                Here you can find information about me, my work as a programmer, and ways
                                to reach out to me. I also have a blog where I post cool findings from my time
                                in the programming and game dev world.
                            </p>
                        </div>
                    </div>
                    <div className={"mt-6"}>
                        <h2 className={"font-garamond text-xl md:text-2xl text-primary-darker mb-2"}>About Me</h2>
                        <p className={"font-merriweather text-sm text-primary"}>
                            &emsp;I'm a BSCS student at DigiPen Institute of Technology specializing in real-time simulation
                            and graphics programming. My work centers on engine and graphics systems, building efficient rendering and
                            compute pipeline using C++, Vulkan, OpenGL, and WebGPU.
                            <br /><br />
                            &emsp;I've developed and shipped multiple solo game-jam projects (1.3 k+ page views, 300+ downloads)
                            and contributed to four multidisciplinary DigiPen productions, including a research project on high-performance
                            mesh voxelization and real-time path tracing. Across my projects, I focus on gameplay and engine architecture,
                            tooling for iteration, and low-level graphics systems, from shader pipeline to CUDA compute.
                        </p>
                    </div>
                    <div className={"mt-6"}>
                        <h2 className={" font-garamond text-xl md:text-2xl text-primary-darker mb-2"}>Interests</h2>
                        <p className={"font-merriweather text-sm text-primary"}>
                            &emsp;Outside of development, I'm super interested in history, and I play a lot of strategy games. Some of my
                            favorite video games are <i>Sid Meier's Civilization</i> and the <i>Europa Universalis</i> series. These games feature
                            complex systems that fascinate me and inspire my own design work.
                        </p>
                    </div>
                </div>
            </section>

            <section className={"flex justify-center"}>
                <a className={"inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary/10 hover:bg-primary/20 text-primary"} href={"https://collin-longoria.itch.io/"} target="_blank" rel="noreferrer" aria-label={"Itch.io"}>
                    <SiItchdotio size={48} className={"text-primary"} />
                    <p>Check out my games on itch.io</p>
                </a>
            </section>

            <section>
                <h2 className={"flex w-full justify-center text-center font-garamond text-2xl mb-4"}>Recommendations</h2>
                <ul className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((r) => (
                        <li key={r.name} className="rounded-2xl border border-primary-darker p-8 bg-primary3 shadow-sm">
                            <blockquote className="text-primary">“{r.quote}”</blockquote>
                            <div className="mt-3 text-sm text-primary">{r.name} — {r.role}</div>
                        </li>
                    ))}
                </ul>
            </section>

            <ContactBlock />
        </div>
    )
}