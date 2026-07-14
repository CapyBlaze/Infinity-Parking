import { Environment } from "@react-three/drei";

export function Light() {
    return (
        <>
            <color attach="background" args={["#14131a"]} />

            <directionalLight
                castShadow
                intensity={4.5}
                color="#ff5500"
                position={[25, 35, 15]}
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0002}
            />
            <hemisphereLight groundColor="#4400aa" intensity={1.8} />
            <ambientLight intensity={0.5} color="#ffffff" />

            <Environment preset="studio" environmentIntensity={0.2} />
        </>
    );
}
