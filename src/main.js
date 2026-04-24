import "./styles/main.css";
import { createAppShell } from "./components/appShell.js";
import { initVideoScroll } from "./scripts/videoScroll.js";

const app = document.querySelector("#app");

app.innerHTML = createAppShell();

initVideoScroll();
