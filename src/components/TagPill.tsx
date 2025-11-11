import React from "react";

type Props = {
    tags?: string[];
    className?: string;
};

export default function TagPill({ tags, className = "" }: Props) {
    if(!tags || tags.length === 0) return null;

    return(
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {tags.map((t) => (
                <span
                    key={t}
                    className={"font-body inline-flex items-center rounded-full border border-outline bg-primary px-2.5 py-1 text-xs text-text2"}
                >
                    {t}
                </span>
            ))}
        </div>
    )
}