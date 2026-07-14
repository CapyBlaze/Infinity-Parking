import { memo, useMemo } from "react";
import type { ReactElement } from "react";

import { useGLTF } from "@react-three/drei";

import { CityMap } from "../utils/cityMap";

const TILE_SIZE = 2;

interface CityProps {
    width?: number;
    height?: number;
}

const isRoad = (map: string[][], x: number, z: number): boolean => {
    return map[x] !== undefined && map[x][z] === "X";
};

export const City = memo(function City({ width = 3, height = 3 }: CityProps) {
    const { scene: modelBase } = useGLTF("/models/base.gltf");
    const { scene: modelRoad } = useGLTF("/models/road_straight.gltf");
    const { scene: modelRoadCorner } = useGLTF("/models/road_corner.gltf");
    const { scene: modelRoadJunction } = useGLTF("/models/road_junction.gltf");
    const { scene: modelRoadTSplit } = useGLTF("/models/road_tsplit.gltf");
    const { scene: modelBuildingH } = useGLTF("/models/building_H.gltf");

    const terrain = useMemo(() => {
        const ROAD_CONFIGURATIONS: Record<number, { model: typeof modelRoad; rotation: number }> = {
            // --- 0 ou 1 connexion (Lignes droites / Impasses) ---
            0: { model: modelRoad, rotation: 0 },
            8: { model: modelRoad, rotation: 0 },
            2: { model: modelRoad, rotation: 0 },
            10: { model: modelRoad, rotation: 0 },

            4: { model: modelRoad, rotation: Math.PI / 2 },
            1: { model: modelRoad, rotation: Math.PI / 2 },
            5: { model: modelRoad, rotation: Math.PI / 2 },

            // --- 2 connexions adjacentes (Virages / Corners) ---
            12: { model: modelRoadCorner, rotation: Math.PI / 2 },
            6: { model: modelRoadCorner, rotation: 0 },
            3: { model: modelRoadCorner, rotation: -Math.PI / 2 },
            9: { model: modelRoadCorner, rotation: -Math.PI },

            // --- 3 connexions (Intersections en T / T-Split) ---
            7: { model: modelRoadTSplit, rotation: -Math.PI / 2 },
            14: { model: modelRoadTSplit, rotation: 0 },
            13: { model: modelRoadTSplit, rotation: Math.PI / 2 },
            11: { model: modelRoadTSplit, rotation: Math.PI },

            // --- 4 connexions (Croisement complet / Junction) ---
            15: { model: modelRoadJunction, rotation: 0 },
        };

        const cityMap = new CityMap(13, width, height, 4557555);
        const map = cityMap.generateCityMap();
        const list: ReactElement[] = [];

        for (let x = 0; x < map.length; x++) {
            for (let z = 0; z < map[x].length; z++) {
                switch (map[x][z]) {
                    case "X": {
                        const N = isRoad(map, x, z - 1) ? 8 : 0;
                        const E = isRoad(map, x + 1, z) ? 4 : 0;
                        const S = isRoad(map, x, z + 1) ? 2 : 0;
                        const W = isRoad(map, x - 1, z) ? 1 : 0;

                        const mask = N | E | S | W;

                        const config = ROAD_CONFIGURATIONS[mask] || {
                            model: modelRoad,
                            rotation: 0,
                        };

                        list.push(
                            <primitive
                                key={`${x},${z}`}
                                object={config.model.clone()}
                                position={[x * TILE_SIZE, 0, z * TILE_SIZE]}
                                rotation={[0, config.rotation, 0]}
                            />
                        );
                        break;
                    }

                    case "O":
                        list.push(
                            <primitive
                                key={`${x},${z}`}
                                object={modelBuildingH.clone()}
                                position={[x * TILE_SIZE, 0, z * TILE_SIZE]}
                                rotation={[0, 0, 0]}
                            />
                        );
                        break;

                    default:
                        list.push(
                            <primitive
                                key={`${x},${z}`}
                                object={modelBase.clone()}
                                position={[x * TILE_SIZE, 0, z * TILE_SIZE]}
                                rotation={[0, 0, 0]}
                            />
                        );
                        break;
                }
            }
        }

        return list;
    }, [
        width,
        height,
        modelBase,
        modelRoad,
        modelRoadCorner,
        modelRoadJunction,
        modelRoadTSplit,
        modelBuildingH,
    ]);

    return <group>{terrain}</group>;
});

useGLTF.preload("/models/base.gltf");
useGLTF.preload("/models/road_straight.gltf");
useGLTF.preload("/models/road_corner.gltf");
useGLTF.preload("/models/road_junction.gltf");
useGLTF.preload("/models/road_tsplit.gltf");
