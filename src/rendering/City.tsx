import { memo, useMemo } from "react";
import type { ReactElement } from "react";

import { useGLTF } from "@react-three/drei";
import { Group, type Object3DEventMap } from "three";

import { CityMap } from "../utils/cityMap";
import Model from "./Model";

const TILE_SIZE = 2;

interface CityProps {
    width?: number;
    height?: number;
    seed?: number;
}

function isRoad(map: string[][], x: number, z: number): boolean {
    return map[x] !== undefined && map[x][z] === "R";
}

function isParking(map: string[][], x: number, z: number): boolean {
    return map[x] !== undefined && map[x][z] === "P";
}

function cornerHasParking(map: string[][], x: number, z: number): boolean {
    return (
        isParking(map, x, z) ||
        isParking(map, x + 1, z) ||
        isParking(map, x, z + 1) ||
        isParking(map, x + 1, z + 1)
    );
}

function getBuildingRotation(
    map: string[][],
    x: number,
    z: number,
    offsetX: number,
    offsetZ: number
): number {
    const directions = [
        { dx: 0, dz: -1, rot: Math.PI }, // Nord
        { dx: 1, dz: 0, rot: Math.PI / 2 }, // Est
        { dx: 0, dz: 1, rot: 0 }, // Sud
        { dx: -1, dz: 0, rot: -Math.PI / 2 }, // Ouest
    ];

    let bestRot = 0;
    let minDistance = Infinity;

    for (const dir of directions) {
        const rx = x + dir.dx;
        const rz = z + dir.dz;

        if (isRoad(map, rx, rz)) {
            const worldX = rx + offsetX;
            const worldZ = rz + offsetZ;

            const dist = worldX * worldX + worldZ * worldZ;

            if (dist < minDistance) {
                minDistance = dist;
                bestRot = dir.rot;
            }
        }
    }

    return bestRot;
}

