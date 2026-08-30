import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// NOTE: no React.StrictMode — drei's ScrollControls calls createRoot on the
// shared container, which StrictMode's double-mount breaks (duplicate DOM +
// "createRoot on a container already passed" errors).
createRoot(document.getElementById("root")!).render(<App />);
