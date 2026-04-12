import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BrainPathways from "./brainWays.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrainPathways />
  </StrictMode>,
);
