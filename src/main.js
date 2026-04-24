import "./styles/main.css";
import { createAppShell } from "./components/appShell.js";

const app = document.querySelector("#app");

app.innerHTML = createAppShell();
