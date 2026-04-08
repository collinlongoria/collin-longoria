import ContactBlock from '../components/ContactBlock'
import {SiItchdotio} from "react-icons/si";
import { IoGameController } from "react-icons/io5";

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
            <style>{`
                @keyframes portfolio-shine {
                    0% { transform: translateX(-150%) skewX(-20deg); }
                    100% { transform: translateX(250%) skewX(-20deg); }
                }
                @keyframes portfolio-pulse {
                    0%, 100% {
                        box-shadow:
                            0 0 20px color-mix(in oklch, var(--color-accent) 50%, transparent),
                            0 0 40px color-mix(in oklch, var(--color-accent) 25%, transparent);
                    }
                    50% {
                        box-shadow:
                            0 0 32px color-mix(in oklch, var(--color-accent) 80%, transparent),
                            0 0 64px color-mix(in oklch, var(--color-accent) 45%, transparent);
                    }
                }
                .portfolio-cta {
                    position: relative;
                    overflow: hidden;
                    animation: portfolio-pulse 2.5s ease-in-out infinite;
                }
                .portfolio-cta::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 60%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        color-mix(in oklch, var(--color-accent) 20%, transparent) 20%,
                        color-mix(in oklch, var(--color-accent) 75%, white) 50%,
                        color-mix(in oklch, var(--color-accent) 20%, transparent) 80%,
                        transparent 100%
                    );
                    mix-blend-mode: screen;
                    animation: portfolio-shine 2.8s ease-in-out infinite;
                    pointer-events: none;
                }
                .portfolio-cta:hover {
                    transform: scale(1.03);
                    transition: transform 0.2s ease;
                }
            `}</style>

            <section className={"flex justify-center"}>
                <a
                    href={"/portfolio"}
                    className={"portfolio-cta inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 border-outline bg-primary text-text font-header text-xl md:text-2xl shadow-lg"}
                    aria-label={"View my portfolio"}
                >
                    <span className={"relative z-10"}>Click HERE To View My Portfolio</span>
                </a>
            </section>

            <section className={"grid gap-6"}>
                <div className={"rounded-2xl border-2 border-outline p-6 md:p-8 bg-primary shadow-sm"}>
                    <div className={"flex items-start gap-5 md:gap-8"}>
                        <img
                            src="/headshot.jpeg"
                            alt="Portrait of Collin Longoria"
                            className="w-24 md:w-40 aspect-square object-cover rounded-2xl border-2 border-outline bg-primary shadow-md flex-none"
                            loading={'eager'}
                        />
                        <div className={"flex-1"}>
                            <h1 className={"font-header text-4xl md:text-3xl text-text mb-2"}>
                                Hello, I'm Collin. Welcome to my website.
                            </h1>
                            <p className={"font-body text-text"}>
                                Here you can find information about me, my work as a programmer, and ways
                                to reach out to me. I also have a blog where I post cool findings from my time
                                in the programming and game dev world.
                            </p>
                        </div>
                    </div>
                    <div className={"mt-6"}>
                        <h2 className={"font-header text-xl md:text-2xl text-text mb-2"}>About Me</h2>
                        <p className={"font-body text-sm text-text"}>
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
                        <h2 className={" font-header text-xl md:text-2xl text-text mb-2"}>Interests</h2>
                        <p className={"font-body text-sm text-text"}>
                            &emsp;Outside of development, I'm super interested in history, and I play a lot of strategy games. Some of my
                            favorite video games are <i>Sid Meier's Civilization</i> and the <i>Europa Universalis</i> series. These games feature
                            complex systems that fascinate me and inspire my own design work.
                        </p>
                    </div>
                </div>
            </section>

            <section className={"flex justify-center gap-6 flex-wrap"}>
                <a className={"btn-glow inline-flex font-body items-center gap-2 px-3 py-2 rounded-md border-2 border-outline bg-primary hover:bg-outline text-text"} href={"https://collin-longoria.itch.io/"} target="_blank" rel="noreferrer" aria-label={"Itch.io"}>
                    <SiItchdotio size={48} className={"text-text"} />
                    <p>Check out my games on itch.io</p>
                </a>
                <a className={"btn-glow inline-flex font-body items-center gap-2 px-3 py-2 rounded-md border-2 border-outline bg-primary hover:bg-outline text-text"} href={"https://games.digipen.edu/games/elementokens"} target="_blank" rel="noreferrer" aria-label={"Itch.io"}>
                    <IoGameController size={48} className={"text-text"} />
                    <p>Elementokens out now!</p>
                </a>
            </section>

            <section>
                <h2 className={"flex w-full justify-center text-center font-garamond text-2xl mb-4 text-text"}>Recommendations</h2>
                <ul className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((r) => (
                        <li key={r.name} className="rounded-2xl border-2 border-outline p-8 bg-primary shadow-sm">
                            <blockquote className="text-text">“{r.quote}”</blockquote>
                            <div className="mt-3 text-sm text-text">{r.name} — {r.role}</div>
                        </li>
                    ))}
                </ul>
            </section>

            <ContactBlock />
        </div>
    )
}