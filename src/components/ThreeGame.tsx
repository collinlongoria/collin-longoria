import { useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import games from "../data/gameRegistry";

type SceneFn = (opts: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGPURenderer;
}) => () => void;

export default function ThreeGame({ id }: { id: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [sceneFn, setSceneFn] = useState<SceneFn | null>(null);

    // Load scene file lazily
    useEffect(() => {
        let active = true;

        async function load() {
            const loader = games[id];
            if (!loader) throw new Error(`Unknown scene: ${id}`);
            const mod = await loader();
            if (active) setSceneFn(() => mod.default);
        }

        load();
        return () => {
            active = false;
        };
    }, [id]);

    // Initialize WebGPU scene once sceneFn is available
    useEffect(() => {
        if (!sceneFn || !ref.current) return;

        let running = true;

        const width = ref.current.clientWidth || 600;
        const height = 400;

        let renderer: THREE.WebGPURenderer | null = null;

        (async () => {
            // Setup WebGPU renderer
            renderer = new THREE.WebGPURenderer({ antialias: true });
            await renderer.init();                // ✔ REQUIRED
            renderer.setSize(width, height);
            ref.current!.appendChild(renderer.domElement);

            // Create scene + camera
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);

            // Run scene initializer
            const update = sceneFn({ scene, camera, renderer });

            // Main animation loop
            function animate() {
                if (!running) return;

                update();
                renderer!.render(scene, camera);  // ✔ correct WebGPU render call
                requestAnimationFrame(animate);
            }
            animate();
        })();

        return () => {
            running = false;
            if (renderer) {
                renderer.dispose();
                ref.current?.removeChild(renderer.domElement);
            }
        };
    }, [sceneFn]);

    return (
        <div
            ref={ref}
            className="my-6 w-full flex justify-center"
            style={{ minHeight: "300px" }}
        >
            {!sceneFn && (
                <div className="text-text opacity-70">Loading WebGPU scene…</div>
            )}
        </div>
    );
}