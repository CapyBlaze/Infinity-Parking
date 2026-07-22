import { useLayoutEffect, useRef } from "react";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface CameraProps {
    width: number;
    height: number;
    tileSize?: number;
}

export function Camera({ width, height, tileSize = 2 }: CameraProps) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    const centerX = ((width - 1) * tileSize) / 2;
    const centerZ = ((height - 1) * tileSize) / 2;

    useLayoutEffect(() => {
        if (!cameraRef.current) return;

        cameraRef.current.lookAt(centerX, 0, centerZ);
    }, [centerX, centerZ]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={35} />

            <OrbitControls
                target={[0, 0, 0]}
                enableZoom={true}
                enableRotate={false}
                enablePan={false}
            />
        </>
    );
}
