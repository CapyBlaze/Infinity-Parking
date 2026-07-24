import { create } from "zustand";

interface GameState {
    resetLevel: number;
    triggerResetLevel: () => void;
    cameraRotation: number;
    setCameraRotation: (angle: number) => void;

    carsLeft: number;
    setCarsLeft: (count: number) => void;

    level: number;
    levelName: string;
    starsEarned: number;
    setLevel: (level: number, levelName: string, starsEarned: number) => void;

    time: number;
    isTimerRunning: boolean;
    incrementTime: () => void;
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    resetLevel: 0,
    triggerResetLevel: () =>
        set((state) => ({
            resetLevel: state.resetLevel + 1,
            cameraRotation: 180,
            time: 0,
        })),
    cameraRotation: 180,
    setCameraRotation: (angle) => set({ cameraRotation: angle }),

    carsLeft: 0,
    setCarsLeft: (count) => set({ carsLeft: count }),

    level: 1,
    levelName: "Parking Lot",
    starsEarned: 0,
    setLevel: (level, levelName, starsEarned) => set({ level, levelName, starsEarned }),

    time: 0,
    isTimerRunning: false,
    incrementTime: () => set((state) => ({ time: state.time + 1 })),
    startTimer: () => set({ isTimerRunning: true }),
    stopTimer: () => set({ isTimerRunning: false }),
    resetTimer: () => set({ time: 0 }),
}));
