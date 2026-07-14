import Scene from "./rendering/Scene";

function App() {
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
                <Scene />
            </div>
        </div>
    );
}

export default App;
