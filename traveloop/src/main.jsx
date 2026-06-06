// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

// MAIN APP
import App from "./App";

// TAILWIND CSS
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);