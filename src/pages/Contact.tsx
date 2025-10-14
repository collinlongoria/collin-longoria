export default function Contact(){
    return(
        <div className={"max-w"}>
            <h1 className={"flex justify-center rounded-2xl border bg-primary4 p-2 font-garamond text-primary-darker text-3xl mb-4"}>Contact Me</h1>
            <form
                method="POST"
                action={"https://formspree.io/f/mpwyoyzg"}
                className={"space-y-4 rounded-2xl border border-primary-darker p-8 bg-primary3 shadow-sm"}
            >
                <div>
                    <label className="block text-sm font-merriweather text-primary">Name</label>
                    <input name="name" required className="mt-1 w-full rounded-md border border-primary-darker px-3 py-2 outline-none focus:ring-2 bg-white focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-merriweather text-primary">Email</label>
                    <input name="email" type="email" required className="mt-1 w-full rounded-md border border-primary-darker px-3 py-2 outline-none focus:ring-2 bg-white focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-merriweather text-primary">Message</label>
                    <textarea name="message" rows={5} required className="mt-1 w-full rounded-md border border-primary-darker px-3 py-2 outline-none focus:ring-2 bg-white focus:ring-primary" />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/90 hover:bg-primary text-white">
                    Send
                </button>
                <p className="text-xs text-primary-darker">Or email me at <a className="underline" href="mailto:collin.longoria25@gmail.com">collin.longoria25@gmail.com</a>.</p>
            </form>
        </div>
    )
}