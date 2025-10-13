import ContactBlock from '../components/ContactBlock'

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
                            src="../../public/headshot.jpeg"
                            alt="Portrait of Collin Longoria"
                            className="w-24 md:w-40 aspect-square object-cover rounded-2xl border border-primary-darker bg-primary4 shadow-sm flex-none"
                        />

                        <div className={"flex-1"}>
                            <h1 className={"font-garamond text-2xl md:text-3xl text-primary-darker mb-2"}>
                                Hello, I'm Collin. Welcome to my website.
                            </h1>
                            <p className={"font-merriweather text-primary"}>
                                I’m an engine and graphics programmer focused on ECS architecture, Vulkan/OpenGL renderers,
                                and tooling for fast iteration. I like building the foundations that make game teams move faster.
                            </p>
                        </div>
                    </div>

                    <div className={"mt-10"}>
                        <h2 className={"font-garamond text-xl md:text-2xl text-primary-darker mb-2"}>About Me</h2>
                        <p className={"font-merriweather text-primary"}>Poop</p>
                    </div>

                    <div className={"mt-10"}>
                        <h2 className={" font-garamond text-xl md:text-2xl text-primary-darker mb-2"}>Interests</h2>
                        <p className={"font-merriweather text-primary"}>Poop 2</p>
                    </div>
                </div>
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