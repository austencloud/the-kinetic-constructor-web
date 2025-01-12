import React from "react";
import ReactDOM from "react-dom";
import "./index.css"; // Add global styles if needed
import MainWidget from "./components/MainWidget/MainWidget";

ReactDOM.render(
  <React.StrictMode>
    <MainWidget />
  </React.StrictMode>,
  document.getElementById("root")
);
