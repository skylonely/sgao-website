import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Navigator from "../app/Navigator";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <Navigator />
  </StrictMode>,
);
