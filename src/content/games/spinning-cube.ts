import * as THREE from "three";

export default function spinningCubeScene({ scene, camera }: any) {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: "red" });
    const cube = new THREE.Mesh(geo, mat);

    scene.add(cube);

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 3);
    scene.add(light);

    camera.position.z = 4;

    return () => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    };
}