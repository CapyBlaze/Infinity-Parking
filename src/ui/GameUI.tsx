import { useGameStore } from "../store/useGameStore";

export default function GameUI() {
    const rotation = useGameStore((state) => state.cameraRotation);
    const setRotation = useGameStore((state) => state.setCameraRotation);
    const triggerResetLevel = useGameStore((state) => state.triggerResetLevel);

    const carsLeft = useGameStore((state) => state.carsLeft);

    const level = useGameStore((state) => state.level);
    const levelName = useGameStore((state) => state.levelName);
    const starsEarned = useGameStore((state) => state.starsEarned);
    const time = useGameStore((state) => state.time);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-start",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "10px",
                    top: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "flex-start",
                }}
            >
                <div
                    className="container"
                    style={{
                        width: "fit-content",
                        height: "fit-content",
                        padding: "5px",
                        textTransform: "uppercase",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                    }}
                >
                    <h1 style={{ fontSize: "22px" }}>
                        Level {level}: {levelName}
                    </h1>
                </div>

                <div
                    className="container"
                    style={{
                        width: "fit-content",
                        height: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: "6px",
                        padding: "5px",
                    }}
                >
                    {Array.from({ length: starsEarned }).map((_, index) => (
                        <img
                            key={index}
                            src="/ui/star.svg"
                            alt="Star"
                            style={{
                                width: "32px",
                                height: "32px",
                            }}
                        />
                    ))}
                    {Array.from({ length: 3 - starsEarned }).map((_, index) => (
                        <img
                            key={index}
                            src="/ui/star_outline.svg"
                            alt="Empty Star"
                            style={{
                                width: "32px",
                                height: "32px",
                            }}
                        />
                    ))}
                </div>
            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    pointerEvents: "auto",
                    padding: "0 14px",
                    boxSizing: "border-box",
                }}
            >
                <input
                    className="element-not-selectable slider-camera"
                    type="range"
                    style={{
                        width: "300px",
                        cursor: "pointer",
                    }}
                    min={0}
                    max={360}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                />
            </div>

            <div
                style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "flex-end",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <div
                        className="container"
                        style={{
                            width: "fit-content",
                            height: "fit-content",
                            padding: "5px",
                            textTransform: "uppercase",
                            minWidth: "71px",
                            textAlign: "center",
                        }}
                    >
                        <h1 style={{ fontSize: "18px" }}>
                            {Math.floor(time / 60)
                                .toString()
                                .padStart(2, "0")}
                            :{(time % 60).toString().padStart(2, "0")}
                        </h1>
                    </div>
                    <div
                        className="container"
                        style={{
                            width: "fit-content",
                            height: "fit-content",
                            padding: "5px",
                            textTransform: "uppercase",
                            minWidth: "145px",
                            textAlign: "center",
                        }}
                    >
                        <h1 style={{ fontSize: "18px" }}>Cars Left: {carsLeft}</h1>
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <button
                        title="Reset Level"
                        className="container"
                        style={{
                            width: "42px",
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            pointerEvents: "auto",
                        }}
                        onClick={triggerResetLevel}
                    >
                        <img
                            draggable="false"
                            className="element-not-selectable"
                            src="/ui/icon_repeat_light.svg"
                            alt="Repeat"
                            style={{ width: "60%", height: "60%" }}
                        />
                    </button>
                    <button
                        title="Home"
                        className="container"
                        style={{
                            width: "42px",
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            pointerEvents: "auto",
                        }}
                    >
                        <img
                            draggable="false"
                            className="element-not-selectable"
                            src="/ui/home.svg"
                            alt="Home"
                            style={{ width: "60%", height: "60%" }}
                        />
                    </button>
                    <button
                        title="Settings"
                        className="container"
                        style={{
                            width: "42px",
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            pointerEvents: "auto",
                        }}
                    >
                        <img
                            draggable="false"
                            className="element-not-selectable"
                            src="/ui/settings.svg"
                            alt="Settings"
                            style={{ width: "60%", height: "60%" }}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
