export class CityMap {
    private map: string[][];
    private sizeWidth: number;
    private sizeHeight: number;

    private centerStartX: number;
    private centerEndX: number;
    private centerStartY: number;
    private centerEndY: number;
    private centerRingStartX: number;
    private centerRingEndX: number;
    private centerRingStartY: number;
    private centerRingEndY: number;

    private random: () => number;

    constructor(borderSize: number, centerWidth: number, centerHeight: number, seed: number) {
        this.random = this.randomGenerator(seed);
        this.sizeWidth = borderSize * 2 + centerWidth;
        this.sizeHeight = borderSize * 2 + centerHeight;

        this.map = [];

        this.centerStartX = borderSize;
        this.centerEndX = this.centerStartX + centerWidth - 1;
        this.centerStartY = borderSize;
        this.centerEndY = this.centerStartY + centerHeight - 1;

        this.centerRingStartX = this.centerStartX - 1;
        this.centerRingEndX = this.centerEndX + 1;
        this.centerRingStartY = this.centerStartY - 1;
        this.centerRingEndY = this.centerEndY + 1;
    }

    /**
     * R = route
     * O = maison (remplacée ensuite par A..H)
     * P = parking
     */
    public generateCityMap(): string[][] {
        if (this.map.length > 0) return this.map;

        this.map = Array.from({ length: this.sizeHeight }, () => Array(this.sizeWidth).fill("O"));

        this.buildCenter();
        this.buildDynamicDistricts();

        this.cleanThickRoads();
        this.randomizeHouses();

        return this.map;
    }

    private inside(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.sizeWidth && y < this.sizeHeight;
    }

    private randomInt(min: number, max: number) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    private place(x: number, y: number, value: string) {
        if (!this.inside(x, y)) return;
        if (this.map[y][x] === "P") return;
        this.map[y][x] = value;
    }

    private buildCenter() {
        for (let y = this.centerStartY; y <= this.centerEndY; y++) {
            for (let x = this.centerStartX; x <= this.centerEndX; x++) {
                this.place(x, y, "P");
            }
        }

        for (let x = this.centerRingStartX; x <= this.centerRingEndX; x++) {
            this.place(x, this.centerRingStartY, "R");
            this.place(x, this.centerRingEndY, "R");
        }

        for (let y = this.centerRingStartY; y <= this.centerRingEndY; y++) {
            this.place(this.centerRingStartX, y, "R");
            this.place(this.centerRingEndX, y, "R");
        }
    }

