import { Canvas } from "@react-three/fiber";

import { Camera } from "./Camera";
import { City } from "./City";
import { Light } from "./Light";

const PARKING_SIZE_HEIGHT = 3;
const PARKING_SIZE_WIDTH = 3;

export default function Scene() {
    return (
        <Canvas shadows>
            <Camera width={10} height={10} />

            <Light />

            <City width={PARKING_SIZE_WIDTH} height={PARKING_SIZE_HEIGHT} />
        </Canvas>
    );
}
