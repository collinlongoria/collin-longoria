import React, { useState } from 'react';

interface ImageScrollerProps {
    images: string[];
    altTexts?: string[];
}

export default function ImageScroller({ images, altTexts = [] }: ImageScrollerProps){
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <>
            <div className="overflow-x-auto whitespace-nowrap scroll-smooth scrollbar-thin scrollbar-thumb-primary/50 hover:scrollbar-thumb-primary">
                <div className="flex gap-4 px-4 py-2">
                    {images.map((src, i) => (
                        <img
                            key={i}
                            src={src}
                            alt={altTexts[i] || `image-${i}`}
                            onClick={() => setSelectedImage(src)}
                            className="h-48 flex-none rounded-xl object-cover border border-primary/30 cursor-pointer hover:scale-[1.02] transition-transform"
                        />
                    ))}
                </div>
            </div>

            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg border border-primary/30"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 text-white text-3xl font-bold"
                        onClick={() => setSelectedImage(null)}
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
}