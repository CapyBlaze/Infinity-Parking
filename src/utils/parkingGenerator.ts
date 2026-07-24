export type Direction = "N" | "S" | "E" | "W";

export interface Car {
    id: string;
    dir: Direction;
    x: number;
    y: number;
    style: number;
}

export interface Obstacle {
    x: number;
    y: number;
}

export interface LevelData {
    cars: Car[];
    obstacles: Obstacle[];
}

export class ParkingGenerator {
    private sizeWidth: number;
    private sizeHeight: number;
    private difficulty: number;
    private random: () => number;
    private levelData: LevelData;

    constructor(width: number, height: number, seed: number, difficulty: number) {
        this.sizeWidth = width;
        this.sizeHeight = height;
        this.difficulty = difficulty;
        this.random = this.randomGenerator(seed);
        this.levelData = { cars: [], obstacles: [] };
    }

    public generateParking(): LevelData {
        if (this.levelData.cars.length > 0 || this.levelData.obstacles.length > 0)
            return this.levelData;

        const cols = this.sizeWidth * 4;
        const rows = this.sizeHeight * 4;
        const totalCells = cols * rows;

        // Density factor (Level 1 -> 30%, Level 2 -> 40%, Level 3 -> 50%)
        const densityFactor = 0.25 + this.difficulty * 0.08;

        const targetCars = Math.floor((totalCells * densityFactor) / 2);
        const numObstacles = Math.floor(totalCells * (0.02 * this.difficulty));

        const cars: Car[] = [];
        const obstacles: Obstacle[] = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        let obsPlaced = 0;
        let fails = 0;
        while (obsPlaced < numObstacles && fails < 200) {
            const x = Math.floor(this.random() * cols);
            const y = Math.floor(this.random() * rows);
            if (!obstacles.some((o) => o.x === x && o.y === y)) {
                obstacles.push({ x, y });
                obsPlaced++;
            } else {
                fails++;
            }
        }

        const dirs: Direction[] = ["N", "S", "E", "W"];
        let carsPlaced = 0;
        fails = 0;

        while (carsPlaced < targetCars && fails < 15000) {
            fails++;
            const x = Math.floor(this.random() * cols);
            const y = Math.floor(this.random() * rows);
            const dir = dirs[Math.floor(this.random() * 4)];

            let tx = x;
            let ty = y;
            if (dir === "N") ty++;
            if (dir === "S") ty--;
            if (dir === "E") tx--;
            if (dir === "W") tx++;

            if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) continue;

            if (obstacles.some((o) => (o.x === x && o.y === y) || (o.x === tx && o.y === ty)))
                continue;

            const overlap = cars.some((c) => {
                let ctx = c.x;
                let cty = c.y;
                if (c.dir === "N") cty++;
                if (c.dir === "S") cty--;
                if (c.dir === "E") ctx--;
                if (c.dir === "W") ctx++;
                return (
                    (c.x === x && c.y === y) ||
                    (ctx === x && cty === y) ||
                    (c.x === tx && c.y === ty) ||
                    (ctx === tx && cty === ty)
                );
            });

            if (overlap) continue;

            cars.push({
                id: alphabet[carsPlaced % alphabet.length],
                dir,
                x,
                y,
                style: Math.floor(this.random() * 5) + 1,
            });
            carsPlaced++;
        }

        this.levelData = { cars, obstacles };
        return this.levelData;
    }

    private randomGenerator(seed: number): () => number {
        let state = seed >>> 0;
        return function () {
            state = (state + 0x6d2b79f5) >>> 0;
            let t = state;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
}
