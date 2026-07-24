import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { useGLTF } from "@react-three/drei";
import { Group, type Object3DEventMap } from "three";

import { useGameStore } from "../store/useGameStore";
import { type Car, ParkingGenerator } from "../utils/parkingGenerator";
import DraggableCar from "./DraggableCar";
import Model from "./Model";

const TILE_SIZE = 2;
const CELL_SIZE = TILE_SIZE / 4;

interface ParkingProps {
    width?: number;
    height?: number;
    seed?: number;
    difficulty?: number;
    onCarExit?: (carId: string) => void;
    onLevelComplete?: () => void;
}

export const Parking = memo(function Parking({
    width = 3,
    height = 3,
    seed = 12345,
    difficulty = 1,
    onCarExit,
    onLevelComplete,
}: ParkingProps) {
    const { scene: modelObstacle } = useGLTF("/models/firehydrant.gltf");

    const { scene: modelCarA } = useGLTF("/models/car_hatchback.gltf");
    const { scene: modelCarB } = useGLTF("/models/car_police.gltf");
    const { scene: modelCarC } = useGLTF("/models/car_sedan.gltf");
    const { scene: modelCarD } = useGLTF("/models/car_stationwagon.gltf");
    const { scene: modelCarE } = useGLTF("/models/car_taxi.gltf");

    const cols = width * 4;
    const rows = height * 4;
    const centerOffsetCols = (cols - 1) / 2;
    const centerOffsetRows = (rows - 1) / 2;

    const resetLevelTrigger = useGameStore((state) => state.resetLevel);
    const setCarsLeft = useGameStore((state) => state.setCarsLeft);

    const [levelData] = useState(() => {
        const parkingGen = new ParkingGenerator(width, height, seed, difficulty);
        return parkingGen.generateParking();
    });

    const [cars, setCars] = useState<Car[]>(levelData.cars);

    setCarsLeft(levelData.cars.length);

    useEffect(() => {
        if (resetLevelTrigger > 0) {
            setCars([]);
            setCars(levelData.cars);
        }
    }, [resetLevelTrigger, levelData.cars]);

    useEffect(() => {
        setCarsLeft(cars.length);
    }, [cars.length, setCarsLeft]);

    const handleCarMove = useCallback((carId: string, newX: number, newY: number) => {
        setCars((prevCars) =>
            prevCars.map((c) => (c.id === carId ? { ...c, x: newX, y: newY } : c))
        );
    }, []);

    const handleCarExit = useCallback(
        (carId: string) => {
            setCars((prevCars) => {
                const remaining = prevCars.filter((c) => c.id !== carId);
                if (remaining.length === 0) {
                    queueMicrotask(() => onLevelComplete?.());
                }
                return remaining;
            });
            onCarExit?.(carId);
        },
        [onCarExit, onLevelComplete]
    );

    const CAR_MODELS: Record<number, Group<Object3DEventMap>> = useMemo(
        () => ({
            1: modelCarA,
            2: modelCarB || modelCarA,
            3: modelCarC || modelCarA,
            4: modelCarD || modelCarA,
            5: modelCarE || modelCarA,
        }),
        [modelCarA, modelCarB, modelCarC, modelCarD, modelCarE]
    );

    return (
        <group>
            {levelData.obstacles.map((obs) => {
                const posX = (obs.x - centerOffsetCols) * CELL_SIZE;
                const posZ = (obs.y - centerOffsetRows) * CELL_SIZE;
                return (
                    <Model
                        key={`obstacle-${obs.x}-${obs.y}`}
                        model={modelObstacle}
                        x={posX}
                        z={posZ}
                        y={0.1}
                        rotationY={0}
                    />
                );
            })}

            {cars.map((car) => {
                const carModel = CAR_MODELS[car.style] || modelCarA;

                let rotationY = 0;
                if (car.dir === "N") rotationY = Math.PI;
                if (car.dir === "E") rotationY = Math.PI / 2;
                if (car.dir === "W") rotationY = -Math.PI / 2;

                return (
                    <DraggableCar
                        key={`car-${car.id}`}
                        car={car}
                        carModel={carModel}
                        rotationY={rotationY}
                        cols={cols}
                        rows={rows}
                        centerOffsetCols={centerOffsetCols}
                        centerOffsetRows={centerOffsetRows}
                        obstacles={levelData.obstacles}
                        allCars={cars}
                        onMove={handleCarMove}
                        onExit={handleCarExit}
                    />
                );
            })}
        </group>
    );
});

useGLTF.preload("/models/firehydrant.gltf");
useGLTF.preload("/models/car_hatchback.gltf");
useGLTF.preload("/models/car_police.gltf");
useGLTF.preload("/models/car_sedan.gltf");
useGLTF.preload("/models/car_stationwagon.gltf");
