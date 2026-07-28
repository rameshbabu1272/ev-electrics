import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EvCursor } from "./components/shared.jsx";
import Store from "./features/store/Store.jsx";
import Admin from "./features/admin/Admin.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <EvCursor />
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/*" element={<Store />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);