    private buildDynamicDistricts() {
        const dirTL = this.random() < 0.5 ? "UP" : "LEFT";
        const dirTR = this.random() < 0.5 ? "UP" : "RIGHT";
        const dirBL = this.random() < 0.5 ? "DOWN" : "LEFT";
        const dirBR = this.random() < 0.5 ? "DOWN" : "RIGHT";

        if (dirTL === "UP") {
            for (let y = 0; y < this.centerRingStartY; y++) {
                this.place(this.centerRingStartX, y, "R");
            }
        } else {
            for (let x = 0; x < this.centerRingStartX; x++) {
                this.place(x, this.centerRingStartY, "R");
            }
        }

        if (dirTR === "UP") {
            for (let y = 0; y < this.centerRingStartY; y++) this.place(this.centerRingEndX, y, "R");
        } else {
            for (let x = this.centerRingEndX + 1; x < this.sizeWidth; x++)
                this.place(x, this.centerRingStartY, "R");
        }

        if (dirBL === "DOWN") {
            for (let y = this.centerRingEndY + 1; y < this.sizeHeight; y++)
                this.place(this.centerRingStartX, y, "R");
        } else {
            for (let x = 0; x < this.centerRingStartX; x++) this.place(x, this.centerRingEndY, "R");
        }

        if (dirBR === "DOWN") {
            for (let y = this.centerRingEndY + 1; y < this.sizeHeight; y++)
                this.place(this.centerRingEndX, y, "R");
        } else {
            for (let x = this.centerRingEndX + 1; x < this.sizeWidth; x++)
                this.place(x, this.centerRingEndY, "R");
        }

        const sides = [0, 1, 2, 3];
        for (let i = sides.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [sides[i], sides[j]] = [sides[j], sides[i]];
        }
        const mainSides = [sides[0], sides[1]];

        for (const side of mainSides) {
            if (side === 0) {
                const rx = this.randomInt(this.centerRingStartX + 1, this.centerRingEndX - 1);
                for (let y = 0; y < this.centerRingStartY; y++) this.place(rx, y, "R");
            } else if (side === 1) {
                const ry = this.randomInt(this.centerRingStartY + 1, this.centerRingEndY - 1);
                for (let x = this.centerRingEndX + 1; x < this.sizeWidth; x++)
                    this.place(x, ry, "R");
            } else if (side === 2) {
                const rx = this.randomInt(this.centerRingStartX + 1, this.centerRingEndX - 1);
                for (let y = this.centerRingEndY + 1; y < this.sizeHeight; y++)
                    this.place(rx, y, "R");
            } else if (side === 3) {
                const ry = this.randomInt(this.centerRingStartY + 1, this.centerRingEndY - 1);
                for (let x = 0; x < this.centerRingStartX; x++) this.place(x, ry, "R");
            }
        }

        const districts: Array<[number, number, number, number]> = [];
        const visited = Array.from({ length: this.sizeHeight }, () =>
            Array(this.sizeWidth).fill(false)
        );

        for (let y = 0; y < this.sizeHeight; y++) {
            for (let x = 0; x < this.sizeWidth; x++) {
                if (this.map[y][x] === "O" && !visited[y][x]) {
                    let w = 0;
                    while (
                        x + w < this.sizeWidth &&
                        this.map[y][x + w] === "O" &&
                        !visited[y][x + w]
                    ) {
                        w++;
                    }

                    let h = 0;
                    let valid = true;
                    while (y + h < this.sizeHeight && valid) {
                        for (let i = 0; i < w; i++) {
                            if (this.map[y + h][x + i] !== "O" || visited[y + h][x + i]) {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) h++;
                    }

                    for (let dy = 0; dy < h; dy++) {
                        for (let dx = 0; dx < w; dx++) {
                            visited[y + dy][x + dx] = true;
                        }
                    }

                    districts.push([x, y, x + w - 1, y + h - 1]);
                }
            }
        }

        for (const [left, top, right, bottom] of districts) {
            this.subdivide(left, top, right, bottom);
        }
    }

    private subdivide(left: number, top: number, right: number, bottom: number) {
        const MIN_SIZE = 3;

        const width = right - left + 1;
        const height = bottom - top + 1;

        if (width <= 0 || height <= 0) return;

        const canSplitVertically = width >= 2 * MIN_SIZE + 1;
        const canSplitHorizontally = height >= 2 * MIN_SIZE + 1;

        if (!canSplitVertically && !canSplitHorizontally) return;
        if (this.random() < 0.15) return;

        let splitVertically: boolean;
        if (canSplitVertically && canSplitHorizontally) {
            const bias = width / (width + height);
            splitVertically = this.random() < bias;
        } else {
            splitVertically = canSplitVertically;
        }

        if (splitVertically) {
            const splitX = this.randomInt(left + MIN_SIZE, right - MIN_SIZE);

            for (let y = top; y <= bottom; y++) {
                this.place(splitX, y, "R");
            }

            this.subdivide(left, top, splitX - 1, bottom);
            this.subdivide(splitX + 1, top, right, bottom);
        } else {
            const splitY = this.randomInt(top + MIN_SIZE, bottom - MIN_SIZE);

            for (let x = left; x <= right; x++) {
                this.place(x, splitY, "R");
            }

            this.subdivide(left, top, right, splitY - 1);
            this.subdivide(left, splitY + 1, right, bottom);
        }
    }

    private cleanThickRoads() {
        let found = true;

        while (found) {
            found = false;
            for (let y = 0; y < this.sizeHeight - 1; y++) {
                for (let x = 0; x < this.sizeWidth - 1; x++) {
                    if (
                        this.map[y][x] === "R" &&
                        this.map[y][x + 1] === "R" &&
                        this.map[y + 1][x] === "R" &&
                        this.map[y + 1][x + 1] === "R"
                    ) {
                        found = true;

                        const tlExtends = this.isRoad(x - 1, y) || this.isRoad(x, y - 1);
                        const trExtends = this.isRoad(x + 2, y) || this.isRoad(x + 1, y - 1);
                        const blExtends = this.isRoad(x - 1, y + 1) || this.isRoad(x, y + 2);
                        const brExtends = this.isRoad(x + 2, y + 1) || this.isRoad(x + 1, y + 2);

                        if (!tlExtends) {
                            this.map[y][x] = "O";
                        } else if (!trExtends) {
                            this.map[y][x + 1] = "O";
                        } else if (!blExtends) {
                            this.map[y + 1][x] = "O";
                        } else if (!brExtends) {
                            this.map[y + 1][x + 1] = "O";
                        } else {
                            this.map[y][x] = "O";
                        }
                    }
                }
            }
        }
    }

    private isRoad(x: number, y: number): boolean {
        if (!this.inside(x, y)) return false;
        return this.map[y][x] === "R";
    }

    private randomizeHouses() {
        const houseModels = ["A", "B", "C", "D", "E", "F", "G", "H"];

        for (let y = 0; y < this.sizeHeight; y++) {
            for (let x = 0; x < this.sizeWidth; x++) {
                if (this.map[y][x] === "O") {
                    const index = Math.floor(this.random() * houseModels.length);
                    this.map[y][x] = houseModels[index];
                }
            }
        }
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
