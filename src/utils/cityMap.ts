export class CityMap {
    private size: number;
    private map: string[][];
    private seed: number;

    private centerStartX: number;
    private centerEndX: number;
    private centerStartY: number;
    private centerEndY: number;
    private centerRingStartX: number;
    private centerRingEndX: number;
    private centerRingStartY: number;
    private centerRingEndY: number;

    private random: (seed: number) => number;

    constructor(size: number, centerWidth: number, centerHeight: number, seed: number) {
        this.size = size;
        this.seed = seed;
        this.random = this.createRandomGenerator(seed);

        this.map = [];

        this.centerStartX = Math.floor((this.size - centerWidth) / 2);
        this.centerEndX = this.centerStartX + centerWidth - 1;
        this.centerStartY = Math.floor((this.size - centerHeight) / 2);
        this.centerEndY = this.centerStartY + centerHeight - 1;

        this.centerRingStartX = this.centerStartX - 1;
        this.centerRingEndX = this.centerEndX + 1;
        this.centerRingStartY = this.centerStartY - 1;
        this.centerRingEndY = this.centerEndY + 1;
    }

    /**
     * X = route
     * O = maison
     * P = centre
     * @param seed Random seed for generating the city map
     */
    public generateCityMap(): string[][] {
        if (this.map.length > 0) return this.map;

        this.map = Array.from({ length: this.size }, () => Array(this.size).fill("O"));

        this.clearMap();
        this.buildCenter();

        const districtOrder = ["nw", "ne", "sw", "se"];

        for (let i = 0; i < districtOrder.length; i++) {
            if (this.random(this.seed) < 0.85 || i < 2) {
                this.buildCornerDistrict(districtOrder[i]);
            }
        }

        for (let i = 0; i < 2; i++) {
            if (this.random(this.seed) < 0.9) {
                this.carveUsefulCorridors();
            }
        }

        this.breakHouseBlocks();
        this.randomizeHouses();

        return this.map;
    }

    private clearMap() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.map[y][x] = "O";
            }
        }
    }

    private randomInt(min: number, max: number) {
        return Math.floor(this.random(this.seed) * (max - min + 1)) + min;
    }

    private inside(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.size && y < this.size;
    }

    private isRoad(x: number, y: number) {
        return this.inside(x, y) && this.map[y][x] === "X";
    }

    private isHouse(x: number, y: number) {
        return this.inside(x, y) && this.map[y][x] === "O";
    }

    private neighbours(x: number, y: number) {
        return [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
        ];
    }

    private place(x: number, y: number, value: string) {
        if (!this.inside(x, y)) return false;
        if (this.map[y][x] === "P") return false;

        this.map[y][x] = value;
        return true;
    }

    private wouldCreateFull2x2(x: number, y: number) {
        const topLeftCandidates = [
            [x - 1, y - 1],
            [x, y - 1],
            [x - 1, y],
            [x, y],
        ];

        for (let i = 0; i < topLeftCandidates.length; i++) {
            const [topLeftX, topLeftY] = topLeftCandidates[i];

            let roadCount = 0;

            for (let dy = 0; dy <= 1; dy++) {
                for (let dx = 0; dx <= 1; dx++) {
                    const cx = topLeftX + dx;
                    const cy = topLeftY + dy;

                    if (!this.inside(cx, cy)) continue;

                    if (cx === x && cy === y) {
                        roadCount += 1;
                    } else if (this.isRoad(cx, cy)) {
                        roadCount += 1;
                    }
                }
            }

            if (roadCount === 4) return true;
        }

        return false;
    }

    private road(x: number, y: number) {
        if (!this.inside(x, y)) return false;
        if (this.map[y][x] === "P") return false;
        if (this.wouldCreateFull2x2(x, y)) return false;

        this.map[y][x] = "X";
        return true;
    }

    private countRoadNeighbours(x: number, y: number) {
        let count = 0;

        for (let i = 0; i < this.neighbours(x, y).length; i++) {
            const [nx, ny] = this.neighbours(x, y)[i];

            if (this.isRoad(nx, ny)) {
                count += 1;
            }
        }

        return count;
    }

    private drawRectangleRoad(left: number, top: number, right: number, bottom: number) {
        if (right <= left || bottom <= top) return false;

        for (let x = left; x <= right; x++) {
            this.road(x, top);
            this.road(x, bottom);
        }
    }

    private drawLine(x1: number, y1: number, x2: number, y2: number) {
        if (x1 === x2) {
            const step = y1 <= y2 ? 1 : -1;
            for (let y = y1; y !== y2 + step; y += step) {
                this.road(x1, y);
            }

            return;
        }

        if (y1 === y2) {
            const step = x1 <= x2 ? 1 : -1;
            for (let x = x1; x !== x2 + step; x += step) {
                this.road(x, y1);
            }
        }
    }

    private buildCenter() {
        for (let y = this.centerStartY; y <= this.centerEndY; y++) {
            for (let x = this.centerStartX; x <= this.centerEndX; x++) {
                this.place(x, y, "P");
            }
        }

        this.drawRectangleRoad(
            this.centerRingStartX,
            this.centerRingStartY,
            this.centerRingEndX,
            this.centerRingEndY
        );
    }

    private buildCornerDistrict(side: string) {
        const size = this.randomInt(3, 4);
        let left = 0;
        let top = 0;

        if (side === "ne") {
            left = this.size - size;
            top = 0;
        } else if (side === "sw") {
            left = 0;
            top = this.size - size;
        } else if (side === "se") {
            left = this.size - size;
            top = this.size - size;
        }

        const right = left + size - 1;
        const bottom = top + size - 1;

        this.drawRectangleRoad(left, top, right, bottom);

        const midX = Math.floor((left + right) / 2);
        const midY = Math.floor((top + bottom) / 2);

        if (side === "nw") {
            this.drawLine(right, midY, this.centerRingStartX, midY);
            this.drawLine(
                this.centerRingStartX,
                midY,
                this.centerRingStartX,
                this.centerRingStartY
            );
        } else if (side === "ne") {
            this.drawLine(left, midY, this.centerRingEndX, midY);
            this.drawLine(this.centerRingEndX, midY, this.centerRingEndX, this.centerRingStartY);
        } else if (side === "sw") {
            this.drawLine(midX, top, midX, this.centerRingEndY);
            this.drawLine(midX, this.centerRingEndY, this.centerRingStartX, this.centerRingEndY);
        } else if (side === "se") {
            this.drawLine(midX, top, midX, this.centerRingEndY);
            this.drawLine(midX, this.centerRingEndY, this.centerRingEndX, this.centerRingEndY);
        }
    }

    private carveUsefulCorridors() {
        const candidates = [];

        for (let y = 1; y < this.size - 1; y++) {
            const roadXs = [];

            for (let x = 0; x < this.size; x++) {
                if (this.isRoad(x, y)) {
                    roadXs.push(x);
                }
            }

            if (roadXs.length >= 2) {
                candidates.push({
                    axis: "h",
                    index: y,
                    start: roadXs[0],
                    end: roadXs[roadXs.length - 1],
                    span: roadXs[roadXs.length - 1] - roadXs[0],
                });
            }
        }

        for (let x = 1; x < this.size - 1; x++) {
            const roadYs = [];

            for (let y = 0; y < this.size; y++) {
                if (this.isRoad(x, y)) {
                    roadYs.push(y);
                }
            }

            if (roadYs.length >= 2) {
                candidates.push({
                    axis: "v",
                    index: x,
                    start: roadYs[0],
                    end: roadYs[roadYs.length - 1],
                    span: roadYs[roadYs.length - 1] - roadYs[0],
                });
            }
        }

        candidates.sort((left, right) => right.span - left.span);

        const limit = Math.min(5, candidates.length);

        for (let i = 0; i < limit; i++) {
            const pickIndex = this.randomInt(0, Math.min(7, candidates.length) - 1);
            const corridor = candidates.splice(pickIndex, 1)[0];

            if (corridor.axis === "h") {
                this.drawLine(corridor.start, corridor.index, corridor.end, corridor.index);
            } else {
                this.drawLine(corridor.index, corridor.start, corridor.index, corridor.end);
            }
        }
    }

    private breakHouseBlocks() {
        for (let pass = 0; pass < 4; pass++) {
            let changed = false;

            for (let y = 0; y < this.size - 1; y++) {
                for (let x = 0; x < this.size - 1; x++) {
                    if (
                        !this.isHouse(x, y) ||
                        !this.isHouse(x + 1, y) ||
                        !this.isHouse(x, y + 1) ||
                        !this.isHouse(x + 1, y + 1)
                    ) {
                        continue;
                    }

                    const candidates = [
                        [x, y],
                        [x + 1, y],
                        [x, y + 1],
                        [x + 1, y + 1],
                    ];

                    let bestX = -1;
                    let bestY = -1;
                    let bestScore = -1;

                    for (let i = 0; i < candidates.length; i++) {
                        const [candidateX, candidateY] = candidates[i];
                        const score = this.countRoadNeighbours(candidateX, candidateY);

                        if (score > bestScore) {
                            bestScore = score;
                            bestX = candidateX;
                            bestY = candidateY;
                        }
                    }

                    if (bestScore >= 2 && this.road(bestX, bestY)) {
                        changed = true;
                        continue;
                    }

                    const topRowClear = this.isHouse(x, y) && this.isHouse(x + 1, y);
                    const bottomRowClear = this.isHouse(x, y + 1) && this.isHouse(x + 1, y + 1);

                    if (topRowClear) {
                        let leftRoad = -1;
                        let rightRoad = -1;

                        for (let leftX = x - 1; leftX >= 0; leftX--) {
                            if (this.isRoad(leftX, y)) {
                                leftRoad = leftX;
                                break;
                            }
                        }

                        for (let rightX = x + 2; rightX < this.size; rightX++) {
                            if (this.isRoad(rightX, y)) {
                                rightRoad = rightX;
                                break;
                            }
                        }

                        if (leftRoad !== -1 && rightRoad !== -1) {
                            this.drawLine(leftRoad, y, rightRoad, y);
                            changed = true;
                            continue;
                        }
                    }

                    if (bottomRowClear) {
                        let leftRoad = -1;
                        let rightRoad = -1;

                        for (let leftX = x - 1; leftX >= 0; leftX--) {
                            if (this.isRoad(leftX, y + 1)) {
                                leftRoad = leftX;
                                break;
                            }
                        }

                        for (let rightX = x + 2; rightX < this.size; rightX++) {
                            if (this.isRoad(rightX, y + 1)) {
                                rightRoad = rightX;
                                break;
                            }
                        }

                        if (leftRoad !== -1 && rightRoad !== -1) {
                            this.drawLine(leftRoad, y + 1, rightRoad, y + 1);
                            changed = true;
                            continue;
                        }
                    }

                    const leftColumnClear = this.isHouse(x, y) && this.isHouse(x, y + 1);
                    const rightColumnClear = this.isHouse(x + 1, y) && this.isHouse(x + 1, y + 1);

                    if (leftColumnClear) {
                        let topRoad = -1;
                        let bottomRoad = -1;

                        for (let topY = y - 1; topY >= 0; topY--) {
                            if (this.isRoad(x, topY)) {
                                topRoad = topY;
                                break;
                            }
                        }

                        for (let bottomY = y + 2; bottomY < this.size; bottomY++) {
                            if (this.isRoad(x, bottomY)) {
                                bottomRoad = bottomY;
                                break;
                            }
                        }

                        if (topRoad !== -1 && bottomRoad !== -1) {
                            this.drawLine(x, topRoad, x, bottomRoad);
                            changed = true;
                            continue;
                        }
                    }

                    if (rightColumnClear) {
                        let topRoad = -1;
                        let bottomRoad = -1;

                        for (let topY = y - 1; topY >= 0; topY--) {
                            if (this.isRoad(x + 1, topY)) {
                                topRoad = topY;
                                break;
                            }
                        }

                        for (let bottomY = y + 2; bottomY < this.size; bottomY++) {
                            if (this.isRoad(x + 1, bottomY)) {
                                bottomRoad = bottomY;
                                break;
                            }
                        }

                        if (topRoad !== -1 && bottomRoad !== -1) {
                            this.drawLine(x + 1, topRoad, x + 1, bottomRoad);
                            changed = true;
                        }
                    }
                }
            }

            if (!changed) {
                break;
            }
        }
    }

    private randomizeHouses() {
        const houseModels = [
            { model: "A", probability: 0.125 },
            { model: "B", probability: 0.125 },
            { model: "C", probability: 0.125 },
            { model: "D", probability: 0.125 },
            { model: "E", probability: 0.125 },
            { model: "F", probability: 0.125 },
            { model: "G", probability: 0.125 },
            { model: "H", probability: 0.125 },
        ];

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.isHouse(x, y)) {
                    const randomValue = this.random(this.seed + x * 374761393 + y * 668265263);

                    let cumulativeProbability = 0;
                    for (let i = 0; i < houseModels.length; i++) {
                        cumulativeProbability += houseModels[i].probability;
                        if (randomValue < cumulativeProbability) {
                            this.map[y][x] = houseModels[i].model;
                            break;
                        }
                    }
                }
            }
        }
    }

    private createRandomGenerator(seed: number): () => number {
        return function () {
            let t = (seed += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
}
