// Mount the application once. StrictMode checks effect cleanup in development;
// route selection and lazy loading belong to App.js.
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
