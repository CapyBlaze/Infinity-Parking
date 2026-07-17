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
        this.buildFrameDistricts();
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

        for (let x = 0; x < this.sizeWidth; x++) {
            this.place(x, this.centerRingStartY, "R");
            this.place(x, this.centerRingEndY, "R");
        }

        for (let y = 0; y < this.sizeHeight; y++) {
            this.place(this.centerRingStartX, y, "R");
            this.place(this.centerRingEndX, y, "R");
        }
    }

    private buildFrameDistricts() {
        const xSlices: Array<[number, number]> = [
            [0, this.centerRingStartX - 1],
            [this.centerRingStartX + 1, this.centerRingEndX - 1],
            [this.centerRingEndX + 1, this.sizeWidth - 1],
        ];

        const ySlices: Array<[number, number]> = [
            [0, this.centerRingStartY - 1],
            [this.centerRingStartY + 1, this.centerRingEndY - 1],
            [this.centerRingEndY + 1, this.sizeHeight - 1],
        ];

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (row === 1 && col === 1) continue;

                const [left, right] = xSlices[col];
                const [top, bottom] = ySlices[row];

                if (right < left || bottom < top) continue;

                this.subdivide(left, top, right, bottom);
            }
        }
    }

    private subdivide(left: number, top: number, right: number, bottom: number) {
        const MIN_DISTRICT = 3;
        const MIN_SIZE = 4;

        const width = right - left + 1;
        const height = bottom - top + 1;

        if (width <= 0 || height <= 0) return;
        if (width <= MIN_DISTRICT || height <= MIN_DISTRICT) return;

        const canSplitVertically = width > 2;
        const canSplitHorizontally = height > 2;

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
