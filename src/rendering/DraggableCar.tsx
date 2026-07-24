import { memo, useEffect, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { useGesture } from "@use-gesture/react";
import { Group, type Object3DEventMap } from "three";
import * as THREE from "three";

import { type Car, type Obstacle } from "../utils/parkingGenerator";
import Model from "./Model";

const TILE_SIZE = 2;
const CELL_SIZE = TILE_SIZE / 4;
const SAFETY_MARGIN = 64;

function getCarCells(car: { x: number; y: number; dir: Car["dir"] }) {
    let tx = car.x;
    let ty = car.y;
    if (car.dir === "N") ty++;
    else if (car.dir === "S") ty--;
    else if (car.dir === "E") tx--;
    else if (car.dir === "W") tx++;
    return [
        { x: car.x, y: car.y },
        { x: tx, y: ty },
    ];
}

function isCellFree(
    x: number,
    y: number,
    cols: number,
    rows: number,
    obstacles: Obstacle[],
    allCars: Car[],
    ignoreCarId: string
) {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return true;
    if (obstacles.some((o) => o.x === x && o.y === y)) return false;
    for (const c of allCars) {
        if (c.id === ignoreCarId) continue;
        const cells = getCarCells(c);
        if (cells.some((cell) => cell.x === x && cell.y === y)) return false;
    }
    return true;
}

function isFullyOutOfBounds(cells: { x: number; y: number }[], cols: number, rows: number) {
    return cells.every((c) => c.x < 0 || c.x >= cols || c.y < 0 || c.y >= rows);
}

function getValidRange(
    car: { x: number; y: number; dir: Car["dir"]; id: string },
    obstacles: Obstacle[],
    allCars: Car[],
    cols: number,
    rows: number
) {
    const isVertical = car.dir === "N" || car.dir === "S";
    let minDelta = 0;
    let maxDelta = 0;

    let d = 1;
    while (d <= cols + rows + SAFETY_MARGIN) {
        const testCar = {
            ...car,
            x: isVertical ? car.x : car.x + d,
            y: isVertical ? car.y + d : car.y,
        };
        const cells = getCarCells(testCar);
        const free = cells.every((c) =>
            isCellFree(c.x, c.y, cols, rows, obstacles, allCars, car.id)
        );
        if (!free) break;
        maxDelta = d;

        if (isFullyOutOfBounds(cells, cols, rows)) break;
        d++;
    }

    d = 1;
    while (d <= cols + rows + SAFETY_MARGIN) {
        const testCar = {
            ...car,
            x: isVertical ? car.x : car.x - d,
            y: isVertical ? car.y - d : car.y,
        };
        const cells = getCarCells(testCar);
        const free = cells.every((c) =>
            isCellFree(c.x, c.y, cols, rows, obstacles, allCars, car.id)
        );
        if (!free) break;
        minDelta = -d;
        if (isFullyOutOfBounds(cells, cols, rows)) break;
        d++;
    }

    return { minDelta, maxDelta };
}

interface DraggableCarProps {
    car: Car;
    carModel: Group<Object3DEventMap>;
    rotationY: number;
    cols: number;
    rows: number;
    centerOffsetCols: number;
    centerOffsetRows: number;
    obstacles: Obstacle[];
    allCars: Car[];
    onMove: (carId: string, newX: number, newY: number) => void;
    onExit: (carId: string) => void;
}

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeIntersectPoint = new THREE.Vector3();

export default memo(function DraggableCar({
    car,
    carModel,
    rotationY,
    cols,
    rows,
    centerOffsetCols,
    centerOffsetRows,
    obstacles,
    allCars,
    onMove,
    onExit,
}: DraggableCarProps) {
    const { raycaster, gl } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const isDragging = useRef(false);
    const dragOffsetPixels = useRef(0);
    const targetGridDelta = useRef(0);

    const [localPos, setLocalPos] = useState({ x: car.x, y: car.y });

    useEffect(() => {
        setLocalPos((prev) =>
            prev.x === car.x && prev.y === car.y ? prev : { x: car.x, y: car.y }
        );
    }, [car.x, car.y]);

    const dragStartRef = useRef({
        mouseX: 0,
        mouseZ: 0,
        minPixel: 0,
        maxPixel: 0,
    });

    const isVertical = car.dir === "N" || car.dir === "S";

    const getBasePosition = (cx: number, cy: number) => {
        let tx = cx;
        let ty = cy;
        if (car.dir === "N") ty++;
        else if (car.dir === "S") ty--;
        else if (car.dir === "E") tx--;
        else if (car.dir === "W") tx++;

        const midX = (cx + tx) / 2;
        const midZ = (cy + ty) / 2;
        return {
            x: (midX - centerOffsetCols) * CELL_SIZE,
            z: (midZ - centerOffsetRows) * CELL_SIZE,
        };
    };

    const basePos = getBasePosition(localPos.x, localPos.y);

    const bind = useGesture({
        onDragStart: ({ event }) => {
            event.stopPropagation();
            isDragging.current = true;

            if (event && "pointerId" in event) {
                try {
                    gl.domElement.setPointerCapture(event.pointerId);
                } catch {
                    /* */
                }
            }

            const hit = raycaster.ray.intersectPlane(plane, planeIntersectPoint);
            if (!hit) return;

            const effectiveCar = { ...car, x: localPos.x, y: localPos.y };
            const { minDelta, maxDelta } = getValidRange(
                effectiveCar,
                obstacles,
                allCars,
                cols,
                rows
            );

            dragStartRef.current = {
                mouseX: planeIntersectPoint.x,
                mouseZ: planeIntersectPoint.z,
                minPixel: minDelta * CELL_SIZE,
                maxPixel: maxDelta * CELL_SIZE,
            };
            dragOffsetPixels.current = 0;
            targetGridDelta.current = 0;
        },

        onDrag: ({ event }) => {
            if (!isDragging.current) return;
            event.stopPropagation();

            const hit = raycaster.ray.intersectPlane(plane, planeIntersectPoint);
            if (!hit) return;

            const deltaX = planeIntersectPoint.x - dragStartRef.current.mouseX;
            const deltaZ = planeIntersectPoint.z - dragStartRef.current.mouseZ;

            const rawPixel = isVertical ? deltaZ : deltaX;

            const clampedPixel = Math.max(
                dragStartRef.current.minPixel,
                Math.min(dragStartRef.current.maxPixel, rawPixel)
            );

            dragOffsetPixels.current = clampedPixel;
            targetGridDelta.current = Math.round(clampedPixel / CELL_SIZE);
        },

        onDragEnd: ({ event }) => {
            isDragging.current = false;

            if (event && "pointerId" in event) {
                try {
                    const pointerEvent = event as PointerEvent;
                    gl.domElement.releasePointerCapture(pointerEvent.pointerId);
                } catch {
                    /* */
                }
            }

            const gridDelta = targetGridDelta.current;
            dragOffsetPixels.current = 0;
            targetGridDelta.current = 0;

            if (gridDelta === 0) return;

            const newX = isVertical ? localPos.x : localPos.x + gridDelta;
            const newY = isVertical ? localPos.y + gridDelta : localPos.y;

            const cells = getCarCells({ x: newX, y: newY, dir: car.dir });
            const exited = isFullyOutOfBounds(cells, cols, rows);

            setLocalPos({ x: newX, y: newY });

            if (exited) {
                onExit(car.id);
            } else {
                onMove(car.id, newX, newY);
            }
        },
    });

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const currentOffset = isDragging.current ? dragOffsetPixels.current : 0;
        const targetX = basePos.x + (isVertical ? 0 : currentOffset);
        const targetZ = basePos.z + (isVertical ? currentOffset : 0);

        const lerpFactor = Math.min(delta * 25, 1);
        groupRef.current.position.x = THREE.MathUtils.lerp(
            groupRef.current.position.x,
            targetX,
            lerpFactor
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
            groupRef.current.position.z,
            targetZ,
            lerpFactor
        );
    });

    return (
        <group ref={groupRef} position={[basePos.x, 0, basePos.z]} {...bind()}>
            <Model
                model={carModel}
                x={0}
                z={0}
                y={0.155}
                rotationY={rotationY}
                isClickable={true}
            />
        </group>
    );
});
