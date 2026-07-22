import { memo } from "react";

import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Group, type Object3DEventMap } from "three";

interface ModelProps {
    model: Group<Object3DEventMap>;
    x: number;
    z: number;
    y?: number;
    rotationY: number;
    onClick?: (event: ThreeEvent<MouseEvent>) => void;
    isClickable?: boolean;
}

export default memo(function Model({
    model,
    x,
    z,
    y = 0,
    rotationY,
    onClick,
    isClickable = false,
}: ModelProps) {
    if (!model) return null;

    model.traverse((child) => {
        if (
            (child as THREE.Mesh).isMesh &&
            (child as THREE.Mesh).material !== undefined &&
            "roughness" in (child as THREE.Mesh).material
        ) {
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;

            material.roughness = 1;
            material.metalness = 0;
        }
    });

    return (
        <primitive
            object={model.clone()}
            position={[x, y, z]}
            rotation={[0, rotationY, 0]}
            onClick={
                isClickable
                    ? onClick
                    : (event: ThreeEvent<MouseEvent>) => {
                          event.stopPropagation();
                      }
            }
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                document.body.style.cursor = isClickable ? "pointer" : "auto";
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                document.body.style.cursor = "auto";
            }}
        />
    );
});
