export default function Contact(){
    return(
        <div className={"max-w"}>
            <h1 className={"flex justify-center rounded-2xl border-2 border-outline bg-primary p-2 font-header text-text text-3xl mb-4"}>Contact Me</h1>
            <form
                method="POST"
                action={"https://formspree.io/f/mpwyoyzg"}
                className={"space-y-4 rounded-2xl border-2 border-outline p-8 bg-primary shadow-md"}
            >
                <div>
                    <label className="block text-sm font-header text-text">Name</label>
                    <input name="name" required className="mt-1 w-full rounded-md border-2 border-outline px-3 py-2 outline-none text-text font-body text-sm focus:ring-2 bg-primary focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-header text-text">Email</label>
                    <input name="email" type="email" required className="mt-1 w-full rounded-md border-2 border-outline px-3 py-2 outline-none text-text font-body text-sm focus:ring-2 bg-primary focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-header text-text">Message</label>
                    <textarea name="message" rows={5} required className="mt-1 w-full rounded-md border-2 border-outline px-3 py-2 outline-none focus:ring-2 text-text font-body text-sm bg-primary focus:ring-primary" />
                </div>
                <button className="btn-glow inline-flex items-center gap-2 px-4 py-2 rounded-md font-body border-2 border-outline bg-primary hover:bg-outline text-text">
                    Send
                </button>
                <p className="text-xs text-text font-body">Or email me at <a className="underline" href="mailto:collin.longoria25@gmail.com">collin.longoria25@gmail.com</a>.</p>
            </form>
        </div>
    )
}