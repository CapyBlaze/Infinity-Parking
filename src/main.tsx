import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Game from "./Game.tsx";
import "./ui/style/index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Game />
    </StrictMode>
);
