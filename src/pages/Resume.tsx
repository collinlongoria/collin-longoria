export default function Resume() {
    return (
        <div className="space-y-4">
            <h1 className="rounded-2xl border-2 border-outline p-2 bg-primary font-header text-text flex justify-center text-3xl">Resume</h1>
            <div className="rounded-xl overflow-hidden border-2 border-outline">
                <iframe
                    src="/resume.pdf"
                    className="w-full h-[80vh]"
                    title="Resume PDF"
                />
            </div>
        </div>
    )
}