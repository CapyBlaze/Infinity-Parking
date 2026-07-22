import { Environment } from "@react-three/drei";

interface LightProps {
    isNight?: boolean;
}

export function Light({ isNight = false }: LightProps) {
    const config = isNight
        ? {
              background: "#0b0e14",
              sunColor: "#88aaff",
              sunIntensity: 0.8,
              sunPosition: [0, 40, 0] as [number, number, number],

              hemiSky: "#1d263b",
              hemiGround: "#080c15",
              hemiIntensity: 0.4,
              ambientColor: "#151c28",
              ambientIntensity: 0.3,
              envIntensity: 0.05,
          }
        : {
              background: "#9bc5f5",
              sunColor: "#fff2e0",
              sunIntensity: 2.8,
              sunPosition: [0, 50, 0] as [number, number, number],

              hemiSky: "#ffffff",
              hemiGround: "#9e8e81",
              hemiIntensity: 0.7,
              ambientColor: "#fff5eb",
              ambientIntensity: 0.35,
              envIntensity: 0.12,
          };

    return (
        <>
            <color attach="background" args={[config.background]} />

            <directionalLight
                castShadow
                intensity={config.sunIntensity}
                color={config.sunColor}
                position={config.sunPosition}
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0002}
                shadow-camera-left={-35}
                shadow-camera-right={35}
                shadow-camera-top={35}
                shadow-camera-bottom={-35}
            />

            <hemisphereLight
                color={config.hemiSky}
                groundColor={config.hemiGround}
                intensity={config.hemiIntensity}
            />

            <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />

            <Environment preset="park" environmentIntensity={config.envIntensity} />
        </>
    );
}