export const City = memo(function City({ width = 3, height = 3, seed = 0 }: CityProps) {
    const { scene: modelBase } = useGLTF("/models/base.gltf");
    const { scene: modelRoad } = useGLTF("/models/road_straight.gltf");
    const { scene: modelRoadCrossing } = useGLTF("/models/road_straight_crossing.gltf"); // Nouveau
    const { scene: modelRoadCorner } = useGLTF("/models/road_corner.gltf");
    const { scene: modelRoadJunction } = useGLTF("/models/road_junction.gltf");
    const { scene: modelRoadTSplit } = useGLTF("/models/road_tsplit.gltf");

    const { scene: modelTrafficLightA } = useGLTF("/models/trafficlight_A.gltf");
    const { scene: modelTrafficLightB } = useGLTF("/models/trafficlight_B.gltf");
    const { scene: modelTrafficLightC } = useGLTF("/models/trafficlight_C.gltf");
    const { scene: modelStreetLight } = useGLTF("/models/streetlight.gltf");

    const { scene: modelBuildingA } = useGLTF("/models/building_A.gltf");
    const { scene: modelBuildingB } = useGLTF("/models/building_B.gltf");
    const { scene: modelBuildingC } = useGLTF("/models/building_C.gltf");
    const { scene: modelBuildingD } = useGLTF("/models/building_D.gltf");
    const { scene: modelBuildingE } = useGLTF("/models/building_E.gltf");
    const { scene: modelBuildingF } = useGLTF("/models/building_F.gltf");
    const { scene: modelBuildingG } = useGLTF("/models/building_G.gltf");
    const { scene: modelBuildingH } = useGLTF("/models/building_H.gltf");

    const terrain = useMemo(() => {
        const ROAD_CONFIGURATIONS: Record<number, { model: typeof modelRoad; rotation: number }> = {
            0: { model: modelRoad, rotation: 0 },
            8: { model: modelRoad, rotation: 0 },
            2: { model: modelRoad, rotation: 0 },
            10: { model: modelRoad, rotation: 0 },

            4: { model: modelRoad, rotation: Math.PI / 2 },
            1: { model: modelRoad, rotation: Math.PI / 2 },
            5: { model: modelRoad, rotation: Math.PI / 2 },

            12: { model: modelRoadCorner, rotation: Math.PI / 2 },
            6: { model: modelRoadCorner, rotation: 0 },
            3: { model: modelRoadCorner, rotation: -Math.PI / 2 },
            9: { model: modelRoadCorner, rotation: -Math.PI },

            7: { model: modelRoadTSplit, rotation: -Math.PI / 2 },
            14: { model: modelRoadTSplit, rotation: 0 },
            13: { model: modelRoadTSplit, rotation: Math.PI / 2 },
            11: { model: modelRoadTSplit, rotation: Math.PI },

            15: { model: modelRoadJunction, rotation: 0 },
        };

        const BUILDING_MODELS: Record<string, Group<Object3DEventMap>> = {
            A: modelBuildingA,
            B: modelBuildingB,
            C: modelBuildingC,
            D: modelBuildingD,
            E: modelBuildingE,
            F: modelBuildingF,
            G: modelBuildingG,
            H: modelBuildingH,
        };

        const cityMap = new CityMap(5, width, height, seed);
        const map = cityMap.generateCityMap();
        const list: ReactElement[] = [];

        const offsetX = -(map.length - 1) / 2;
        const offsetZ = -(map[0].length - 1) / 2;

        const crossings = new Set<string>();
        const occupiedCorners = new Set<string>();

        for (let x = 0; x < map.length; x++) {
            for (let z = 0; z < map[x].length; z++) {
                switch (map[x][z]) {
                    case "R": {
                        const N = isRoad(map, x, z - 1) ? 8 : 0;
                        const E = isRoad(map, x + 1, z) ? 4 : 0;
                        const S = isRoad(map, x, z + 1) ? 2 : 0;
                        const W = isRoad(map, x - 1, z) ? 1 : 0;

                        const mask = N | E | S | W;
                        const config = ROAD_CONFIGURATIONS[mask] || {
                            model: modelRoad,
                            rotation: 0,
                        };
                        let finalModel = config.model;

                        if (mask === 5 || mask === 10) {
                            const pseudoRandom = Math.abs(
                                (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1
                            );

                            const hasNeighborCrossing =
                                crossings.has(`${x - 1},${z}`) ||
                                crossings.has(`${x + 1},${z}`) ||
                                crossings.has(`${x},${z - 1}`) ||
                                crossings.has(`${x},${z + 1}`);

                            if (pseudoRandom < 0.2 && !hasNeighborCrossing) {
                                finalModel = modelRoadCrossing;
                                crossings.add(`${x},${z}`);
                            }
                        }

                        list.push(
                            <Model
                                key={`map-${x}-${z}`}
                                model={finalModel}
                                x={(x + offsetX) * TILE_SIZE}
                                z={(z + offsetZ) * TILE_SIZE}
                                rotationY={config.rotation}
                            />
                        );
                        break;
                    }

                    case "A":
                    case "B":
                    case "C":
                    case "D":
                    case "E":
                    case "F":
                    case "G":
                    case "H": {
                        const model = BUILDING_MODELS[map[x][z]];
                        const buildingRotation = getBuildingRotation(map, x, z, offsetX, offsetZ);

                        list.push(
                            <Model
                                key={`map-${x}-${z}`}
                                model={model.clone()}
                                x={(x + offsetX) * TILE_SIZE}
                                z={(z + offsetZ) * TILE_SIZE}
                                rotationY={buildingRotation}
                            />
                        );
                        break;
                    }

                    default:
                        list.push(
                            <Model
                                key={`map-${x}-${z}`}
                                model={modelBase.clone()}
                                x={(x + offsetX) * TILE_SIZE}
                                z={(z + offsetZ) * TILE_SIZE}
                                rotationY={0}
                            />
                        );
                        break;
                }

                for (let x = 0; x < map.length; x++) {
                    for (let z = 0; z < map[x].length; z++) {
                        if (map[x][z] === "R") {
                            if (occupiedCorners.has(`${x},${z}`) || cornerHasParking(map, x, z)) {
                                continue;
                            }

                            const N = isRoad(map, x, z - 1) ? 8 : 0;
                            const E = isRoad(map, x + 1, z) ? 4 : 0;
                            const S = isRoad(map, x, z + 1) ? 2 : 0;
                            const W = isRoad(map, x - 1, z) ? 1 : 0;
                            const mask = N | E | S | W;

                            if (mask === 7 || mask === 11 || mask === 13 || mask === 14) {
                                if (!cornerHasParking(map, x, z)) {
                                    const trafficModel =
                                        (x + z) % 2 === 0 ? modelTrafficLightA : modelTrafficLightB;
                                    const ROTATIONS_3WAY: Record<number, number> = {
                                        7: 0,
                                        11: Math.PI / 2,
                                        13: Math.PI,
                                        14: -Math.PI / 2,
                                    };

                                    list.push(
                                        <Model
                                            key={`traffic-3way-${x}-${z}`}
                                            model={trafficModel.clone()}
                                            x={(x + offsetX + 0.5) * TILE_SIZE}
                                            z={(z + offsetZ + 0.5) * TILE_SIZE}
                                            y={0.1}
                                            rotationY={ROTATIONS_3WAY[mask]}
                                        />
                                    );
                                    occupiedCorners.add(`${x},${z}`);
                                }
                            }

                            if (mask === 15) {
                                if (!cornerHasParking(map, x, z)) {
                                    list.push(
                                        <Model
                                            key={`traffic-4way-br-${x}-${z}`}
                                            model={modelTrafficLightC.clone()}
                                            x={(x + offsetX + 0.5) * TILE_SIZE}
                                            z={(z + offsetZ + 0.5) * TILE_SIZE}
                                            rotationY={0}
                                        />
                                    );
                                    occupiedCorners.add(`${x},${z}`);
                                }

                                if (!cornerHasParking(map, x - 1, z - 1)) {
                                    list.push(
                                        <Model
                                            key={`traffic-4way-tl-${x}-${z}`}
                                            model={modelTrafficLightC.clone()}
                                            x={(x + offsetX - 0.5) * TILE_SIZE}
                                            z={(z + offsetZ - 0.5) * TILE_SIZE}
                                            y={0.1}
                                            rotationY={Math.PI}
                                        />
                                    );
                                    occupiedCorners.add(`${x - 1},${z - 1}`);
                                }
                            }
                        }
                    }
                }

                for (let x = 0; x < map.length - 1; x++) {
                    for (let z = 0; z < map[x].length - 1; z++) {
                        if (occupiedCorners.has(`${x},${z}`) || cornerHasParking(map, x, z)) {
                            continue;
                        }

                        const c_tl = isRoad(map, x, z) ? 1 : 0;
                        const c_tr = isRoad(map, x + 1, z) ? 1 : 0;
                        const c_bl = isRoad(map, x, z + 1) ? 1 : 0;
                        const c_br = isRoad(map, x + 1, z + 1) ? 1 : 0;

                        const totalRoads = c_tl + c_tr + c_bl + c_br;

                        if (totalRoads > 0) {
                            const dirX = c_tr + c_br - (c_tl + c_bl);
                            const dirZ = c_bl + c_br - (c_tl + c_tr);

                            const rawAngle = Math.atan2(dirX, dirZ);
                            const snappedAngle =
                                Math.round(rawAngle / (Math.PI / 2)) * (Math.PI / 2);

                            const STREETLIGHT_OFFSET = Math.PI / 2;
                            const streetRot = snappedAngle + STREETLIGHT_OFFSET;

                            list.push(
                                <Model
                                    key={`streetlight-${x}-${z}`}
                                    model={modelStreetLight.clone()}
                                    x={(x + offsetX + 0.5) * TILE_SIZE}
                                    z={(z + offsetZ + 0.5) * TILE_SIZE}
                                    y={0.1}
                                    rotationY={streetRot}
                                />
                            );

                            occupiedCorners.add(`${x},${z}`);
                        }
                    }
                }
            }
        }

        return list;
    }, [
        width,
        height,
        seed,
        modelBase,
        modelRoad,
        modelRoadCrossing,
        modelRoadCorner,
        modelRoadJunction,
        modelRoadTSplit,
        modelTrafficLightA,
        modelTrafficLightB,
        modelTrafficLightC,
        modelStreetLight,
        modelBuildingA,
        modelBuildingB,
        modelBuildingC,
        modelBuildingD,
        modelBuildingE,
        modelBuildingF,
        modelBuildingG,
        modelBuildingH,
    ]);

    return <group>{terrain}</group>;
});

useGLTF.preload("/models/base.gltf");
useGLTF.preload("/models/road_straight.gltf");
useGLTF.preload("/models/road_straight_crossing.gltf");
useGLTF.preload("/models/road_corner.gltf");
useGLTF.preload("/models/road_junction.gltf");
useGLTF.preload("/models/road_tsplit.gltf");
useGLTF.preload("/models/trafficlight_A.gltf");
useGLTF.preload("/models/trafficlight_B.gltf");
useGLTF.preload("/models/trafficlight_C.gltf");
useGLTF.preload("/models/streetlight.gltf");
