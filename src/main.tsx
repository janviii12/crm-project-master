import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
console.log('ENV_TEST:', import.meta.env.VITE_API_BASE_URL)
console.log('ENV_TEST:', import.meta.env.VITE_API_BASE_URL)
