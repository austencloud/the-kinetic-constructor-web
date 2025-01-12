import React from "react";
import ReactDOM from "react-dom";
import "./index.css"; // Add global styles if needed
import MainApp from "./components/MainApp/MainApp";

ReactDOM.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
  document.getElementById("root")
);
