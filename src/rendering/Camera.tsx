import { type ComponentRef, useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useGameStore } from "../store/useGameStore";

interface CameraProps {
    width: number;
    height: number;
    tileSize?: number;
}

export function Camera({ width, height, tileSize = 2 }: CameraProps) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
    const cameraRotation = useGameStore((state) => state.cameraRotation);
    const resetLevel = useGameStore((state) => state.resetLevel);

    const { size } = useThree();
    const centerX = ((width - 1) * tileSize) / 2;
    const centerZ = ((height - 1) * tileSize) / 2;

    const isoPolarAngle = Math.atan(1 / Math.sqrt(2));
    const startRadians = (cameraRotation * Math.PI) / 180;

    useLayoutEffect(() => {
        if (!cameraRef.current) return;

        cameraRef.current.lookAt(centerX, 0, centerZ);
    }, [centerX, centerZ]);

    const cameraPosition = useMemo((): [number, number, number] => {
        const mapSize = Math.max(width, height);

        const fov = 50;
        const fovInRadians = (fov * Math.PI) / 180;
        let distance = mapSize / (2 * Math.tan(fovInRadians / 2));

        const aspect = size.width / size.height;
        if (aspect < 1) {
            distance = distance / aspect;
        }

        const safeDistance = distance * 3;
        const isoCoordinate = safeDistance / Math.sqrt(3);

        return [isoCoordinate, isoCoordinate, isoCoordinate];
    }, [width, height, size.width, size.height]);

    useEffect(() => {
        if (controlsRef.current) {
            const radians = (cameraRotation * Math.PI) / 180;

            controlsRef.current.minAzimuthAngle = radians;
            controlsRef.current.maxAzimuthAngle = radians;

            controlsRef.current.update();
        }
    }, [cameraRotation, resetLevel]);

    return (
        <>
            <PerspectiveCamera
                makeDefault
                position={cameraPosition}
                fov={50}
                near={0.1}
                far={1000}
            />

            <OrbitControls
                ref={controlsRef}
                target={[0, 0, 0]}
                enableZoom={false}
                enablePan={false}
                enableRotate={false}
                minPolarAngle={isoPolarAngle}
                maxPolarAngle={isoPolarAngle}
                minAzimuthAngle={startRadians}
                maxAzimuthAngle={startRadians}
            />
        </>
    );
}
