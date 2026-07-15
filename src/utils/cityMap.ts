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

    private random: () => number;
    private houseRegions: Array<{ left: number; top: number; right: number; bottom: number }>;

    private static readonly HOUSE_MODELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

    private static readonly MIN_REGION_SIZE = 5;

    constructor(size: number, centerWidth: number, centerHeight: number, seed: number) {
        this.size = size;
        this.seed = seed;
        this.random = this.createRandomGenerator(seed);
        this.houseRegions = [];

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

        this.houseRegions = [];
        this.buildRoadSkeleton();
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
        return Math.floor(this.random() * (max - min + 1)) + min;
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

    private buildRoadSkeleton() {
        this.drawRectangleRoad(0, 0, this.size - 1, this.size - 1);

        this.drawLine(this.centerRingStartX, 0, this.centerRingStartX, this.size - 1);
        this.drawLine(0, this.centerRingStartY, this.size - 1, this.centerRingStartY);

        const regions = [
            { left: 0, top: 0, right: this.centerRingStartX, bottom: this.centerRingStartY },
            {
                left: this.centerRingEndX,
                top: 0,
                right: this.size - 1,
                bottom: this.centerRingStartY,
            },
            {
                left: 0,
                top: this.centerRingEndY,
                right: this.centerRingStartX,
                bottom: this.size - 1,
            },
            {
                left: this.centerRingEndX,
                top: this.centerRingEndY,
                right: this.size - 1,
                bottom: this.size - 1,
            },
        ];

        for (let i = 0; i < regions.length; i++) {
            this.subdivideRegion(regions[i], 0);
        }
    }

    private subdivideRegion(
        region: { left: number; top: number; right: number; bottom: number },
        depth: number
    ) {
        const width = region.right - region.left + 1;
        const height = region.bottom - region.top + 1;

        if (depth >= 3) {
            this.houseRegions.push(region);
            return;
        }
        if (width < CityMap.MIN_REGION_SIZE || height < CityMap.MIN_REGION_SIZE) {
            this.houseRegions.push(region);
            return;
        }

        const splitChance = depth === 0 ? 0.85 : depth === 1 ? 0.7 : 0.5;
        if (this.random() > splitChance) {
            this.houseRegions.push(region);
            return;
        }

        const splitVertically = width >= height ? this.random() < 0.6 : this.random() < 0.4;

        if (splitVertically && width >= CityMap.MIN_REGION_SIZE) {
            const splitX = this.randomInt(region.left + 1, region.right - 1);
            this.drawLine(splitX, region.top, splitX, region.bottom);

            this.subdivideRegion(
                { left: region.left, top: region.top, right: splitX, bottom: region.bottom },
                depth + 1
            );
            this.subdivideRegion(
                { left: splitX, top: region.top, right: region.right, bottom: region.bottom },
                depth + 1
            );
            return;
        }

        if (height >= CityMap.MIN_REGION_SIZE) {
            const splitY = this.randomInt(region.top + 1, region.bottom - 1);
            this.drawLine(region.left, splitY, region.right, splitY);

            this.subdivideRegion(
                { left: region.left, top: region.top, right: region.right, bottom: splitY },
                depth + 1
            );
            this.subdivideRegion(
                { left: region.left, top: splitY, right: region.right, bottom: region.bottom },
                depth + 1
            );
            return;
        }

        this.houseRegions.push(region);
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
        for (let i = 0; i < this.houseRegions.length; i++) {
            const region = this.houseRegions[i];
            this.carveHouseRegionStreets(region);

            const patternId = Math.floor(
                this.hashNoise(this.seed, region.left + i * 31, region.top + i * 17) * 6
            );

            const baseModel = this.pickHouseModel(region.left, region.top, 0);
            const secondaryModel = this.pickHouseModel(region.right, region.bottom, 1);
            const tertiaryModel = this.pickHouseModel(
                region.left + region.right,
                region.top + region.bottom,
                2
            );

            for (let y = region.top; y <= region.bottom; y++) {
                for (let x = region.left; x <= region.right; x++) {
                    if (!this.isHouse(x, y)) continue;

                    const value = this.pickPatternValue(
                        patternId,
                        region,
                        x,
                        y,
                        baseModel,
                        secondaryModel,
                        tertiaryModel
                    );

                    this.map[y][x] = value;
                }
            }
        }
    }

    private carveHouseRegionStreets(region: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }) {
        const xOffset = 1 + Math.floor(this.hashNoise(this.seed, region.left, region.top) * 2);
        const yOffset = 1 + Math.floor(this.hashNoise(this.seed, region.right, region.bottom) * 2);

        for (let x = region.left + xOffset; x < region.right; x += 3) {
            this.drawLine(x, region.top, x, region.bottom);
        }

        for (let y = region.top + yOffset; y < region.bottom; y += 3) {
            this.drawLine(region.left, y, region.right, y);
        }
    }

    private pickPatternValue(
        patternId: number,
        region: { left: number; top: number; right: number; bottom: number },
        x: number,
        y: number,
        baseModel: string,
        secondaryModel: string,
        tertiaryModel: string
    ) {
        const width = region.right - region.left + 1;
        const height = region.bottom - region.top + 1;
        const localX = x - region.left;
        const localY = y - region.top;

        if (width <= 2 || height <= 2) {
            return baseModel;
        }

        if (patternId === 0) {
            return baseModel;
        }

        if (patternId === 1) {
            return localX < Math.ceil(width / 2) ? baseModel : secondaryModel;
        }

        if (patternId === 2) {
            return localY < Math.ceil(height / 2) ? baseModel : secondaryModel;
        }

        if (patternId === 3) {
            return (localX + localY) % 2 === 0 ? baseModel : secondaryModel;
        }

        if (patternId === 4) {
            const onBorder =
                localX === 0 || localY === 0 || localX === width - 1 || localY === height - 1;
            return onBorder ? baseModel : tertiaryModel;
        }

        const quadrantX = localX < Math.ceil(width / 2) ? 0 : 1;
        const quadrantY = localY < Math.ceil(height / 2) ? 0 : 1;

        if (quadrantX === 0 && quadrantY === 0) return baseModel;
        if (quadrantX === 1 && quadrantY === 0) return secondaryModel;
        if (quadrantX === 0 && quadrantY === 1) return tertiaryModel;

        return CityMap.HOUSE_MODELS[
            (CityMap.HOUSE_MODELS.indexOf(baseModel) + 3) % CityMap.HOUSE_MODELS.length
        ];
    }

    private pickHouseModel(x: number, y: number, offset: number) {
        const randomValue = this.hashNoise(this.seed + offset * 1013, x, y);
        const modelIndex = Math.floor(randomValue * CityMap.HOUSE_MODELS.length);

        return CityMap.HOUSE_MODELS[modelIndex];
    }

    private hashNoise(seed: number, x: number, y: number) {
        let value = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
        value = (value ^ (value >>> 13)) >>> 0;
        value = Math.imul(value, 1274126177);
        value ^= value >>> 16;

        return (value >>> 0) / 4294967296;
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
