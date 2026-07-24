import { useEffect } from "react";

import { Canvas } from "@react-three/fiber";

import { Camera } from "./rendering/Camera";
import { City } from "./rendering/City";
import { Light } from "./rendering/Light";
import { Parking } from "./rendering/Parking";
import { useGameStore } from "./store/useGameStore";
import GameUI from "./ui/GameUI";

const PARKING_SIZE_HEIGHT = 3;
const PARKING_SIZE_WIDTH = 3;

const DIFFICULTY = 1;
const LEVEL = 1;
const IS_NIGHT = false;

export default function Game() {
    const isTimerRunning = useGameStore((state) => state.isTimerRunning);
    const incrementTime = useGameStore((state) => state.incrementTime);
    const startTimer = useGameStore((state) => state.startTimer);

    const setLevel = useGameStore((state) => state.setLevel);

    useEffect(() => {
        setLevel(LEVEL, "Parking Lot", 0);
    }, [setLevel]);

    useEffect(() => {
        startTimer();
    }, [startTimer]);

    useEffect(() => {
        let interval: number;

        if (isTimerRunning) {
            interval = setInterval(() => {
                incrementTime();
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTimerRunning, incrementTime]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                }}
            >
                <Canvas shadows>
                    <Camera width={PARKING_SIZE_WIDTH} height={PARKING_SIZE_HEIGHT} />
                    <Light isNight={IS_NIGHT} />

                    <City width={PARKING_SIZE_WIDTH} height={PARKING_SIZE_HEIGHT} seed={LEVEL} />

                    <Parking
                        width={PARKING_SIZE_WIDTH}
                        height={PARKING_SIZE_HEIGHT}
                        seed={LEVEL}
                        difficulty={DIFFICULTY}
                    />
                </Canvas>

                <GameUI />
            </div>
        </div>
    );
}
