export default function Resume() {
    return (
        <div className="space-y-4">
            <h1 className="font-garamond flex justify-center text-3xl">Resume</h1>
            <div className="rounded-xl overflow-hidden border border-primary-darker">
                <iframe
                    src="/resume.pdf"
                    className="w-full h-[80vh]"
                    title="Resume PDF"
                />
            </div>
        </div>
    )
}