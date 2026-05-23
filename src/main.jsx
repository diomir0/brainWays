import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./brainWays.css";
import BrainPathways from "./components/BrainPathways.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrainPathways />
  </StrictMode>,
);
